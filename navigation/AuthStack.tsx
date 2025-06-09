import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import PurchaseHoursScreen from '../screens/PurchaseHoursScreen';
import { AuthStackParamList } from './types';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
          color: '#111827',
        },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen 
        name="PurchaseHours" 
        component={PurchaseHoursScreen}
        options={{
          title: 'Purchase Hours',
        }}
      />
    </Stack.Navigator>
  );
} 