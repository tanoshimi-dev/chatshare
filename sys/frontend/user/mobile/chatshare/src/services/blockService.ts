import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';

const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason?: string;
  created_at: string;
  blocked?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface PaginatedBlockedUsers {
  items: BlockedUser[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export const fetchBlockedUsers = async (page: number = 1, pageSize: number = 20): Promise<PaginatedBlockedUsers> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/user/blocked-users?page=${page}&page_size=${pageSize}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch blocked users');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch blocked users');
    }

    return {
      items: data.data || [],
      page: data.page || page,
      page_size: data.page_size || pageSize,
      total: data.total || 0,
      total_pages: data.total_pages || 0,
    };
  } catch (error: any) {
    console.error('Error fetching blocked users:', error);
    throw error;
  }
};

export const fetchBlockedUserIds = async (): Promise<string[]> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/user/blocked-users/ids`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch blocked user IDs');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch blocked user IDs');
    }

    return data.data || [];
  } catch (error: any) {
    console.error('Error fetching blocked user IDs:', error);
    throw error;
  }
};

export const blockUser = async (userId: string, reason?: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/user/blocked-users/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
      if (response.status === 409) {
        throw new Error('User is already blocked');
      }
      if (response.status === 400) {
        throw new Error('You cannot block yourself');
      }
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to block user');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to block user');
    }
  } catch (error: any) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

export const unblockUser = async (userId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/user/blocked-users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
      if (response.status === 404) {
        throw new Error('User is not blocked');
      }
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to unblock user');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to unblock user');
    }
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

export const isUserBlocked = async (userId: string): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/user/blocked-users/${userId}/check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to check blocked status');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to check blocked status');
    }

    return data.data?.blocked || false;
  } catch (error: any) {
    console.error('Error checking blocked status:', error);
    throw error;
  }
};
