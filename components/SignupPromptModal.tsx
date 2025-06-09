import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface SignupPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSignup: () => void;
  onLogin: () => void;
  minutesUsed: number;
}

export function SignupPromptModal({ 
  visible, 
  onClose, 
  onSignup, 
  onLogin,
  minutesUsed 
}: SignupPromptModalProps) {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignIn, setIsSignIn] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn();
      if (isSignIn) {
        onLogin();
      } else {
        onSignup();
      }
      onClose();
    } catch (error) {
      console.error('Error during authentication:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignIn(!isSignIn);
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
              onClose();
              setIsSignIn(false); // Reset to signup mode when closing
            }}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              {isSignIn ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignIn 
                ? 'Sign in to access your recordings'
                : 'Get started with 30 minutes of free recording time'
              }
            </Text>
          </View>

          {!isSignIn && (
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="time-outline" size={24} color="#4F46E5" style={styles.benefitIcon} />
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>30 minutes free trial</Text>
                  <Text style={styles.benefitDescription}>Start with 30 minutes of recording time on us</Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="cloud-outline" size={24} color="#4F46E5" style={styles.benefitIcon} />
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>Cloud backup & sync</Text>
                  <Text style={styles.benefitDescription}>Your recordings are safely stored and synced</Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="phone-portrait-outline" size={24} color="#4F46E5" style={styles.benefitIcon} />
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>Access on all devices</Text>
                  <Text style={styles.benefitDescription}>Use the app on any device, anytime</Text>
                </View>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]} 
            onPress={handleGoogleAuth}
            disabled={isLoading}
          >
            <View style={styles.signupButtonContent}>
              {isLoading ? (
                <ActivityIndicator color="white" style={styles.googleIcon} />
              ) : (
                <Ionicons name="logo-google" size={20} color="white" style={styles.googleIcon} />
              )}
              <Text style={styles.signupButtonText}>
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={toggleMode}>
            <Text style={styles.loginButtonText}>
              {isSignIn 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsList: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitIcon: {
    marginRight: 16,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 12,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    padding: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
}); 