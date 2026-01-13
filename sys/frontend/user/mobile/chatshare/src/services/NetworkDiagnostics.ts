import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';

const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

export class NetworkDiagnostics {
  /**
   * Test basic connectivity to the API endpoint
   */
  static async testConnectivity(): Promise<{
    success: boolean;
    apiUrl: string;
    error?: string;
    details?: any;
  }> {
    const apiUrl = API_BASE_URL;
    console.log('🔍 Testing connectivity to:', apiUrl);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/categories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const result = {
        success: response.ok,
        apiUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
      
      if (response.ok) {
        console.log('✅ Connectivity test successful:', result);
        const data = await response.json();
        return { 
          success: true, 
          apiUrl,
          details: { ...result, data: data }
        };
      } else {
        console.log('❌ Connectivity test failed:', result);
        return { 
          success: false, 
          apiUrl,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: result
        };
      }
    } catch (error: any) {
      console.log('❌ Network error:', error);
      return {
        success: false,
        apiUrl,
        error: error.message || 'Network error',
        details: {
          name: error.name,
          message: error.message,
          cause: error.cause,
        }
      };
    }
  }

  /**
   * Test authenticated endpoint
   */
  static async testAuthenticatedEndpoint(): Promise<{
    success: boolean;
    hasToken: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        return {
          success: false,
          hasToken: false,
          error: 'No auth token found'
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/chats/my?page=1&limit=1`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Authenticated endpoint test successful');
        return { success: true, hasToken: true };
      } else {
        console.log('❌ Authenticated endpoint test failed:', response.status);
        return { 
          success: false, 
          hasToken: true,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
          }
        };
      }
    } catch (error: any) {
      console.log('❌ Authenticated endpoint error:', error);
      return {
        success: false,
        hasToken: true,
        error: error.message || 'Network error',
        details: {
          name: error.name,
          message: error.message,
        }
      };
    }
  }

  /**
   * Get comprehensive network status
   */
  static async getNetworkStatus(): Promise<{
    environment: any;
    connectivity: any;
    authentication?: any;
  }> {
    console.log('🔍 Running network diagnostics...');
    
    const environment = {
      apiUrl: API_BASE_URL,
      isDev: __DEV__,
      deviceInfo: EmulatorDetector.getDeviceInfo(),
      configValues: {
        API_BASE_URL: Config.API_BASE_URL,
        API_URL_IOS: Config.API_URL_IOS,
        API_URL_ANDROID: Config.API_URL_ANDROID,
      }
    };
    
    const connectivity = await this.testConnectivity();
    const authentication = await this.testAuthenticatedEndpoint();
    
    console.log('📊 Network Diagnostics Results:');
    console.log('Environment:', environment);
    console.log('Connectivity:', connectivity);
    console.log('Authentication:', authentication);
    
    return {
      environment,
      connectivity,
      authentication,
    };
  }

  /**
   * Log all diagnostics to console (useful for debugging)
   */
  static async logDiagnostics(): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 NETWORK DIAGNOSTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await this.getNetworkStatus();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

export default NetworkDiagnostics;