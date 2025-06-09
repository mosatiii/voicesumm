import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

export default function SignupScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<SignupScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Get started with 30 minutes of free recording time
        </Text>
      </View>

      <View style={styles.features}>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          <Text style={styles.featureText}>30 minutes free trial</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          <Text style={styles.featureText}>Cloud backup & sync</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          <Text style={styles.featureText}>Access on all your devices</Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={signIn}
        style={styles.googleButton}
        contentStyle={styles.buttonContent}
        icon={() => <Ionicons name="logo-google" size={20} color="white" />}
      >
        Continue with Google
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginButton}
        >
          Sign in
        </Button>
      </View>
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
  features: {
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
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
  loginButton: {
    marginLeft: 4,
  },
}); 