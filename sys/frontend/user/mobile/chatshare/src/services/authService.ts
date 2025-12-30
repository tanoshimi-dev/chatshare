import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';
import { Linking } from 'react-native';
import { WebView } from "react-native-webview";

// Declare global types for LINE OAuth
declare global {
  var lineLoginCallback: ((code: string) => void) | undefined;
  var lineOAuthUrl: string | undefined;
}

const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';
//const API_BASE_URL = Config.API_BASE_URL || 'http://localhost:8080/api/v1';
//const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';

// Configure Google Sign-In
// IMPORTANT: Use Web Client ID (OAuth 2.0 Web Application), NOT Android Client ID!
// The Android client is used implicitly via SHA-1 configuration in Google Cloud Console
export const configureGoogleSignIn = () => {
  const webClientId = Config.GOOGLE_WEB_CLIENT_ID;
  
  if (!webClientId) {
    throw new Error(
      'GOOGLE_WEB_CLIENT_ID is not configured. Please create a .env file with your Google Web Client ID.'
    );
  }
  
  GoogleSignin.configure({
    webClientId, // Web Client ID from .env file (type: Web application)
    offlineAccess: true, // Required to get serverAuthCode for backend validation
    forceCodeForRefreshToken: true,
  });
};

// LINE Login configuration
// Using OAuth web flow since native SDK has compatibility issues
export const configureLineLogin = () => {
  const channelId = Config.LINE_CHANNEL_ID;
  
  if (!channelId) {
    console.warn('LINE_CHANNEL_ID is not configured in .env file');
    return false;
  }
  
  console.log('LINE Login configured for web flow');
  return true;
};

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
  role: string;
  status: string;
  email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Google Sign-In Flow following the sequence diagram
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    // Simplified flow for testing without backend
    // TODO: Implement full backend OAuth flow later
    
    console.log('Starting Google Sign-In...');
    
    // Sign in with Google using Google Sign-In SDK
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    console.log('Google Sign-In successful:', userInfo.data);

    // Create a mock auth response from Google user info
    // In production, this should come from your backend after validating the serverAuthCode
    const authResponse: AuthResponse = {
      token: `mock_token_${Date.now()}`, // Mock JWT token
      user: {
        id: userInfo.data.user.id,
        email: userInfo.data.user.email,
        name: userInfo.data.user.name || '',
        avatar: userInfo.data.user.photo || '',
        provider: 'google',
        role: 'user',
        status: 'active',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    // Store token and user data
    await AsyncStorage.setItem('auth_token', authResponse.token);
    await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));

    return authResponse;
  } catch (error: any) {
    console.error('Google Sign-In error:', error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Play Services not available');
    } else {
      throw error;
    }
  }
};

// LINE Sign-In Flow (Web OAuth)
// TODO: Implement full web-based OAuth flow when backend is ready
// export const signInWithLine = async (): Promise<AuthResponse> => {
//   try {
//     console.log('Starting LINE Sign-In...');
    
//     const channelId = Config.LINE_CHANNEL_ID;
//     if (!channelId) {
//       throw new Error('LINE_CHANNEL_ID is not configured. Please add it to your .env file.');
//     }

//     // For now, create a mock user (will be replaced with actual OAuth flow)
//     // In production, this will:
//     // 1. Open LINE login page in WebView/Browser
//     // 2. Get authorization code from callback
//     // 3. Send to backend for token exchange
//     // 4. Receive user profile from backend
    
//     console.log('LINE Sign-In - Mock mode (backend integration pending)');

//     // Create mock auth response
//     const mockUserId = `line_${Date.now()}`;
//     const authResponse: AuthResponse = {
//       token: `mock_token_line_${Date.now()}`,
//       user: {
//         id: mockUserId,
//         email: `${mockUserId}@line.user`,
//         name: 'LINE User (Demo)',
//         avatar: '',
//         provider: 'line',
//         role: 'user',
//         status: 'active',
//         email_verified: false,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       },
//     };

//     // Store token and user data
//     await AsyncStorage.setItem('auth_token', authResponse.token);
//     await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));

//     return authResponse;
//   } catch (error: any) {
//     console.error('LINE Sign-In error:', error);
//     throw new Error(error.message || 'LINE sign-in failed');
//   }
// };

