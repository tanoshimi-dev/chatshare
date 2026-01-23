import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';

const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

export interface SavedSearchSetting {
  id: string;
  user_id: string;
  name: string;
  category_id?: string;
  chat_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by: string;
  sort_order: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateSavedSearchRequest {
  name: string;
  category_id?: string;
  chat_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
  is_default?: boolean;
}

export interface UpdateSavedSearchRequest {
  name?: string;
  category_id?: string;
  chat_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
  is_default?: boolean;
}

/**
 * Create a new saved search setting
 */
export const createSavedSearch = async (
  data: CreateSavedSearchRequest,
): Promise<SavedSearchSetting> => {
  const token = await AsyncStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE_URL}/user/search-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create saved search');
  }

  const result: ApiResponse<SavedSearchSetting> = await response.json();
  return result.data;
};

/**
 * Get all saved searches for the current user
 */
export const listSavedSearches = async (): Promise<SavedSearchSetting[]> => {
  const token = await AsyncStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE_URL}/user/search-settings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to list saved searches');
  }

  const result: ApiResponse<SavedSearchSetting[]> = await response.json();
  return result.data;
};

/**
 * Get a specific saved search by ID
 */
export const getSavedSearch = async (
  id: string,
): Promise<SavedSearchSetting> => {
  const token = await AsyncStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE_URL}/user/search-settings/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get saved search');
  }

  const result: ApiResponse<SavedSearchSetting> = await response.json();
  return result.data;
};

/**
 * Get the user's default saved search
 */
export const getDefaultSearch = async (): Promise<SavedSearchSetting | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/user/search-settings/default`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get default search');
    }

    const result: ApiResponse<SavedSearchSetting> = await response.json();
    return result.data;
  } catch (error: any) {
    if (error.message?.includes('404')) {
      return null;
    }
    throw error;
  }
};

/**
 * Update a saved search setting
 */
export const updateSavedSearch = async (
  id: string,
  data: UpdateSavedSearchRequest,
): Promise<SavedSearchSetting> => {
  const token = await AsyncStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE_URL}/user/search-settings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update saved search');
  }

  const result: ApiResponse<SavedSearchSetting> = await response.json();
  return result.data;
};

/**
 * Delete a saved search setting
 */
export const deleteSavedSearch = async (id: string): Promise<void> => {
  const token = await AsyncStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE_URL}/user/search-settings/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete saved search');
  }
};
