import Constants from 'expo-constants';

// ✅ Runtime values from app config
export const TRANSCRIPTION_ENDPOINT =
  Constants.expoConfig?.extra?.transcriptionEndpoint ??
  'https://whispercpp-production-9842.up.railway.app';

// Auth config
export const AUTH_CONFIG = {
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  // Use environment variables for client IDs
  googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
};

// ✅ Exports
export const CONFIG = {
  TRANSCRIPTION_ENDPOINT: process.env.EXPO_PUBLIC_TRANSCRIPTION_ENDPOINT,
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  AUTH: {
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  }
};

