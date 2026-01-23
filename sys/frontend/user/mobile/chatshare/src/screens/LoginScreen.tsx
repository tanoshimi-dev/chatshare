import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { 
  signInWithGoogle, 
  configureGoogleSignIn,
  configureLineLogin, 
  isLineLoginAvailable
} from '../services/authService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
// import { Config } from 'react-native-config';
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';
import NetworkDiagnostics from '../services/NetworkDiagnostics';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  onLoginSuccess?: () => void;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLoginSuccess }) => {

  const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

  const [loading, setLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [loginProcessed, setLoginProcessed] = useState(false);
  const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);
  const { dummyLogin, refreshUser } = useAuth();

  React.useEffect(() => {
    // Configure Google Sign-In and LINE Login when component mounts
    configureGoogleSignIn();
    configureLineLogin(); // Now synchronous, returns boolean
  }, []);

  // Monitor app state changes to detect when user returns from LINE app/browser
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('📱 App state changed:', appStateVisible, '->', nextAppState);
      
      if (appStateVisible.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 App became active, checking for LINE auth completion...');
        
        // Check if we have LINE loading state and should check for auth data
        if (lineLoading && !loginProcessed) {
          setTimeout(async () => {
            try {
              const token = await AsyncStorage.getItem('auth_token');
              const userStr = await AsyncStorage.getItem('user');
              
              if (token && userStr) {
                console.log('✅ Found auth data after app became active');
                setLoginProcessed(true);
                
                const user = JSON.parse(userStr);
                console.log('🔄 Calling refreshUser after app return...');
                await refreshUser();
                console.log('✅ refreshUser completed after app return');
                
                Alert.alert('Success 1 LINE LOGIN ', `Welcome ${user.name}!`, [
                  {
                    text: 'OK',
                    onPress: () => {
                      console.log('🚀 Calling onLoginSuccess callback after app return');
                      if (onLoginSuccess) {
                        onLoginSuccess();
                      }
                      setLineLoading(false);
                    },
                  },
                ]);
              }
            } catch (error) {
              console.error('💥 Error checking auth after app return:', error);
            }
          }, 500); // Small delay to ensure app is fully active
        }
      }
      
      setAppStateVisible(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [appStateVisible, lineLoading, loginProcessed, onLoginSuccess, refreshUser]);

  // Handle success deep links as fallback for LINE app redirects
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep link received:', url);
      console.log('🔍 URL analysis:', {
        fullURL: url,
        startsWithSuccess: url.startsWith('chatshare://auth/success'),
        loginProcessed: loginProcessed
      });
      
      if (url.startsWith('chatshare://auth/success')) {
        console.log('✅ Success callback deep link detected');
        
        // Prevent duplicate processing
        if (loginProcessed) {
          console.log('⚠️ Login already processed, skipping duplicate');
          return;
        }
        
        try {
          setLoginProcessed(true);
          setLineLoading(true); // Show loading while processing
          
          const urlObj = new URL(url);
          const token = urlObj.searchParams.get('token');
          const userParam = urlObj.searchParams.get('user');

          console.log('🔍 Deep link params:', { token: token ? 'present' : 'missing', user: userParam ? 'present' : 'missing' });

          if (token && userParam) {
            const user = JSON.parse(decodeURIComponent(userParam));
            
            // Store auth data
            await AsyncStorage.setItem('auth_token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            console.log('✅ Auth data stored for user:', user.name);
            
            // Refresh auth state first
            console.log('🔄 Calling refreshUser...');
            await refreshUser();
            console.log('✅ refreshUser completed');
            
            // Close WebView if it's still open
            console.log('🔙 Attempting to close LineLoginWebView...');
            navigation.goBack();
            
            // Small delay to ensure navigation completes
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Then show success
            Alert.alert('Success 2 LINE LOGIN ', `Welcome ${user.name}!`, [
              {
                text: 'OK',
                onPress: async () => {
                  console.log('🔄 User clicked OK on success dialog');
                  setLineLoading(false); // Reset loading state first
                  if (onLoginSuccess) {
                    console.log('🚀 Calling onLoginSuccess callback');
                    onLoginSuccess();
                  }
                  console.log('✅ Login success flow completed');
                },
              },
            ]);
          } else {
            throw new Error('Missing token or user data in deep link');
          }
        } catch (error: any) {
          console.error('💥 Deep link processing error:', error);
          Alert.alert('Login Failed', error.message || 'Failed to process login data');
          setLineLoading(false);
          setLoginProcessed(false);
        }
      }
    };

    // Listen for deep links when app is already running
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      console.log('🔔 Deep link event received:', event.url);
      handleDeepLink(event.url);
    });

    // Check if app was opened by a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 App opened with initial deep link:', url);
        handleDeepLink(url);
      }
    });

    return () => {
      console.log('🧹 Cleaning up deep link listeners');
      linkingSubscription?.remove();
    };
  }, [API_BASE_URL, onLoginSuccess, refreshUser, loginProcessed]);

  // Reset LINE loading state when screen is focused (user returned from WebView)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 LoginScreen focused, checking auth status...');
      
      const checkAuthAfterReturn = async () => {
        try {
          // Small delay to ensure app is fully focused
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check if user just returned from successful LINE login
          const token = await AsyncStorage.getItem('auth_token');
          const userStr = await AsyncStorage.getItem('user');
          
          if (token && userStr && !loginProcessed) {
            console.log('✅ Found auth data after returning from WebView');
            setLoginProcessed(true);
            
            const user = JSON.parse(userStr);
            console.log('🔄 Calling refreshUser after return...');
            await refreshUser();
            console.log('✅ refreshUser completed after return');
            
            // Close WebView if it's still open
            console.log('🔙 Attempting to close LineLoginWebView after focus...');
            try {
              navigation.goBack();
            } catch (e) {
              console.log('⚠️ Navigation goBack failed (may already be on LoginScreen):', e);
            }
            
            // Small delay to ensure navigation completes
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Show success and trigger callback
            Alert.alert('Success 3 LINE LOGIN ', `Welcome ${user.name}!`, [
              {
                text: 'OK',
                onPress: () => {
                  console.log('🚀 Calling onLoginSuccess callback after return');
                  setLineLoading(false); // Reset loading state
                  if (onLoginSuccess) {
                    onLoginSuccess();
                  }
                  console.log('✅ Login success flow completed after return');
                },
              },
            ]);
          } else {
            // Reset loading state when returning from WebView without success
            setLineLoading(false);
            // Reset login processed flag when returning to login screen
            setLoginProcessed(false);
          }
        } catch (error) {
          console.error('💥 Error checking auth after return:', error);
          setLineLoading(false);
          setLoginProcessed(false);
        }
      };
      
      checkAuthAfterReturn();
    }, [onLoginSuccess, refreshUser, loginProcessed])
  );

  const handleDummyLogin = () => {
    dummyLogin();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const authResponse = await signInWithGoogle();

      Alert.alert(
        'Success',
        `Welcome ${authResponse.user.name}!`,
        [
          {
            text: 'OK',
            onPress: async () => {
              await refreshUser();
              if (onLoginSuccess) {
                onLoginSuccess();
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'An error occurred during sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleLineSignIn = async () => {
  //   setLineLoading(true);
  //   try {
  //     const authResponse = await signInWithLine();

  //     Alert.alert(
  //       'Success',
  //       `Welcome ${authResponse.user.name}!`,
  //       [
  //         {
  //           text: 'OK',
  //           onPress: () => {
  //             if (onLoginSuccess) {
  //               onLoginSuccess();
  //             } else {
  //               navigation.navigate('Home');
  //             }
  //           },
  //         },
  //       ]
  //     );
  //   } catch (error: any) {
  //     console.error('LINE sign in error:', error);
  //     Alert.alert(
  //       'Sign In Failed',
  //       error.message || 'An error occurred during LINE sign in. Please try again.'
  //     );
  //   } finally {
  //     setLineLoading(false);
  //   }
  // };

  const handleLineSignIn = async () => {
    setLineLoading(true);
    try {
      // Check if backend is available
      if (!isLineLoginAvailable()) {
        Alert.alert(
          "LINE Login Unavailable",
          "LINE login requires backend configuration. Please configure LINE_CHANNEL_ID and backend URL."
        );
        setLineLoading(false);
        return;
      }
    
      console.log("Using LINE Channel ID:", Config.LINE_CHANNEL_ID);
      console.log("Using API Base URL:", `${API_BASE_URL}/auth/line/url`);

      // Get OAuth URL from backend
      const urlResponse = await fetch(`${API_BASE_URL}/auth/line/url`, {
        headers: {
          'User-Agent': 'ChatShare-Mobile/1.0',
        },
      });
      const urlData = await urlResponse.json();

      if (!urlData.success) {
        throw new Error("Failed to get LINE OAuth URL");
      }

      const { url, state } = urlData.data;
      await AsyncStorage.setItem("line_oauth_state", state);

      // Open LINE OAuth URL in WebView instead of system browser to prevent extra tabs
      navigation.navigate('LineLoginWebView', { url });
      // Don't set lineLoading to false here - it will be handled by WebView callback
    } catch (error: any) {
      console.error("LINE sign in error:", error);
      Alert.alert("Sign In Failed", error.message || "An error occurred");
      setLineLoading(false);
    }
  };

  const openPrivacyPolicy = async () => {
    const url = 'https://chatshare.dev/policy';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', url);
      }
    } catch (error: any) {
      Alert.alert('Unable to open link', error?.message || 'An error occurred');
    }
  };

  const handleNetworkDebug = async () => {
    try {
      console.log('🔍 Running network diagnostics...');
      const diagnostics = await NetworkDiagnostics.getNetworkStatus();
      
      let message = `API URL: ${diagnostics.environment.apiUrl}\n`;
      message += `Environment: ${diagnostics.environment.isDev ? 'Development' : 'Production'}\n`;
      message += `Device: ${diagnostics.environment.deviceInfo.deviceType}\n\n`;
      
      if (diagnostics.connectivity.success) {
        message += '✅ Basic connectivity: OK\n';
      } else {
        message += `❌ Basic connectivity: ${diagnostics.connectivity.error}\n`;
      }
      
      if (diagnostics.authentication?.success) {
        message += '✅ Authentication: OK\n';
      } else if (diagnostics.authentication?.hasToken) {
        message += `❌ Authentication: ${diagnostics.authentication.error}\n`;
      } else {
        message += '⚠️ Authentication: No token (not logged in)\n';
      }
      
      Alert.alert('Network Diagnostics', message);
    } catch (error: any) {
      Alert.alert('Debug Error', error.message || 'Failed to run diagnostics');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Title */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>ChatShare</Text>
          <Text style={styles.subtitle}>Share your conversations</Text>
        </View>

        {/* Sign In Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.dummyButton}
            onPress={handleDummyLogin}
          >
            <Text style={styles.buttonText}>Demo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.buttonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.lineButton, lineLoading && styles.buttonDisabled]}
            onPress={handleLineSignIn}
            disabled={lineLoading}
          >
            {lineLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.loadingText}>Waiting for LINE login...</Text>
              </View>
            ) : (
              <>
                <View style={styles.lineIconContainer}>
                  <Text style={styles.lineIcon}>LINE</Text>
                </View>
                <Text style={styles.buttonText}>Sign in with LINE</Text>
              </>
            )}
          </TouchableOpacity>

          {lineLoading && (
            <Text style={styles.helpText}>
              Complete your login in the browser, then return to this app
            </Text>
          )}

          <TouchableOpacity
            style={styles.debugButton}
            onPress={handleNetworkDebug}
          >
            <Text style={styles.debugButtonText}>🔍 Network Debug ver 14</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By signing in, you agree to our Terms of Service and
            {'\n'}
            <Text style={styles.linkText} onPress={openPrivacyPolicy}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  dummyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  lineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B900',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  lineIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lineIcon: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#00B900',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  debugButton: {
    backgroundColor: '#666',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
