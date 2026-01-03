import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Chat, updateChat, deleteChat } from '../services/chatService';
import { Category, fetchCategories } from '../services/categoryService';

interface EditChatModalProps {
  visible: boolean;
  chat: Chat | null;
  onClose: () => void;
  onUpdate: (updatedChat: Chat) => void;
  onDelete: (chatId: string) => void;
}

const EditChatModal: React.FC<EditChatModalProps> = ({
  visible,
  chat,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [publicLink, setPublicLink] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (visible && chat) {
      setTitle(chat.title || '');
      setPublicLink(chat.public_link || chat.url || '');
      setDescription(chat.description || '');
      setSelectedCategoryId(chat.category_id || '');
      loadCategories();
    }
  }, [visible, chat]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSave = async () => {
    if (!chat) return;

    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!publicLink.trim()) {
      Alert.alert('Error', 'Public link is required');
      return;
    }

    try {
      setLoading(true);
      const updates = {
        title: title.trim(),
        description: description.trim(),
        public_link: publicLink.trim(),
        category_id: selectedCategoryId || undefined,
        is_public: chat.is_public, // Preserve the original is_public value
      };

      const updatedChat = await updateChat(chat.id, updates);
      Alert.alert('Success', 'Chat updated successfully');
      onUpdate(updatedChat);
      onClose();
    } catch (error: any) {
      console.error('Error updating chat:', error);
      Alert.alert('Error', error.message || 'Failed to update chat');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!chat) return;

    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteChat(chat.id);
              Alert.alert('Success', 'Chat deleted successfully');
              onDelete(chat.id);
              onClose();
            } catch (error: any) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', error.message || 'Failed to delete chat');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!chat) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Chat</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter chat title"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Public Link *</Text>
              <TextInput
                style={styles.input}
                value={publicLink}
                onChangeText={setPublicLink}
                placeholder="Enter public link"
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description (optional)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" color="#A8B896" />
              ) : (
                <ScrollView style={styles.categoryList} horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      !selectedCategoryId && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategoryId('')}
                    disabled={loading}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        !selectedCategoryId && styles.categoryChipTextSelected,
                      ]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategoryId === category.id && styles.categoryChipSelected,
                      ]}
                      onPress={() => setSelectedCategoryId(category.id)}
                      disabled={loading}>
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategoryId === category.id && styles.categoryChipTextSelected,
                        ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.deleteButton, loading && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={loading}>
              <Icon name="delete" size={20} color="#FFF" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, loading && styles.buttonDisabled]}
                onPress={onClose}
                disabled={loading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  categoryList: {
    flexDirection: 'row',
    maxHeight: 50,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#A8B896',
    borderColor: '#A8B896',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#A8B896',
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default EditChatModal;
