import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';
import { AuthError, AuthSessionResult } from 'expo-auth-session';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await signIn();
      
      if (!result) {
        setError('Sign in failed. Please try again.');
        return;
      }

      const authResult = result as AuthSessionResult;
      switch (authResult.type) {
        case 'cancel':
          setError('Sign in was cancelled');
          break;
        case 'error':
          const authError = authResult.error as AuthError;
          setError(authError?.message || 'Failed to sign in with Google');
          break;
        case 'success':
          // Auth state change will handle navigation
          break;
        case 'dismiss':
          setError('Sign in was dismissed');
          break;
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your recordings and continue where you left off
        </Text>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Button
        mode="contained"
        onPress={handleSignIn}
        style={styles.googleButton}
        contentStyle={styles.buttonContent}
        icon={() => <Ionicons name="logo-google" size={20} color="white" />}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Signup')}
          style={styles.signupButton}
          disabled={isLoading}
        >
          Sign up
        </Button>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  googleButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
  },
  buttonContent: {
    flexDirection: 'row-reverse',
    height: 48,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signupButton: {
    marginLeft: 4,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 