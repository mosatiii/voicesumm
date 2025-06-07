import { auth } from '../config/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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