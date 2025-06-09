import * as SecureStore from 'expo-secure-store';
import { 
  User, 
  UserSubscriptionStatus,
  TRIAL_SUBSCRIPTION,
  ANONYMOUS_SUBSCRIPTION,
  PREMIUM_SUBSCRIPTION,
  UserSubscription
} from '../types/auth';
import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  arrayUnion,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User as FirebaseUserType } from '@firebase/auth-types';

// Storage keys
const STORAGE_KEYS = {
  USER: 'user',
  TRIAL_MINUTES: 'trial_minutes_used',
} as const;

class AuthService {
  private async createUserDocument(userId: string, email: string, name?: string) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const newUser: Omit<User, 'id'> = {
        email,
        name,
        subscription: ANONYMOUS_SUBSCRIPTION,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      return {
        id: userId,
        ...newUser
      };
    }

    return {
      id: userId,
      ...userDoc.data()
    } as User;
  }

  async handleAuthStateChange(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(async (firebaseUser: FirebaseUserType | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();

        if (!userDoc.exists()) {
          // Create new user document
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || undefined,
            subscription: TRIAL_SUBSCRIPTION,
            createdAt: new Date(),
            lastLoginAt: new Date()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          callback(newUser);
        } else {
          callback({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || undefined,
            subscription: userData?.subscription || TRIAL_SUBSCRIPTION,
            createdAt: userData?.createdAt || new Date(),
            lastLoginAt: userData?.lastLoginAt || new Date()
          } as User);
        }
      } else {
        callback(null);
      }
    });
  }

  async storeUser(user: User) {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async getCurrentUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
    if (!userJson) return null;

    const user = JSON.parse(userJson) as User;
    const userRef = doc(db, 'users', user.id);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const updatedUser = {
        id: user.id,
        ...userDoc.data()
      } as User;
      await this.storeUser(updatedUser);
      return updatedUser;
    }

    return null;
  }

  async signOut() {
    await firebaseSignOut(auth);
  }

  private async clearUser() {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TRIAL_MINUTES);
  }

  async updateUserSubscription(userId: string, subscriptionStatus: UserSubscriptionStatus) {
    const userRef = doc(db, 'users', userId);
    
    let subscription;
    switch (subscriptionStatus) {
      case UserSubscriptionStatus.PREMIUM:
        subscription = PREMIUM_SUBSCRIPTION;
        break;
      case UserSubscriptionStatus.TRIAL:
        subscription = TRIAL_SUBSCRIPTION;
        break;
      default:
        subscription = ANONYMOUS_SUBSCRIPTION;
    }

    await updateDoc(userRef, {
      subscription,
      lastLoginAt: serverTimestamp()
    });

    const user = await this.getCurrentUser();
    if (user) {
      user.subscription = subscription;
      await this.storeUser(user);
    }
  }

  async updateMinutesRemaining(userId: string, minutes: number) {
    const userRef = doc(db, 'users', userId);
    const user = await this.getCurrentUser();
    
    if (user && user.subscription.minutesRemaining !== Infinity) {
      const minutesRemaining = Math.max(0, user.subscription.minutesRemaining - minutes);
      
      await updateDoc(userRef, {
        'subscription.minutesRemaining': minutesRemaining
      });

      user.subscription.minutesRemaining = minutesRemaining;
      await this.storeUser(user);
    }
  }

  async shouldPromptUpgrade(userId: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const { subscription } = user;
    
    if (subscription.status === UserSubscriptionStatus.TRIAL) {
      return subscription.minutesRemaining <= 5;
    }

    return false;
  }

  async canAccessFeature(feature: keyof UserSubscription['features']): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;
    return !!user.subscription.features[feature];
  }

  async addPremiumHours(userId: string, hours: number, transactionId: string) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const minutes = hours * 60;
    const purchase = {
      transactionId,
      hours,
      timestamp: Date.now(),
    };

    await updateDoc(userRef, {
      'subscription.status': UserSubscriptionStatus.PREMIUM,
      'subscription.minutesRemaining': (userData?.subscription?.minutesRemaining || 0) + minutes,
      'subscription.purchaseHistory': [...(userData?.subscription?.purchaseHistory || []), purchase],
    });
  }

  async getMinutesRemaining(userId: string): Promise<number> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return userData?.subscription?.minutesRemaining || 0;
  }

  async useMinutes(userId: string, minutes: number) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const remainingMinutes = userData?.subscription?.minutesRemaining || 0;
    if (remainingMinutes < minutes) {
      throw new Error('Not enough minutes remaining');
    }

    await updateDoc(userRef, {
      'subscription.minutesRemaining': remainingMinutes - minutes,
      'subscription.minutesUsed': (userData?.subscription?.minutesUsed || 0) + minutes,
    });
  }
}

export const authService = new AuthService(); 