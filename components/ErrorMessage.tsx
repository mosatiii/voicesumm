import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
    marginVertical: 10,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  message: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  dismissButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF4444',
    borderRadius: 20,
  },
  dismissText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
}); 