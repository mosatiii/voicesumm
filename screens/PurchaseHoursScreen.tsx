import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/types';
import { User } from 'firebase/auth';

type PurchaseHoursRouteProp = RouteProp<AuthStackParamList, 'PurchaseHours'>;

interface PurchaseOption {
  hours: number;
  price: number;
  savings?: number;
}

const purchaseOptions: PurchaseOption[] = [
  {
    hours: 5,
    price: 25,
  },
  {
    hours: 10,
    price: 45,
    savings: 10,
  },
  {
    hours: 20,
    price: 80,
    savings: 20,
  }
];

export default function PurchaseHoursScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<PurchaseHoursRouteProp>();
  const [selectedOption, setSelectedOption] = useState<PurchaseOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedOption || !user) {
      Alert.alert('Error', 'Please select a package and ensure you are signed in.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Here you would integrate with your payment provider
      // For now, we'll simulate a successful purchase
      const transactionId = `purchase_${Date.now()}`;
      
      await authService.addPremiumHours(user.uid, selectedOption.hours, transactionId);
      
      Alert.alert(
        'Purchase Successful',
        `${selectedOption.hours} hours have been added to your account.`,
        [{ 
          text: 'OK', 
          onPress: () => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  { name: 'MainHome' },
                ],
              })
            );
          }
        }]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        'There was an error processing your purchase. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Purchase Recording Hours</Text>
        <Text style={styles.subtitle}>
          Choose a package that suits your needs
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {purchaseOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedOption(option)}
            style={styles.optionWrapper}
          >
            <Surface style={[
              styles.optionCard,
              selectedOption === option && styles.selectedCard
            ]}>
              <View style={styles.optionHeader}>
                <Text style={styles.hoursText}>{option.hours} hours</Text>
                {option.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>Save {option.savings}%</Text>
                  </View>
                )}
              </View>

              <Text style={styles.priceText}>${option.price}</Text>
              <Text style={styles.pricePerHour}>
                ${(option.price / option.hours).toFixed(2)}/hour
              </Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>All packages include:</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <Text style={styles.featureText}>AI-powered transcription</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <Text style={styles.featureText}>Smart action items generation</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <Text style={styles.featureText}>Cloud backup & sync</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          (!selectedOption || isProcessing) && styles.disabledButton
        ]}
        onPress={handlePurchase}
        disabled={!selectedOption || isProcessing}
      >
        <Text style={styles.purchaseButtonText}>
          {isProcessing ? 'Processing...' : 'Purchase Now'}
        </Text>
        {!isProcessing && <Ionicons name="arrow-forward" size={20} color="white" />}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  optionWrapper: {
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#4F46E5',
    borderWidth: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hoursText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  savingsBadge: {
    backgroundColor: '#DCF7E4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  pricePerHour: {
    fontSize: 14,
    color: '#6B7280',
  },
  featuresContainer: {
    padding: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
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
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 