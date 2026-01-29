import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';

const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

export type ContentType = 'chat' | 'comment';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'adult_content'
  | 'misinformation'
  | 'copyright'
  | 'other';

export interface CreateReportRequest {
  content_type: ContentType;
  content_id: string;
  reason: ReportReason;
  description?: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  content_type: ContentType;
  content_id: string;
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'adult_content', label: 'Adult or inappropriate content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'copyright', label: 'Copyright infringement' },
  { value: 'other', label: 'Other' },
];

export const createReport = async (request: CreateReportRequest): Promise<Report> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('Your session has expired. Please login again.');
        error.status = 401;
        throw error;
      }
      if (response.status === 409) {
        throw new Error('You have already reported this content');
      }
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create report');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create report');
    }

    return data.data;
  } catch (error: any) {
    console.error('Error creating report:', error);
    throw error;
  }
};
