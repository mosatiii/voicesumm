import { NavigatorScreenParams } from '@react-navigation/native';

export type TabStackParamList = {
  Recordings: undefined;
  Recorder: undefined;
  Todo: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  PurchaseHours: {
    userId?: string;
  };
  Pricing: {
    fromTrial: boolean;
    minutesUsed: number;
    minutesRemaining: number;
  };
};

export type DrawerParamList = {
  MainHome: NavigatorScreenParams<TabStackParamList>;
  Privacy: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
};

export type RootStackParamList = {
  Root: NavigatorScreenParams<DrawerParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 