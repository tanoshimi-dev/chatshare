// 物理デバイスから（ローカルPC内の）dockerコンテナへのアドレスは？？
// PCでifconfigで表示されたen0のinetアドレス。（PC ゲートウェイ 192.168.0.1）
// スマホのゲートウェイアドレス（スマホゲートウェイ 192.168.0.1）
//const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';
//const API_BASE_URL = 'http://192.168.0.241:8080/api/v1';
//const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Chat {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description?: string;
  public_link: string;
  is_link_valid?: boolean;
  is_public?: boolean;
  is_featured?: boolean;
  status?: string;
  view_count?: number;
  share_count?: number;
  favorite_count?: number;
  comment_count?: number;
  good_count?: number;
  last_viewed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterChatRequest {
  public_link: string;
  category_id: string;
  title: string;
  description?: string;
}

const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';


export const fetchCategories = async (): Promise<Category[]> => {


  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiResponseData = await response.json();
    if (!apiResponseData.success) {
      throw new Error('API response indicates failure');
    } else if (!Array.isArray(apiResponseData.data)) {
      throw new Error('API response data is not an array');
    }
    return apiResponseData.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const registerChat = async (data: RegisterChatRequest): Promise<Chat> => {
  try {
    // Get auth token from AsyncStorage
    const token = await AsyncStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiResponseData = await response.json();
    if (!apiResponseData.success) {
      throw new Error(apiResponseData.message || 'API response indicates failure');
    }
    return apiResponseData.data;
  } catch (error) {
    console.error('Error registering chat:', error);
    throw error;
  }
};
