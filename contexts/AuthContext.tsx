import React, { createContext, useContext } from 'react';
import { useExpoAuth } from '../hooks/useExpoAuth';

interface AuthContextType {
  user: { email: string; id: string } | null;
  loading: boolean;
  signIn: () => Promise<any>;
  signOut: () => void;
  trialMinutesUsed: number;
  trialMinutesRemaining: number;
  addTrialMinutes: (minutes: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { userInfo, signIn, signOut, isLoading } = useExpoAuth();
  
  const auth: AuthContextType = {
    user: userInfo ? { email: userInfo.email, id: userInfo.email } : null,
    loading: isLoading,
    signIn: async () => signIn(),
    signOut,
    trialMinutesUsed: 0,
    trialMinutesRemaining: 30,
    addTrialMinutes: async () => {},
  };

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 