import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.title}>Trial Period Ended</Text>
          <Text style={styles.message}>
            You've used {minutesUsed.toFixed(1)} minutes of transcription. Sign up now to get:
          </Text>

          <View style={styles.benefitsList}>
            <Text style={styles.benefit}>• 60 additional minutes free</Text>
            <Text style={styles.benefit}>• Save and organize recordings</Text>
            <Text style={styles.benefit}>• Access on multiple devices</Text>
            <Text style={styles.benefit}>• Priority transcription</Text>
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={onSignup}>
            <Text style={styles.signupButtonText}>Sign Up Free</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
            <Text style={styles.loginButtonText}>Already have an account? Log in</Text>
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
    borderRadius: 16,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsList: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  benefit: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 24,
  },
  signupButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
}); 