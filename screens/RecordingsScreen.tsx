import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Play } from 'lucide-react-native';

const recordings = [
  { id: '1', title: 'Team Meeting Notes', subtitle: 'Discussed project timeline and deliverables', date: '2023-12-01', time: '15:30', words: 2450 },
  { id: '2', title: 'Client Call', subtitle: 'Review of quarterly objectives', date: '2023-11-30', time: '14:45', words: 1830 },
  { id: '3', title: 'Product Planning', subtitle: 'Feature prioritization and roadmap discussion', date: '2023-11-29', time: '09:15', words: 3120 },
];

export default function RecordingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recordings</Text>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>{item.date} {item.time}</Text>
              <Text style={styles.cardFooterText}>{item.words} words</Text>
              <Play color="blue" />
            </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'gray',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardFooterText: {
    fontSize: 12,
    color: 'gray',
  },
}); 