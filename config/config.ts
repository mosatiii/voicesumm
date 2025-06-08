import Constants from 'expo-constants';

// ✅ Runtime values from app config
export const RUNPOD_ENDPOINT =
  Constants.expoConfig?.extra?.runpodEndpoint ??
  'https://u0yfim6wmdb9ov-8000.proxy.runpod.net/';

// Auth config
export const AUTH_CONFIG = {
  firebase: {
    apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
    authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
    projectId: Constants.expoConfig?.extra?.firebaseProjectId,
    storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
    messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
    appId: Constants.expoConfig?.extra?.firebaseAppId,
  },
  googleClientId: Constants.expoConfig?.extra?.googleClientId,
  iosClientId: Constants.expoConfig?.extra?.googleClientId,
};

// ✅ Exports
export const CONFIG = {
  RUNPOD_ENDPOINT: process.env.EXPO_PUBLIC_RUNPOD_ENDPOINT,
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  AUTH: {
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  }
};

