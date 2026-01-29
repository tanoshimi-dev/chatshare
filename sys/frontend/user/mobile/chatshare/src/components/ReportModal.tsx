import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createReport, REPORT_REASONS, ReportReason, ContentType } from '../services/reportService';

interface Props {
  visible: boolean;
  onClose: () => void;
  contentType: ContentType;
  contentId: string;
  onReportSuccess?: () => void;
}

const ReportModal: React.FC<Props> = ({
  visible,
  onClose,
  contentType,
  contentId,
  onReportSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for your report.');
      return;
    }

    try {
      setLoading(true);
      await createReport({
        content_type: contentType,
        content_id: contentId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it within 24 hours.',
        [{ text: 'OK', onPress: handleClose }]
      );

      onReportSuccess?.();
    } catch (error: any) {
      if (error.message.includes('already reported')) {
        Alert.alert('Already Reported', 'You have already reported this content.');
      } else {
        Alert.alert('Error', error.message || 'Failed to submit report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Report Content</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Why are you reporting this?</Text>
            <Text style={styles.sectionSubtitle}>Select the reason that best describes the issue</Text>

            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map(reason => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonButton,
                    selectedReason === reason.value && styles.reasonButtonSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <Icon
                    name={selectedReason === reason.value ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20}
                    color={selectedReason === reason.value ? '#A8B896' : '#999'}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason.value && styles.reasonTextSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.descriptionLabel}>Additional details (optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              multiline
              numberOfLines={4}
              placeholder="Provide more context about the issue..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{description.length}/500</Text>

            <Text style={styles.disclaimer}>
              Reports are reviewed by our team within 24 hours. False reports may result in
              restrictions on your account.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !selectedReason && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || !selectedReason}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  reasonButtonSelected: {
    backgroundColor: '#F0F5EC',
  },
  reasonText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  reasonTextSelected: {
    fontWeight: '500',
    color: '#A8B896',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    backgroundColor: '#FAFAFA',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  disclaimer: {
    fontSize: 12,
    color: '#888',
    marginTop: 16,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#D9534F',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default ReportModal;
