import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';

const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Automatically detect chat type from URL
 */
export const detectChatTypeFromUrl = (url: string): string => {
  const lowerUrl = url.toLowerCase();

  // Check for Claude AI
  if (lowerUrl.includes('claude.ai')) {
    return 'claude';
  }

  // Check for Microsoft Copilot
  if (lowerUrl.includes('copilot.microsoft.com') || lowerUrl.includes('bing.com/chat')) {
    return 'copilot';
  }

  // Check for ChatGPT (default)
  if (lowerUrl.includes('chat.openai.com') || lowerUrl.includes('chatgpt.com')) {
    return 'chatgpt';
  }

  // Default to ChatGPT if no match
  return 'chatgpt';
};

export interface Chat {
  id: string;
  title: string;
  description?: string;
  public_link: string;
  category_id?: string;
  user_id: string;
  chat_type?: string; // chatgpt, claude, copilot
  is_public: boolean;
  is_link_valid: boolean;
  is_favorited?: boolean;
  status: string;
  good_count?: number;
  view_count?: number;
  share_count?: number;
  created_at: string;
  updated_at: string;
  // Populated fields from Preload
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  // Legacy field mappings for compatibility
  content?: string;
  url?: string;
  category_name?: string;
  user_name?: string;
  user_avatar?: string;
  provider?: string;
  tags?: string[];
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
}

export interface ChatListResponse {
  success: boolean;
  data: Chat[];  // Backend returns array directly, not nested
  page?: number;
  page_size?: number;
  total?: number;
  message?: string;
}

export interface ChatDetailResponse {
  success: boolean;
  data: {
    chat: Chat;
  };
  message?: string;
}

/**
 * Fetch public chats (timeline)
 */
export const fetchPublicChats = async (
  page: number = 1,
  limit: number = 20
): Promise<Chat[]> => {
  try {
    console.log('Fetching from:', `${API_BASE_URL}/chats?page=${page}&page_size=${limit}`);
    
    // Include auth token if available to get favorite status
    const token = await AsyncStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${API_BASE_URL}/chats?page=${page}&page_size=${limit}`,
      {
        method: 'GET',
        headers,
      }
    );

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch chats: ${response.status}`);
    }

    const data: ChatListResponse = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch chats');
    }

    // Backend returns data as array directly
    return data.data || [];
  } catch (error) {
    console.error('Error fetching public chats:', error);
    throw error;
  }
};

/**
 * Fetch user's own chats
 */
export const fetchMyChats = async (
  page: number = 1,
  limit: number = 20
): Promise<Chat[]> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/chats/my?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chats: ${response.status}`);
    }

    const data: ChatListResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch chats');
    }

    return data.data.chats;
  } catch (error) {
    console.error('Error fetching my chats:', error);
    throw error;
  }
};

/**
 * Fetch a single chat by ID
 */
export const fetchChatById = async (chatId: string): Promise<Chat> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat: ${response.status}`);
    }

    const data: ChatDetailResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch chat');
    }

    return data.data.chat;
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    throw error;
  }
};

/**
 * Like a chat
 */
export const likeChat = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/like`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to like chat: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to like chat');
    }
  } catch (error) {
    console.error('Error liking chat:', error);
    throw error;
  }
};

/**
 * Unlike a chat
 */
export const unlikeChat = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/unlike`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to unlike chat: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to unlike chat');
    }
  } catch (error) {
    console.error('Error unliking chat:', error);
    throw error;
  }
};

/**
 * Search chats
 */
export const searchChats = async (
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<Chat[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chats/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search chats: ${response.status}`);
    }

    const data: ChatListResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to search chats');
    }

    return data.data.chats;
  } catch (error) {
    console.error('Error searching chats:', error);
    throw error;
  }
};

/**
 * Add a chat to favorites
 */
export const addFavorite = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/favorite`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add favorite');
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

/**
 * Remove a chat from favorites
 */
export const removeFavorite = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/favorite`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove favorite');
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

/**
 * Fetch user's favorite chats
 */
export const fetchFavoriteChats = async (
  page: number = 1,
  limit: number = 20
): Promise<Chat[]> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/chats?favorite=true&page=${page}&page_size=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch favorite chats: ${response.status}`);
    }

    const data: ChatListResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch favorite chats');
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching favorite chats:', error);
    throw error;
  }
};
