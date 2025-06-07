import { auth } from '../config/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_WEB_CLIENT_ID } from '../config/config';

WebBrowser.maybeCompleteAuthSession();

export const authService = {
  async signUp(email: string, password: string): Promise<User> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async signIn(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async signInWithGoogle(): Promise<User | null> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const authRequest = new AuthSession.AuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        redirectUri,
      });

      const result = await authRequest.promptAsync(
        {
          authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
          revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
        },
        { useProxy: true }
      );

      if (result.type === 'success' && result.params.id_token) {
        const credential = GoogleAuthProvider.credential(result.params.id_token);
        const userCred = await signInWithCredential(auth, credential);
        await AsyncStorage.setItem('user', JSON.stringify(userCred.user));
        return userCred.user;
      }

      return null;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    await signOut(auth);
    await AsyncStorage.removeItem('user');
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  async updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL
      });
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(auth.currentUser));
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Trial management
  async getTrialStatus(): Promise<{ minutesUsed: number; minutesRemaining: number }> {
    const minutesUsed = parseFloat(await AsyncStorage.getItem('trialMinutesUsed') || '0');
    const minutesRemaining = Math.max(30 - minutesUsed, 0);
    return { minutesUsed, minutesRemaining };
  },

  async addTrialMinutes(minutes: number): Promise<void> {
    const currentMinutes = parseFloat(await AsyncStorage.getItem('trialMinutesUsed') || '0');
    await AsyncStorage.setItem('trialMinutesUsed', (currentMinutes + minutes).toString());
  }
}; 