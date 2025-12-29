import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  onLoginSuccess?: () => void;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLoginSuccess }) => {

  const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

  const [loading, setLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const { dummyLogin } = useAuth();

  React.useEffect(() => {
    // Configure Google Sign-In and LINE Login when component mounts
    configureGoogleSignIn();
    configureLineLogin(); // Now synchronous, returns boolean
  }, []);

  // Check for LINE auth callback results when screen is focused
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
            // Exchange code for token
            const state = await AsyncStorage.getItem('line_oauth_state');
            const callbackResponse = await fetch(
              `${Config.API_BASE_URL}/auth/line/callback`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: authCode, state }),
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
                onPress: () => {
                  if (onLoginSuccess) {
                    onLoginSuccess();
                  } else {
                    navigation.navigate('Home');
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
            onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess();
              } else {
                navigation.navigate('Home');
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
      //console.log("Using API Base URL:", `${Config.API_BASE_URL}/auth/line/url`);
      console.log("Using API Base URL:", `${API_BASE_URL}/auth/line/url`);

      // Get OAuth URL from backend
      //const urlResponse = await fetch(`${Config.API_BASE_URL}/auth/line/url`);
      const urlResponse = await fetch(`${API_BASE_URL}/auth/line/url`);
      const urlData = await urlResponse.json();

      if (!urlData.success) {
        throw new Error("Failed to get LINE OAuth URL");
      }

      const { url, state } = urlData.data;
      await AsyncStorage.setItem("line_oauth_state", state);

      // Navigate to WebView (callback will be handled when screen refocuses)
      navigation.navigate("LineLoginWebView", { url });
    } catch (error: any) {
      console.error("LINE sign in error:", error);
      Alert.alert("Sign In Failed", error.message || "An error occurred");
      setLineLoading(false);
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
            <Text style={styles.buttonText}>Login (Demo)</Text>
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

          <Text style={styles.termsText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
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
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
