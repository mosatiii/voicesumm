import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';

// Storage keys
const STORAGE_KEYS = {
  TRIAL_MINUTES: 'trial_minutes_used',
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data'
} as const;

const TRIAL_LIMIT_MINUTES = 30;
const DEFAULT_FREE_MINUTES = 60;

interface UserData {
  recordingMinutesRemaining: number;
  createdAt: Date;
}

export const trialService = {
  async isTrialMode(): Promise<boolean> {
    // If user is authenticated, they're not in trial mode
    const token = await this.getAuthToken();
    if (token) return false;
    
    // Check if trial minutes are still available
    const minutesUsed = await this.getTrialMinutesUsed();
    return minutesUsed < TRIAL_LIMIT_MINUTES;
  },

  async getTrialMinutesUsed(): Promise<number> {
    try {
      const minutes = await SecureStore.getItemAsync(STORAGE_KEYS.TRIAL_MINUTES);
      return minutes ? parseFloat(minutes) : 0;
    } catch (error) {
      console.error('Error reading trial minutes:', error);
      return 0;
    }
  },

  async addTrialMinutes(duration: number): Promise<void> {
    try {
      const currentMinutes = await this.getTrialMinutesUsed();
      const newTotal = currentMinutes + duration;
      await SecureStore.setItemAsync(STORAGE_KEYS.TRIAL_MINUTES, newTotal.toString());
    } catch (error) {
      console.error('Error updating trial minutes:', error);
    }
  },

  async shouldPromptSignup(): Promise<boolean> {
    // Only prompt if user is not authenticated and trial is exceeded
    const token = await this.getAuthToken();
    if (token) return false;

    const minutesUsed = await this.getTrialMinutesUsed();
    return minutesUsed >= TRIAL_LIMIT_MINUTES;
  },

  async getMinutesRemaining(): Promise<number> {
    const token = await this.getAuthToken();
    
    if (token) {
      // Get remaining minutes from backend for authenticated users
      const userData = await this.getUserData();
      return userData?.recordingMinutesRemaining ?? DEFAULT_FREE_MINUTES;
    } else {
      // Calculate remaining trial minutes
      const minutesUsed = await this.getTrialMinutesUsed();
      return Math.max(0, TRIAL_LIMIT_MINUTES - minutesUsed);
    }
  },

  async resetTrialUsage(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TRIAL_MINUTES);
    } catch (error) {
      console.error('Error resetting trial usage:', error);
    }
  },

  async migrateToAuthenticatedUser(): Promise<void> {
    try {
      // Reset trial usage since user is now authenticated
      await this.resetTrialUsage();
    } catch (error) {
      console.error('Error migrating user:', error);
      throw error;
    }
  },

  // Helper methods for auth state
  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  async getUserData(): Promise<UserData | null> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }
}; 