import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { fetchCategories, Category } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import {
  listSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
  updateSavedSearch,
  SavedSearchSetting,
} from '../services/searchService';

type Props = {
  navigation: DrawerNavigationProp<any>;
};

const SearchSettingsScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Search conditions state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedChatType, setSelectedChatType] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  // Saved searches state
  const [savedSearches, setSavedSearches] = useState<SavedSearchSetting[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const chatTypes = [
    { id: 'chatgpt', name: 'ChatGPT', icon: '🤖' },
    { id: 'claude', name: 'Claude', icon: '🧠' },
    { id: 'copilot', name: 'Copilot', icon: '💻' },
    { id: 'gemini', name: 'Gemini', icon: '✨' },
  ];

  useEffect(() => {
    loadCategories();
    loadSavedSearches();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      if (data && Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const searches = await listSavedSearches();
      setSavedSearches(searches);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    }
  };

  const handleLoadSearch = (search: SavedSearchSetting) => {
    setSelectedCategoryId(search.category_id || null);
    setSelectedChatType(search.chat_type || null);
    setDateFrom(search.date_from ? new Date(search.date_from) : null);
    setDateTo(search.date_to ? new Date(search.date_to) : null);
    Alert.alert('Loaded', `Search settings "${search.name}" loaded successfully`);
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) {
      Alert.alert('Error', 'Please enter a name for this search');
      return;
    }

    try {
      await createSavedSearch({
        name: saveName.trim(),
        category_id: selectedCategoryId || undefined,
        chat_type: selectedChatType || undefined,
        date_from: dateFrom?.toISOString().split('T')[0],
        date_to: dateTo?.toISOString().split('T')[0],
        sort_by: 'created_at',
        sort_order: 'desc',
        is_default: saveAsDefault,
      });
      
      setSaveName('');
      setSaveAsDefault(false);
      setShowSaveModal(false);
      await loadSavedSearches();
      Alert.alert('Success', 'Search settings saved successfully');
    } catch (err) {
      console.error('Failed to save search:', err);
      Alert.alert('Error', 'Failed to save search settings');
    }
  };

  const handleDeleteSearch = (search: SavedSearchSetting) => {
    Alert.alert(
      'Delete Search',
      `Are you sure you want to delete "${search.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedSearch(search.id);
              await loadSavedSearches();
              Alert.alert('Deleted', 'Search settings deleted successfully');
            } catch (err) {
              console.error('Failed to delete search:', err);
              Alert.alert('Error', 'Failed to delete search settings');
            }
          },
        },
      ]
    );
  };

  const handleToggleDefault = async (search: SavedSearchSetting) => {
    try {
      await updateSavedSearch(search.id, {
        is_default: !search.is_default,
      });
      await loadSavedSearches();
    } catch (err) {
      console.error('Failed to update search:', err);
      Alert.alert('Error', 'Failed to update search settings');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleDateFromChange = (event: any, selectedDate?: Date) => {
    setShowDateFromPicker(false);
    if (selectedDate) {
      setDateFrom(selectedDate);
    }
  };

  const handleDateToChange = (event: any, selectedDate?: Date) => {
    setShowDateToPicker(false);
    if (selectedDate) {
      setDateTo(selectedDate);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Filters',
      'Are you sure you want to clear all search settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setSelectedCategoryId(null);
            setSelectedChatType(null);
            setDateFrom(null);
            setDateTo(null);
          },
        },
      ]
    );
  };

  const handleSearch = () => {
    // Build search params
    const searchFilters = {
      categoryId: selectedCategoryId,
      chatType: selectedChatType,
      dateFrom: dateFrom?.toISOString().split('T')[0],
      dateTo: dateTo?.toISOString().split('T')[0],
      sortBy: 'created_at',
      sortOrder: 'desc',
    };

    console.log('Search with filters:', searchFilters);
    
    // Navigate to Timeline with search filters
    navigation.navigate('Tabs', {
      screen: 'Timeline',
      params: { searchFilters },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={32} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Search Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Saved Searches Section */}
        {savedSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 Saved Searches</Text>
            <View style={styles.optionsList}>
              {savedSearches.map((search) => (
                <View key={search.id} style={styles.savedSearchItem}>
                  <TouchableOpacity
                    style={styles.savedSearchMain}
                    onPress={() => handleLoadSearch(search)}>
                    <View style={styles.savedSearchInfo}>
                      <View style={styles.savedSearchHeader}>
                        <Text style={styles.savedSearchName}>{search.name}</Text>
                        {search.is_default && (
                          <View style={styles.defaultBadge}>
                            <Icon name="star" size={14} color="#fff" />
                          </View>
                        )}
                      </View>
                      <View style={styles.savedSearchDetails}>
                        {search.category && (
                          <Text style={styles.savedSearchDetail}>
                            {search.category.icon} {search.category.name}
                          </Text>
                        )}
                        {search.chat_type && (
                          <Text style={styles.savedSearchDetail}>
                            {chatTypes.find(t => t.id === search.chat_type)?.icon}{' '}
                            {search.chat_type}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.savedSearchActions}>
                    <TouchableOpacity
                      style={styles.savedSearchAction}
                      onPress={() => handleToggleDefault(search)}>
                      <Icon
                        name={search.is_default ? 'star' : 'star-border'}
                        size={20}
                        color="#7c4803ff"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.savedSearchAction}
                      onPress={() => handleDeleteSearch(search)}>
                      <Icon name="delete" size={20} color="#999" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カテゴリ (Category)</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#7c4803ff" />
          ) : (
            <View style={styles.optionsList}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  selectedCategoryId === null && styles.optionItemSelected,
                ]}
                onPress={() => setSelectedCategoryId(null)}>
                <Text
                  style={[
                    styles.optionText,
                    selectedCategoryId === null && styles.optionTextSelected,
                  ]}>
                  All Categories
                </Text>
                {selectedCategoryId === null && (
                  <Icon name="check" size={20} color="#7c4803ff" />
                )}
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.optionItem,
                    selectedCategoryId === category.id && styles.optionItemSelected,
                  ]}
                  onPress={() => setSelectedCategoryId(category.id)}>
                  <Text
                    style={[
                      styles.optionText,
                      selectedCategoryId === category.id && styles.optionTextSelected,
                    ]}>
                    {category.icon} {category.name}
                  </Text>
                  {selectedCategoryId === category.id && (
                    <Icon name="check" size={20} color="#7c4803ff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Chat Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>チャットタイプ (Chat Type)</Text>
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[
                styles.optionItem,
                selectedChatType === null && styles.optionItemSelected,
              ]}
              onPress={() => setSelectedChatType(null)}>
              <Text
                style={[
                  styles.optionText,
                  selectedChatType === null && styles.optionTextSelected,
                ]}>
                All Types
              </Text>
              {selectedChatType === null && (
                <Icon name="check" size={20} color="#7c4803ff" />
              )}
            </TouchableOpacity>
            {chatTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.optionItem,
                  selectedChatType === type.id && styles.optionItemSelected,
                ]}
                onPress={() => setSelectedChatType(type.id)}>
                <Text
                  style={[
                    styles.optionText,
                    selectedChatType === type.id && styles.optionTextSelected,
                  ]}>
                  {type.icon} {type.name}
                </Text>
                {selectedChatType === type.id && (
                  <Icon name="check" size={20} color="#7c4803ff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日付範囲 (Date Range)</Text>
          
          {/* Date From */}
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>From:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateFromPicker(true)}>
              <Text style={styles.dateButtonText}>{formatDate(dateFrom)}</Text>
              <Icon name="calendar-today" size={20} color="#7c4803ff" />
            </TouchableOpacity>
            {dateFrom && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setDateFrom(null)}>
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Date To */}
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>To:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateToPicker(true)}>
              <Text style={styles.dateButtonText}>{formatDate(dateTo)}</Text>
              <Icon name="calendar-today" size={20} color="#7c4803ff" />
            </TouchableOpacity>
            {dateTo && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setDateTo(null)}>
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Pickers */}
          {showDateFromPicker && (
            <DateTimePicker
              value={dateFrom || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateFromChange}
              maximumDate={new Date()}
            />
          )}
          {showDateToPicker && (
            <DateTimePicker
              value={dateTo || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateToChange}
              maximumDate={new Date()}
              minimumDate={dateFrom || undefined}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}>
            <Icon name="clear-all" size={20} color="#666" />
            <Text style={styles.clearAllButtonText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setShowSaveModal(true)}>
            <Icon name="save" size={20} color="#7c4803ff" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}>
            <Icon name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Search Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Search Settings</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter a name for this search"
              value={saveName}
              onChangeText={setSaveName}
              autoFocus
            />

            <TouchableOpacity
              style={styles.defaultToggle}
              onPress={() => setSaveAsDefault(!saveAsDefault)}>
              <Icon
                name={saveAsDefault ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#7c4803ff"
              />
              <Text style={styles.defaultToggleText}>Set as default search</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                  setSaveAsDefault(false);
                }}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleSaveSearch}>
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItemSelected: {
    backgroundColor: '#f0f4e8',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#7c4803ff',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateLabel: {
    fontSize: 16,
    color: '#666',
    width: 60,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  clearAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
  },
  clearAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7c4803ff',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c4803ff',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#7c4803ff',
    borderRadius: 8,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  savedSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  savedSearchMain: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  savedSearchInfo: {
    flex: 1,
  },
  savedSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  savedSearchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    marginLeft: 8,
    backgroundColor: '#7c4803ff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedSearchDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  savedSearchDetail: {
    fontSize: 13,
    color: '#666',
  },
  savedSearchActions: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  savedSearchAction: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  defaultToggleText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#7c4803ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SearchSettingsScreen;
