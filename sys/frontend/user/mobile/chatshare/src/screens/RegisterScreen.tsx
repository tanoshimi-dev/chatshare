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
  Image,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { fetchCategories, registerChat, Category } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type DrawerParamList = {
  Timeline: undefined;
  Register: undefined;
  Favorite: undefined;
  Account: undefined;
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
  const { user, isAuthenticatedUser, logout } = useAuth();
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
    // Check if user is logged in
    if (!isAuthenticatedUser || !user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to register a chat. Please log in first.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Go to Login',
            onPress: () => {
              // Navigation will automatically redirect to login screen
              // because RootNavigator checks isLoggedIn state
            },
          },
        ]
      );
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Registering chat for user:', user.email);
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
              navigation.navigate('Timeline');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle 401 session expiration
      if (error.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                navigation.navigate('Timeline');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Registration Failed',
          error.message || 'An error occurred while registering the chat link. Please try again.'
        );
      }
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
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={28} color="#333" />
        </TouchableOpacity>

        {/* Profile Avatar or Notification Icon */}
        {isAuthenticatedUser ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Account')}>
              {user?.avatar && user.avatar !== '' ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.profileAvatar}
                />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  {user?.provider === 'google' ? (
                    <View style={styles.googleIconContainer}>
                      <FontAwesome name="google" size={24} color="#4285F4" />
                    </View>
                  ) : user?.provider === 'line' ? (
                    <View style={styles.lineIconContainer}>
                      <FontAwesome name="comment" size={24} color="#00B900" />
                    </View>
                  ) : (
                    <Icon name="account-circle" size={36} color="#A8B896" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <></>
        )}
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
    backgroundColor: '#A8B896',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ? StatusBar.currentHeight : 6),
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#A8B896',
    backgroundColor: '#F5F5DC',
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#A8B896',
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  lineIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00B900',
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
