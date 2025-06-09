import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_CONFIG } from './config';

console.log('=== FIREBASE INITIALIZATION DEBUG ===');

const firebaseConfig = AUTH_CONFIG.firebase;

console.log('Firebase config:', {
  ...firebaseConfig,
  apiKey: '***HIDDEN***' // Don't log sensitive data
});

let app;
try {
  if (!firebase.apps.length) {
    console.log('No Firebase app found, initializing...');
    app = firebase.initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully!');

    // Configure AsyncStorage for persistence
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        console.log('Firebase persistence configured successfully!');
      })
      .catch((error) => {
        console.error('Error configuring Firebase persistence:', error);
      });
  } else {
    console.log('Firebase app already exists, getting existing app...');
    app = firebase.app();
    console.log('Got existing Firebase app');
  }
} catch (error) {
  console.error('Error during Firebase initialization:', error);
  throw error;
}

export const auth = firebase.auth();
export const db = firebase.firestore(); 