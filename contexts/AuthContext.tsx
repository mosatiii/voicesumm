import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  trialMinutesUsed: number;
  trialMinutesRemaining: number;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string, photoURL?: string) => Promise<void>;
  addTrialMinutes: (minutes: number) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialMinutesUsed, setTrialMinutesUsed] = useState(0);
  const [trialMinutesRemaining, setTrialMinutesRemaining] = useState(30);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);

      // Load trial status
      const { minutesUsed, minutesRemaining } = await authService.getTrialStatus();
      setTrialMinutesUsed(minutesUsed);
      setTrialMinutesRemaining(minutesRemaining);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await authService.signUp(email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updateProfile = async (displayName: string, photoURL?: string) => {
    try {
      await authService.updateUserProfile(displayName, photoURL);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const addTrialMinutes = async (minutes: number) => {
    try {
      await authService.addTrialMinutes(minutes);
      const { minutesUsed, minutesRemaining } = await authService.getTrialStatus();
      setTrialMinutesUsed(minutesUsed);
      setTrialMinutesRemaining(minutesRemaining);
    } catch (error) {
      console.error('Add trial minutes error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        trialMinutesUsed,
        trialMinutesRemaining,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        addTrialMinutes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 