import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, UserSubscriptionStatus } from '../types/auth';

interface SubscriptionBannerProps {
  user: User | null;
  isRecording: boolean;
  onUpgrade: () => void;
  onPurchaseHours?: () => void;
}

export function SubscriptionBanner({ user, isRecording, onUpgrade, onPurchaseHours }: SubscriptionBannerProps) {
  if (!user) {
    // Anonymous user - Show sign up banner
    return (
      <View style={[styles.banner, styles.anonymousBanner]}>
        <View style={styles.bannerHeader}>
          <View style={styles.timeInfo}>
            <Ionicons 
              name="time-outline" 
              size={28} 
              color="white"
            />
            <Text style={styles.timeText}>
              30
            </Text>
            <Text style={styles.timeUnit}>
              min
            </Text>
          </View>
          <Text style={styles.label}>free when you sign up</Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={onUpgrade}
        >
          <Text style={styles.buttonText}>Sign Up Now</Text>
          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeText}>Get Started Free</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (user.subscription.status === UserSubscriptionStatus.TRIAL) {
    // Trial user - Show remaining minutes
    return (
      <View style={[styles.banner, styles.trialBanner]}>
        <View style={styles.bannerHeader}>
          <View style={styles.timeInfo}>
            <Ionicons 
              name="time-outline" 
              size={28} 
              color={isRecording ? '#FF4B4B' : 'white'} 
            />
            <Text style={[styles.timeText, isRecording && styles.recordingText]}>
              {user.subscription.minutesRemaining}
            </Text>
            <Text style={[styles.timeUnit, isRecording && styles.recordingText]}>
              min
            </Text>
          </View>
          <Text style={styles.label}>remaining in your trial</Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, isRecording && styles.recordingButton]}
          onPress={onUpgrade}
          disabled={isRecording}
        >
          <Text style={styles.buttonText}>Upgrade to Premium</Text>
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>Save 20%</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (user.subscription.status === UserSubscriptionStatus.PREMIUM) {
    // Premium user - Show remaining purchased hours
    return (
      <View style={[styles.banner, styles.premiumBanner]}>
        <View style={styles.bannerHeader}>
          <View style={styles.timeInfo}>
            <Ionicons 
              name="time-outline" 
              size={28} 
              color={isRecording ? '#FF4B4B' : 'white'} 
            />
            <Text style={[styles.timeText, isRecording && styles.recordingText]}>
              {Math.floor(user.subscription.minutesRemaining / 60)}
            </Text>
            <Text style={[styles.timeUnit, isRecording && styles.recordingText]}>
              hrs
            </Text>
          </View>
          <Text style={styles.label}>remaining in your account</Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.premiumButton]}
          onPress={onPurchaseHours}
        >
          <Text style={styles.buttonText}>Purchase More Hours</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  anonymousBanner: {
    backgroundColor: '#4F46E5',
  },
  trialBanner: {
    backgroundColor: '#4F46E5',
  },
  premiumBanner: {
    backgroundColor: '#059669',
  },
  bannerHeader: {
    alignItems: 'center',
    gap: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeUnit: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 4,
    opacity: 0.9,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 75, 75, 0.15)',
  },
  recordingText: {
    color: '#FF4B4B',
  },
  trialBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trialBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  promoBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  promoBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  premiumButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  }
}); 