// ORIGINAL BACKEND-VALIDATED FLOW (commented out for reference)
/*
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    // Step 1: Request redirect URL with state from backend
    console.log('Fetching redirect URL from:', `${API_BASE_URL}/auth/google/redirect`);
    
    const redirectResponse = await fetch(`${API_BASE_URL}/auth/google/redirect`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }).catch((error) => {
      console.error('Network error connecting to backend:', error);
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Is the server running? Error: ${error.message}`);
    });

    if (!redirectResponse.ok) {
      const errorText = await redirectResponse.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Backend error (${redirectResponse.status}): ${errorText}`);
    }

    const redirectData = await redirectResponse.json();
    console.log('Redirect response:', redirectData);
    
    if (!redirectData.success) {
      throw new Error(redirectData.message || 'Failed to get redirect URL');
    }

    const { state } = redirectData.data;

    // Step 2: Store state in local storage (sessionStorage equivalent)
    await AsyncStorage.setItem('oauth_state', state);

    // Step 3: Sign in with Google using Google Sign-In SDK
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    // Step 4: Get authorization code
    // Note: In React Native, we use the ID token instead of authorization code
    // This is a different approach than web OAuth, but works with backend validation
    const { serverAuthCode } = userInfo;

    if (!serverAuthCode) {
      throw new Error('Failed to get authorization code from Google');
    }

    // Step 5: Retrieve stored state
    const storedState = await AsyncStorage.getItem('oauth_state');
    if (!storedState) {
      throw new Error('State token not found');
    }

    // Step 6: Send code and state to backend for validation
    const callbackResponse = await fetch(`${API_BASE_URL}/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: serverAuthCode,
        state: storedState,
      }),
    });

    // Step 7: Clean up state
    await AsyncStorage.removeItem('oauth_state');

    if (!callbackResponse.ok) {
      throw new Error('Failed to authenticate with backend');
    }

    const callbackData = await callbackResponse.json();
    if (!callbackData.success) {
      throw new Error(callbackData.message || 'Authentication failed');
    }

    const authResponse: AuthResponse = callbackData.data;

    // Step 8: Store token and user data
    await AsyncStorage.setItem('auth_token', authResponse.token);
    await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));

    return authResponse;
  } catch (error: any) {
    // Clean up state on error
    await AsyncStorage.removeItem('oauth_state');

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Play Services not available');
    } else {
      throw error;
    }
  }
};
*/

// Get current authenticated user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    // For now, return stored user since backend endpoints aren't ready
    // TODO: Uncomment when backend is implemented
    /*
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token might be invalid, clear it
      await logout();
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      return null;
    }

    return data.data;
    */
    
    // For now, return stored user data
    return await getStoredUser();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get stored user from AsyncStorage
export const getStoredUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem('user');
    if (!userJson) {
      return null;
    }
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
};

// Get stored auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return token !== null;
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    // Sign out from Google
    await GoogleSignin.signOut();

    // Clear local storage (includes LINE session if any)
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('oauth_state');

    // TODO: Uncomment when backend is ready
    // Optionally call backend logout endpoint
    /*
    const token = await getAuthToken();
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    */
  } catch (error) {
    console.error('Error during logout:', error);
    // Still clear local data even if backend call fails
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('oauth_state');
  }
};

// Make authenticated API call helper
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};




///////////////////
// LINE Sign-In Flow (Production)
export const signInWithLine = async (): Promise<AuthResponse> => {
  try {
    console.log("Starting LINE Sign-In...");
    console.log("Using LINE Channel ID:", Config.LINE_CHANNEL_ID);
    console.log("Using API Base URL:", API_BASE_URL);
    // Step 1: Get OAuth URL from backend
    const urlResponse = await fetch(`${API_BASE_URL}/auth/line/url`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!urlResponse.ok) {
      throw new Error("Failed to get LINE OAuth URL");
    }

    const urlData = await urlResponse.json();
    if (!urlData.success) {
      throw new Error(urlData.message || "Failed to get OAuth URL");
    }

    const { url, state } = urlData.data;

    // Store state for validation
    await AsyncStorage.setItem("line_oauth_state", state);

    // Step 2: Open LINE OAuth in browser/WebView
    // This will be handled by LineLoginWebView component
    return new Promise((resolve, reject) => {
      // WebView will call this callback with the code
      global.lineLoginCallback = async (code: string) => {
        try {
          // Step 3: Send code to backend
          const callbackResponse = await fetch(
            `${API_BASE_URL}/auth/line/callback`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code,
                state,
              }),
            }
          );

          if (!callbackResponse.ok) {
            throw new Error("Failed to authenticate with backend");
          }

          const callbackData = await callbackResponse.json();
          if (!callbackData.success) {
            throw new Error(callbackData.message || "Authentication failed");
          }

          const authResponse: AuthResponse = callbackData.data;

          // Step 4: Store token and user
          await AsyncStorage.setItem("auth_token", authResponse.token);
          await AsyncStorage.setItem("user", JSON.stringify(authResponse.user));
          await AsyncStorage.removeItem("line_oauth_state");

          resolve(authResponse);
        } catch (error) {
          reject(error);
        }
      };

      // Open LINE login (will be handled by navigation)
      global.lineOAuthUrl = url;
    });
  } catch (error: any) {
    console.error("LINE Sign-In error:", error);
    throw new Error(error.message || "LINE sign-in failed");
  }
};

// Helper to check if LINE login is available
export const isLineLoginAvailable = (): boolean => {
  const channelId = Config.LINE_CHANNEL_ID;
  const apiBase = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || '';

  // LINE login is considered available when a channel ID is configured
  // and there is an API base URL configured (emulator detector or env).
  // Do not rely on a hardcoded negative comparison; allow development hosts
  // to be used — network failures will be surfaced when attempting the flow.
  return !!channelId && !!apiBase;
};