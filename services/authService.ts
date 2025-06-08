import * as SecureStore from 'expo-secure-store';
import { User } from '../types/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../components/FirebaseProvider';

// Define secure storage keys
const STORAGE_KEYS = {
  USER: 'user',
  TRIAL_MINUTES: 'trial_minutes_used',
} as const;

export const authService = {
  // Store user data
  async storeUser(user: User) {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  // Get the current user from secure storage
  async getCurrentUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  },

  // Sign out
  async signOut() {
    try {
      await firebaseSignOut(auth);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Trial management
  async getTrialStatus() {
    const minutesUsedStr = await SecureStore.getItemAsync(STORAGE_KEYS.TRIAL_MINUTES);
    return {
      minutesUsed: minutesUsedStr ? parseInt(minutesUsedStr, 10) : 0,
    };
  },

  async addTrialMinutes(minutes: number) {
    const { minutesUsed } = await this.getTrialStatus();
    const newMinutes = minutesUsed + minutes;
    await SecureStore.setItemAsync(STORAGE_KEYS.TRIAL_MINUTES, newMinutes.toString());
  },
}; 