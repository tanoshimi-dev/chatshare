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

  // Check for Gemini
  if (lowerUrl.includes('gemini.google.com') || lowerUrl.includes('ai.google.dev/gemini')) {
    return 'gemini';
  }

  // Default to unknown if no match
  return 'unknown';
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
  is_gooded?: boolean;
  status: string;
  favorite_count?: number;
  good_count?: number;
  view_count?: number;
  share_count?: number;
  comment_count?: number;
  created_at: string;
  updated_at: string;
  // Populated fields from Preload
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider?: string;
    favorited_count?: number;
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

export interface SearchFilters {
  categoryId?: string | null;
  chatType?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  userId?: string | null;
  query?: string;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Fetch chats with advanced search filters
 */
// export const searchChatsAdvanced = async (
//   filters: SearchFilters,
//   page: number = 1,
//   limit: number = 20
// ): Promise<Chat[]> => {
//   try {
//     const params = new URLSearchParams();
//     params.append('page', page.toString());
//     params.append('page_size', limit.toString());
    
//     if (filters.categoryId) params.append('category_id', filters.categoryId);
//     if (filters.chatType) params.append('chat_type', filters.chatType);
//     if (filters.dateFrom) params.append('date_from', filters.dateFrom);
//     if (filters.dateTo) params.append('date_to', filters.dateTo);
//     if (filters.userId) params.append('user_id', filters.userId);
//     if (filters.query) params.append('q', filters.query);
//     if (filters.sortBy) params.append('sort_by', filters.sortBy);
//     if (filters.sortOrder) params.append('sort_order', filters.sortOrder);

//     console.log('Advanced search:', `${API_BASE_URL}/search/advanced?${params.toString()}`);
    
//     const token = await AsyncStorage.getItem('auth_token');
//     const headers: Record<string, string> = {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json',
//     };
    
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }
    
//     // Add timeout to prevent hanging
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
//     const response = await fetch(
//       `${API_BASE_URL}/search/advanced?${params.toString()}`,
//       {
//         method: 'GET',
//         headers,
//         signal: controller.signal,
//       }
//     );

//     clearTimeout(timeoutId);

//     console.log('Response status:', response.status);
//     console.log('Response OK:', response.ok);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('Search error response:', errorText);
//       throw new Error(`Failed to search chats: ${response.status}`);
//     }

//     const data: ChatListResponse = await response.json();
//     //console.log('Response data:', JSON.stringify(data, null, 2));

//     if (!data.success) {
//       throw new Error(data.message || 'Failed to search chats');
//     }

//     console.log('Returning', data.data?.length || 0, 'chats from advanced search');
//     return data.data || [];
//   } catch (error) {
//     console.error('Error in advanced search:', error);
//     if (error instanceof Error) {
//       if (error.name === 'AbortError') {
//         throw new Error('Search request timed out. Please try again.');
//       }
//       throw error;
//     }
//     throw new Error('An unknown error occurred during search');
//   }
// };

/**
 * Fetch public chats (timeline)
 */
export const fetchPublicChats = async (
  filters: SearchFilters | null = null,
  page: number = 1,
  limit: number = 20
): Promise<Chat[]> => {
  try {

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', limit.toString());
    
    if (filters?.categoryId) params.append('category_id', filters.categoryId);
    if (filters?.chatType) params.append('chat_type', filters.chatType);
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);
    if (filters?.userId) params.append('user_id', filters.userId);
    if (filters?.query) params.append('q', filters.query);
    if (filters?.sortBy) params.append('sort_by', filters.sortBy);
    if (filters?.sortOrder) params.append('sort_order', filters.sortOrder);

    //console.log('Advanced search:', `${API_BASE_URL}/search/advanced?${params.toString()}`);    
    console.log('Fetching from:', `${API_BASE_URL}/chats?${params.toString()}`);
    
    // Include auth token if available to get favorite status
    const token = await AsyncStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${API_BASE_URL}/chats?${params.toString()}`,
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
    //console.log('Response data:', JSON.stringify(data, null, 2));

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

    return data.data || [];
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
    const headers: Record<string, string> = {
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

    return data.data || [];
  } catch (error) {
    console.error('Error searching chats:', error);
    throw error;
  }
};

/**
 * Add a chat to favorites
 */
export const addFavoriteUser = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/favorite_user`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
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
export const removeFavoriteUser = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/favorite_user`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
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
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
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

/**
 * Fetch favorite users derived from favorite chats
 * Returns an array of user summary objects with a representative chat id
 */
// export const fetchFavoriteUsers = async (
//   page: number = 1,
//   limit: number = 50
// ): Promise<{
//   id: string;
//   name?: string;
//   avatar?: string;
//   provider?: string;
//   favorited_count?: number;
//   repChatId: string;
// }[]> => {
//   try {
//     const chats = await fetchFavoriteChats(page, limit);

//     const map = new Map<string, any>();
//     for (const chat of chats || []) {
//       const u = chat.user;
//       if (!u || !u.id) continue;
//       if (!map.has(u.id)) {
//         map.set(u.id, {
//           id: u.id,
//           name: u.name,
//           avatar: u.avatar || chat.user_avatar,
//           provider: u.provider,
//           favorited_count: u.favorited_count || chat.favorite_count || 0,
//           repChatId: chat.id,
//         });
//       }
//     }

//     return Array.from(map.values());
//   } catch (error) {
//     console.error('Error fetching favorite users:', error);
//     throw error;
//   }
// };

/**
 * Add a chat to good
 */
export const addGood = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/good`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add good');
    }
  } catch (error) {
    console.error('Error adding good:', error);
    throw error;
  }
};

/**
 * Remove a chat from good
 */
export const removeGood = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/good`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove good');
    }
  } catch (error) {
    console.error('Error removing good:', error);
    throw error;
  }
};

/**
 * Fetch user's good chats
 */
export const fetchGoodChats = async (
  page: number = 1,
  limit: number = 20
): Promise<Chat[]> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/chats?good=true&page=${page}&page_size=${limit}`,
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
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
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


/**
 * Update a chat (title, description, category, public link)
 */
export const updateChat = async (
  chatId: string,
  updates: {
    title?: string;
    description?: string;
    category_id?: string;
    public_link?: string;
    is_public?: boolean;
  }
): Promise<Chat> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update chat');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update chat');
    }

    return data.data;
  } catch (error) {
    console.error('Error updating chat:', error);
    throw error;
  }
};

/**
 * Delete a chat
 */
export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete chat');
    }

    const data = await response.json();

    if (!data.success && data.message) {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};
