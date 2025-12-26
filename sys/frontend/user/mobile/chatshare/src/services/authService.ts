import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.0.241:8080/api/v1';

// Configure Google Sign-In
// You need to configure this with your Google OAuth Client ID from Google Cloud Console
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Google Cloud Console
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
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
    // Step 1: Request redirect URL with state from backend
    const redirectResponse = await fetch(`${API_BASE_URL}/auth/google/redirect`);
    if (!redirectResponse.ok) {
      throw new Error('Failed to get redirect URL');
    }

    const redirectData = await redirectResponse.json();
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

// Get current authenticated user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

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

    // Clear local storage
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('oauth_state');

    // Optionally call backend logout endpoint
    const token = await getAuthToken();
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
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
