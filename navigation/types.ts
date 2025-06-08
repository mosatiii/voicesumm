import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Main: undefined;
  Privacy: undefined;
  Auth: {
    screen: keyof AuthStackParamList;
    params?: any;
  };
  SignInModal: undefined;
};

export type TabStackParamList = {
  Recordings: undefined;
  Recorder: undefined;
  Todo: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Pricing: {
    fromTrial: boolean;
    minutesUsed: number;
    minutesRemaining: number;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 