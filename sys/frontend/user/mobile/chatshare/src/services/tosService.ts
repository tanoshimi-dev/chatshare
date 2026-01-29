import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';

const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

export interface ToSStatus {
  accepted: boolean;
  current_version: string;
  accepted_at?: string;
  accepted_version?: string;
}

export const getToSStatus = async (): Promise<ToSStatus> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/tos/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to get ToS status');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get ToS status');
    }

    return data.data;
  } catch (error: any) {
    console.error('Error getting ToS status:', error);
    throw error;
  }
};

export const acceptToS = async (): Promise<ToSStatus> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/tos/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to accept ToS');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to accept ToS');
    }

    return data.data;
  } catch (error: any) {
    console.error('Error accepting ToS:', error);
    throw error;
  }
};
