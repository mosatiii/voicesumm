import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.text}>This is the privacy policy of the Voice Summarizer app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: 'gray',
  },
}); 