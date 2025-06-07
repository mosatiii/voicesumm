import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const transcription = "Today I need to schedule a team meeting for Friday afternoon, around 3pm would be best. Also need to follow up with the client about our project timeline since they requested some changes. Before the end of the week, I should review the quarterly report before submitting it to management.";

const summaryPoints = [
  "Schedule team meeting for Friday at 3pm",
  "Follow up with client about project timeline",
  "Review quarterly report before submission",
];

export default function SummaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.transcription}>{transcription}</Text>
      <FlatList
        data={summaryPoints}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  transcription: {
    fontSize: 16,
    marginBottom: 16,
  },
  summaryCard: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryText: {
    fontSize: 14,
  },
}); 