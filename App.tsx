import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './contexts/AuthContext';
import DrawerNavigator from './navigation/DrawerNavigator';
import * as WebBrowser from 'expo-web-browser';

// Import Firebase configuration to ensure it's initialized before any Firebase usage
import { auth, db } from './config/firebase';
WebBrowser.maybeCompleteAuthSession();
console.log("✅ WebBrowser.maybeCompleteAuthSession() called");

const Stack = createStackNavigator();

function AppContent() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verify Firebase is initialized by checking auth and db
        if (auth && db) {
          console.log('Firebase services verified');
          setFirebaseReady(true);
        }
      } catch (err) {
        console.error('Firebase initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Firebase');
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Error initializing app: {error}
        </Text>
      </View>
    );
  }

  if (!firebaseReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 10 }}>Initializing app...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <PaperProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PaperProvider>
    </NavigationContainer>
  );
}