import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  isAuthenticated,
  getStoredUser,
  getCurrentUser,
  logout as authLogout,
  signInWithGoogle,
  signInWithApple,
} from '../services/authService';
import { getToSStatus, ToSStatus } from '../services/tosService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAuthenticatedUser: boolean; // true only for real authenticated users (not demo user)
  tosAccepted: boolean;
  tosLoading: boolean;
  login: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkToSStatus: () => Promise<boolean>;
  setTosAccepted: (accepted: boolean) => void;
  dummyLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [tosLoading, setTosLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const authenticated = await isAuthenticated();

      if (authenticated) {
        // Try to get current user from API
        const currentUser = await getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
          setIsLoggedIn(true);
          // Check ToS status for authenticated users
          try {
            const status = await getToSStatus();
            setTosAccepted(status.accepted);
          } catch (e) {
            console.log('Could not check ToS status on init:', e);
            setTosAccepted(false);
          }
        } else {
          // If API call fails, try to get stored user
          const storedUser = await getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsLoggedIn(true);
            // Check ToS status for authenticated users
            try {
              const status = await getToSStatus();
              setTosAccepted(status.accepted);
            } catch (e) {
              console.log('Could not check ToS status on init:', e);
              setTosAccepted(false);
            }
          } else {
            setIsLoggedIn(false);
          }
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setTosAccepted(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      const authResponse = await signInWithGoogle();
      setUser(authResponse.user);
      setIsLoggedIn(true);
      // Check ToS status after successful login
      await checkToSStatus();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async () => {
    try {
      setLoading(true);
      const authResponse = await signInWithApple();
      setUser(authResponse.user);
      setIsLoggedIn(true);
      // Check ToS status after successful login
      await checkToSStatus();
    } catch (error) {
      console.error('Apple login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authLogout();
      setUser(null);
      setIsLoggedIn(false);
      setTosAccepted(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if backend call fails
      setUser(null);
      setIsLoggedIn(false);
      setTosAccepted(false);
    } finally {
      setLoading(false);
    }
  };

  const dummyLogin = () => {
    const dummyUser: User = {
      id: '0',
      email: 'demo@example.com',
      name: 'Demo User',
      avatar: '', // Use Material icon account-circle as default
      provider: '',
      role: 'user',
      status: 'active',
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(dummyUser);
    setIsLoggedIn(true);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
        // Check ToS status after refreshing user (needed for LINE login flow)
        // Set tosLoading to prevent ToS screen flash
        setTosLoading(true);
        try {
          const status = await getToSStatus();
          setTosAccepted(status.accepted);
        } catch (e) {
          setTosAccepted(false);
        } finally {
          setTosLoading(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const checkToSStatus = async (): Promise<boolean> => {
    try {
      setTosLoading(true);
      const status = await getToSStatus();
      setTosAccepted(status.accepted);
      return status.accepted;
    } catch (error) {
      console.error('Error checking ToS status:', error);
      // If we can't check, assume not accepted for safety
      setTosAccepted(false);
      return false;
    } finally {
      setTosLoading(false);
    }
  };

  // Check if user is truly authenticated (not demo user)
  const isAuthenticatedUser = isLoggedIn && user?.id !== '0';

  const value: AuthContextType = {
    user,
    loading,
    isLoggedIn,
    isAuthenticatedUser,
    tosAccepted,
    tosLoading,
    login,
    loginWithApple,
    logout,
    refreshUser,
    checkToSStatus,
    setTosAccepted,
    dummyLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
