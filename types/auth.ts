export enum UserSubscriptionStatus {
  ANONYMOUS = 'anonymous',
  TRIAL = 'trial',
  PREMIUM = 'premium'
}

export interface UserSubscription {
  status: UserSubscriptionStatus;
  trialStartDate?: Date;
  trialEndDate?: Date;
  minutesRemaining: number;
  features: {
    aiActions: boolean;
    maxRecordingDuration: number; // in minutes
  };
}

export interface PremiumHoursPurchase {
  purchaseDate: Date;
  hoursAmount: number;
  transactionId: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription: UserSubscription;
  premiumHoursPurchases?: PremiumHoursPurchase[];
  createdAt: Date;
  lastLoginAt: Date;
}

// Anonymous users get 1 recording, 5 minutes max
export const ANONYMOUS_SUBSCRIPTION: UserSubscription = {
  status: UserSubscriptionStatus.ANONYMOUS,
  minutesRemaining: 5,
  features: {
    aiActions: false,
    maxRecordingDuration: 5
  }
};

// Trial users (after signup) get 30 minutes total in one session
export const TRIAL_SUBSCRIPTION: UserSubscription = {
  status: UserSubscriptionStatus.TRIAL,
  minutesRemaining: 30,
  features: {
    aiActions: false,
    maxRecordingDuration: 30 // Can use all 30 minutes in one session
  }
};

// Premium users get AI features and can purchase additional hours
export const PREMIUM_SUBSCRIPTION: UserSubscription = {
  status: UserSubscriptionStatus.PREMIUM,
  minutesRemaining: 0, // Minutes are added through purchases
  features: {
    aiActions: true,
    maxRecordingDuration: Infinity // No limit per session
  }
}; 