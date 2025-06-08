import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { AUTH_CONFIG } from '../config/config';

let app;
let auth;

// Initialize Firebase
try {
  app = initializeApp(AUTH_CONFIG.firebase);
  auth = initializeAuth(app);
} catch (error) {
  // If Firebase was already initialized, get existing instances
  app = initializeApp(AUTH_CONFIG.firebase);
  auth = getAuth(app);
}

// Export Firebase instances
export { app, auth };

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure Firebase is initialized
    if (app && auth) {
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <>{children}</>;
} 