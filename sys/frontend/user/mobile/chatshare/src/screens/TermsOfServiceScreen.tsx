import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { acceptToS } from '../services/tosService';

interface Props {
  onAccept: () => void;
  onDecline?: () => void;
}

const TermsOfServiceScreen: React.FC<Props> = ({ onAccept, onDecline }) => {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleAccept = async () => {
    if (!agreed) {
      Alert.alert('Agreement Required', 'Please check the box to agree to the Terms of Service.');
      return;
    }

    try {
      setLoading(true);
      await acceptToS();
      onAccept();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept Terms of Service');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Terms Required',
      'You must accept the Terms of Service to use ChatShare. If you decline, you will be logged out.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline & Logout', style: 'destructive', onPress: onDecline },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <Text style={styles.headerSubtitle}>Please read and accept to continue</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>ChatShare Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

        <Text style={styles.sectionHeader}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using ChatShare, you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use our service.
        </Text>

        <Text style={styles.sectionHeader}>2. User-Generated Content Policy</Text>
        <Text style={styles.paragraph}>
          ChatShare has zero tolerance for objectionable content or abusive users. You agree not to post,
          share, or transmit any content that:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Is illegal, harmful, threatening, abusive, or harassing</Text>
          <Text style={styles.bulletItem}>• Contains hate speech or promotes discrimination</Text>
          <Text style={styles.bulletItem}>• Is sexually explicit or pornographic</Text>
          <Text style={styles.bulletItem}>• Contains violence or graphic content</Text>
          <Text style={styles.bulletItem}>• Infringes on intellectual property rights</Text>
          <Text style={styles.bulletItem}>• Contains spam, malware, or phishing attempts</Text>
          <Text style={styles.bulletItem}>• Impersonates others or spreads misinformation</Text>
        </View>

        <Text style={styles.sectionHeader}>3. Content Moderation</Text>
        <Text style={styles.paragraph}>
          We employ automated content filters and manual review processes. Content that violates our
          policies may be flagged for review or removed without notice.
        </Text>

        <Text style={styles.sectionHeader}>4. Reporting Objectionable Content</Text>
        <Text style={styles.paragraph}>
          If you encounter content that violates these terms, please report it using the report feature.
          We commit to reviewing all reports within 24 hours and taking appropriate action, which may include:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Removing the offending content</Text>
          <Text style={styles.bulletItem}>• Warning the user</Text>
          <Text style={styles.bulletItem}>• Suspending or terminating user accounts</Text>
        </View>

        <Text style={styles.sectionHeader}>5. Blocking Users</Text>
        <Text style={styles.paragraph}>
          You can block other users to prevent them from appearing in your feed. Blocked users will not
          be able to see your content or interact with you.
        </Text>

        <Text style={styles.sectionHeader}>6. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          You are responsible for all content you post and for maintaining the confidentiality of your
          account. You agree to notify us immediately of any unauthorized use of your account.
        </Text>

        <Text style={styles.sectionHeader}>7. Consequences of Violations</Text>
        <Text style={styles.paragraph}>
          Violations of these terms may result in:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Content removal</Text>
          <Text style={styles.bulletItem}>• Account suspension</Text>
          <Text style={styles.bulletItem}>• Permanent account termination</Text>
          <Text style={styles.bulletItem}>• Legal action where appropriate</Text>
        </View>

        <Text style={styles.sectionHeader}>8. Privacy</Text>
        <Text style={styles.paragraph}>
          Your use of ChatShare is also governed by our Privacy Policy. Please review it to understand
          how we collect, use, and protect your information.
        </Text>

        <Text style={styles.sectionHeader}>9. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may update these terms from time to time. Continued use of the service after changes
          constitutes acceptance of the new terms.
        </Text>

        <Text style={styles.sectionHeader}>10. Contact</Text>
        <Text style={styles.paragraph}>
          If you have questions about these terms or need to report an issue, please contact us at
          support@chatshare.dev
        </Text>

        <View style={styles.agreementContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreed(!agreed)}
          >
            <Icon
              name={agreed ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={agreed ? '#A8B896' : '#666'}
            />
            <Text style={styles.checkboxLabel}>
              I have read and agree to the Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          disabled={loading}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, !agreed && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={loading || !agreed}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5D0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 8,
    marginLeft: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: '#555',
    lineHeight: 24,
  },
  agreementContainer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5D0',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5D0',
    backgroundColor: '#F5F5DC',
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#A8B896',
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#CCC',
  },
  acceptButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default TermsOfServiceScreen;
