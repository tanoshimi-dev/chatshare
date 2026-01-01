import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchCategories, registerChat, Category } from '../services/api';

type DrawerParamList = {
  Home: undefined;
  Register: undefined;
};

type RootStackParamList = {
  Main: undefined;
};

type RegisterScreenProps = {
  navigation: CompositeNavigationProp<
    DrawerNavigationProp<DrawerParamList>,
    StackNavigationProp<RootStackParamList>
  >;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [chatUrl, setChatUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await fetchCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const validateInputs = (): boolean => {
    if (!selectedCategory) {
      Alert.alert('Validation Error', 'Please select a category');
      return false;
    }

    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return false;
    }

    if (!chatUrl.trim()) {
      Alert.alert('Validation Error', 'Please paste a chat URL');
      return false;
    }

    const urlRegex = /^https?:\/\/.+/i;
    if (!urlRegex.test(chatUrl)) {
      Alert.alert('Validation Error', 'Please enter a valid URL');
      return false;
    }

    return true;
  };

  const handleShare = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      await registerChat({
        category_id: selectedCategory,
        title: title,
        public_link: chatUrl,
      });

      Alert.alert(
        'Success',
        'Chat link registered successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setChatUrl('');
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'An error occurred while registering the chat link. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategoryName = () => {
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : 'Select category';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#8FAA7F" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton}>
          <Icon name="notifications-none" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.formContainer}>
            {/* Category Selector */}
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                disabled={categoriesLoading || loading}>
                <Text style={styles.categoryButtonText}>
                  {categoriesLoading ? 'Loading...' : getSelectedCategoryName()}
                </Text>
                <Icon name="arrow-drop-down" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {showCategoryPicker && (
              <View style={styles.categoryPickerContainer}>
                <ScrollView style={styles.categoryList}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category.id && styles.categoryItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedCategory(category.id);
                        setShowCategoryPicker(false);
                      }}>
                      <Text
                        style={[
                          styles.categoryItemText,
                          selectedCategory === category.id && styles.categoryItemTextSelected,
                        ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Title Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="title"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
            </View>

            {/* Chat URL Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.urlInput]}
                placeholder="paste here&#10;https://claude.ai/share/&#10;a4c020d8-66a5-4f66-&#10;a655-b9e25244d78c"
                placeholderTextColor="#999"
                value={chatUrl}
                onChangeText={setChatUrl}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Share Button */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity
                style={[styles.shareButton, loading && styles.buttonDisabled]}
                onPress={handleShare}
                disabled={loading || categoriesLoading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.shareButtonText}>share</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8FAA7F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 10,
    backgroundColor: '#8FAA7F',
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  urlInput: {
    minHeight: 150,
    paddingTop: 15,
  },
  categoryButton: {
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#999',
  },
  categoryPickerContainer: {
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    marginBottom: 20,
    maxHeight: 200,
    overflow: 'hidden',
  },
  categoryList: {
    maxHeight: 200,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryItemSelected: {
    backgroundColor: '#8FAA7F',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  categoryItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: 10,
  },
  shareButton: {
    backgroundColor: '#654321',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  shareButtonText: {
    color: '#F5F5DC',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RegisterScreen;
