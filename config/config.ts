import Constants from 'expo-constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RUNPOD_ENDPOINT = Constants.expoConfig?.extra?.runpodEndpoint ?? 'https://u0yfim6wmdb9ov-8000.proxy.runpod.net/';
export const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId ?? '';

// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};

// Initialize Firebase only if needed (helps with hot reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Ensure Auth is set up with React Native persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}
export { app, auth };

export const CONFIG = {
  RUNPOD_ENDPOINT,
  firebaseConfig,
  GOOGLE_WEB_CLIENT_ID,
  // Add other config values as needed
};
