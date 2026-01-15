import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
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
  const { dummyLogin, refreshUser } = useAuth();

  React.useEffect(() => {
    // Configure Google Sign-In and LINE Login when component mounts
    configureGoogleSignIn();
    configureLineLogin(); // Now synchronous, returns boolean
  }, []);

  // Handle deep links for LINE login callback
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      if (url.startsWith('chatshare://auth/line/callback')) {
        console.log('✅ LINE callback deep link detected');
        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          const error = urlObj.searchParams.get('error');
          const errorDescription = urlObj.searchParams.get('error_description');

          console.log('📋 Parsed params:', { code, error, errorDescription });

          if (error) {
            const errorMessage = errorDescription || error;
            console.log('❌ OAuth error:', errorMessage);
            if (error !== 'access_denied') { // access_denied means user cancelled
              Alert.alert('Login Failed', errorMessage);
            }
            setLineLoading(false);
            return;
          }

          if (code) {
            console.log('🔄 Processing authorization code:', code);
            // Exchange code for token using POST endpoint
            const state = await AsyncStorage.getItem('line_oauth_state');
            console.log('📝 Retrieved state from storage:', state);
            
            const callbackResponse = await fetch(
              `${API_BASE_URL}/auth/line/callback`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  code: code,
                  state: state || ''
                })
              }
            );

            console.log('📡 Backend response status:', callbackResponse.status);
            console.log('📡 Backend response headers:', callbackResponse.headers);
            
            // Get raw text first to debug JSON parsing issues
            const responseText = await callbackResponse.text();
            console.log('📄 Backend raw response:', responseText);
            
            let callbackData;
            try {
              callbackData = JSON.parse(responseText);
              console.log('📄 Backend parsed data:', callbackData);
            } catch (parseError) {
              console.error('💥 JSON parse error:', parseError);
              console.error('💥 Raw response that failed to parse:', responseText);
              throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}...`);
            }

            if (!callbackData.success) {
              throw new Error(callbackData.message);
            }

            const authResponse = callbackData.data;

            // Store auth data
            await AsyncStorage.setItem('auth_token', authResponse.token);
            await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));

            console.log('✅ Login successful for user:', authResponse.user.name);
            Alert.alert('Success', `Welcome ${authResponse.user.name}!`, [
              {
                text: 'OK',
                onPress: async () => {
                  console.log('🔄 User clicked OK on success dialog');
                  try {
                    console.log('🔄 Calling refreshUser...');
                    await refreshUser();
                    console.log('✅ refreshUser completed');
                    
                    if (onLoginSuccess) {
                      console.log('🚀 Calling onLoginSuccess callback');
                      onLoginSuccess();
                    } else {
                      console.log('✅ No onLoginSuccess callback - relying on auth state change for navigation');
                      // Don't manually navigate - let the RootNavigator handle the state change
                      // The authentication state change will automatically trigger navigation to Main screen
                    }
                    console.log('✅ Login success flow completed');
                  } catch (error) {
                    console.error('💥 Error in login success flow:', error);
                  }
                },
              },
            ]);
            setLineLoading(false);
          }
        } catch (error: any) {
          console.error('💥 Deep link processing error:', error);
          Alert.alert('Login Failed', error.message);
          setLineLoading(false);
        }
      } else {
        console.log('ℹ️ Non-LINE deep link received:', url);
      }
    };

    console.log('🎯 Setting up deep link listeners...');

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
      } else {
        console.log('📱 App opened normally (no deep link)');
      }
    });

    return () => {
      console.log('🧹 Cleaning up deep link listeners');
      linkingSubscription?.remove();
    };
  }, [API_BASE_URL, onLoginSuccess, refreshUser]);

  // Check for LINE auth callback results when screen is focused (legacy WebView support)
  useFocusEffect(
    React.useCallback(() => {
      const checkLineCallback = async () => {
        try {
          const authCode = await AsyncStorage.getItem('line_auth_code');
          const error = await AsyncStorage.getItem('line_login_error');

          // Clear the stored values
          await AsyncStorage.removeItem('line_auth_code');
          await AsyncStorage.removeItem('line_login_error');

          if (error) {
            if (error !== 'User cancelled') {
              Alert.alert('Login Failed', error);
            }
            setLineLoading(false);
            return;
          }

          if (authCode) {
            // Exchange code for token using POST endpoint
            const state = await AsyncStorage.getItem('line_oauth_state');
            const callbackResponse = await fetch(
              `${API_BASE_URL}/auth/line/callback`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  code: authCode,
                  state: state || ''
                })
              }
            );

            const callbackData = await callbackResponse.json();

            if (!callbackData.success) {
              throw new Error(callbackData.message);
            }

            const authResponse = callbackData.data;

            // Store auth data
            await AsyncStorage.setItem('auth_token', authResponse.token);
            await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));

            Alert.alert('Success', `Welcome ${authResponse.user.name}!`, [
              {
                text: 'OK',
                onPress: async () => {
                  await refreshUser();
                  if (onLoginSuccess) {
                    onLoginSuccess();
                  }
                },
              },
            ]);
            setLineLoading(false);
          }
        } catch (error: any) {
          Alert.alert('Login Failed', error.message);
          setLineLoading(false);
        }
      };

      checkLineCallback();
    }, [navigation, onLoginSuccess])
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

      // Open LINE OAuth URL in system browser for better deep link handling
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        // Don't set lineLoading to false here - it will be handled by deep link callback
      } else {
        throw new Error("Cannot open LINE login URL");
      }
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
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={styles.lineIconContainer}>
                  <Text style={styles.lineIcon}>LINE</Text>
                </View>
                <Text style={styles.buttonText}>Sign in with LINE</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.debugButton}
            onPress={handleNetworkDebug}
          >
            <Text style={styles.debugButtonText}>🔍 Network Debug</Text>
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
