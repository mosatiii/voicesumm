import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>

      <Text style={styles.sectionTitle}>1. Introduction</Text>
      <Text style={styles.text}>
        Welcome to Voice Summarizer ("we," "our," or "us"). We are committed to protecting your privacy and personal information while providing you with a powerful voice recording and task management experience.
      </Text>

      <Text style={styles.sectionTitle}>2. Information We Collect</Text>
      <Text style={styles.subsectionTitle}>2.1 Voice Recordings</Text>
      <Text style={styles.text}>
        • Voice recordings you create through the app{'\n'}
        • These recordings are stored locally on your device{'\n'}
        • Recordings are not transmitted to our servers unless you explicitly choose to share them
      </Text>

      <Text style={styles.subsectionTitle}>2.2 Task Information</Text>
      <Text style={styles.text}>
        • Task descriptions, priorities, and completion status{'\n'}
        • Task creation and completion dates{'\n'}
        • All task data is stored locally on your device
      </Text>

      <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
      <Text style={styles.text}>
        • To provide voice recording and task management functionality{'\n'}
        • To improve app performance and user experience{'\n'}
        • To respond to your requests or questions{'\n'}
        • To comply with legal obligations
      </Text>

      <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
      <Text style={styles.text}>
        • All data is primarily stored locally on your device{'\n'}
        • We implement industry-standard security measures{'\n'}
        • We do not sell or rent your personal information{'\n'}
        • Data backup is handled through your device's built-in backup systems
      </Text>

      <Text style={styles.sectionTitle}>5. Your Rights Under PIPEDA</Text>
      <Text style={styles.text}>
        Under the Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to:{'\n\n'}
        • Access your personal information{'\n'}
        • Challenge the accuracy of your information{'\n'}
        • Withdraw consent for data collection{'\n'}
        • File a complaint with the Privacy Commissioner of Canada
      </Text>

      <Text style={styles.sectionTitle}>6. Microphone Access</Text>
      <Text style={styles.text}>
        • We request microphone access solely for voice recording functionality{'\n'}
        • You can revoke microphone access at any time through your device settings{'\n'}
        • We do not access the microphone without your explicit action to record
      </Text>

      <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
      <Text style={styles.text}>
        We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us to have it removed.
      </Text>

      <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
      <Text style={styles.text}>
        We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app with an updated date.
      </Text>

      <Text style={styles.sectionTitle}>9. Contact Us</Text>
      <Text style={styles.text}>
        If you have any questions about this Privacy Policy, please contact us at:{'\n'}
        [Your Contact Information]
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Voice Summarizer. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#1a1a1a',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 16,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 