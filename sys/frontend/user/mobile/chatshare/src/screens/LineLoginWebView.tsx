import React, { useRef } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from 'react-native-config';
import EmulatorDetector from '../constants/EmulatorDetector';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      url: string;
    };
  };
};

export const LineLoginWebView: React.FC<Props> = ({ navigation, route }) => {
  const { url } = route.params;
  const webViewRef = useRef<WebView>(null);
  const { refreshUser } = useAuth();
  const API_BASE_URL = EmulatorDetector.getAPIUrl() || Config.API_BASE_URL || 'http://localhost:8080/api/v1';

console.log("LineLoginWebView loaded with URL:", url);

  const handleWebViewMessage = async (event: any) => {
    try {
      console.log('📬 Raw WebView message received:', event.nativeEvent.data);
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📬 Parsed WebView message:', message);
      
      if (message.type === 'LOGIN_SUCCESS' && message.data) {
        const { token, user } = message.data;
        
        console.log('✅ LOGIN_SUCCESS message received for user:', user.name);
        
        // Store auth data
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        console.log('💾 Auth data stored successfully');
        
        // Navigate back to LoginScreen which will handle the success flow
        console.log('🔄 Navigating back to Login screen...');
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Login');
        }
      }
    } catch (error) {
      console.error('💥 Error parsing WebView message:', error);
      console.error('💥 Raw message data:', event.nativeEvent.data);
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    const { url: currentUrl } = navState;

    console.log("🔍 LineLoginWebView navigation state changed:", {
      url: currentUrl,
      title: navState.title,
      loading: navState.loading,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward
    });

    // Check if this is a success page
    if (navState.title?.includes('Login Successful') || 
        currentUrl.includes('auth/success') || 
        navState.title?.includes('✅ Login Successful webview1')) {
      console.log('✅ Login success page detected, waiting for message...');
      // Don't navigate away yet, wait for WebView message
      return;
    }

    // Check if this is an error page or failure
    if (currentUrl.includes('error=') || navState.title?.includes('Login Failed')) {
      console.log('❌ Login failed or error detected');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Login');
      }
    }
  };

  const handleCancel = async () => {
    console.log('❌ User cancelled LINE login');
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LINE Login</Text>
        <View style={styles.placeholder} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00B900" />
            <Text style={styles.loadingText}>Loading LINE Login...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#00B900',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60, // Same width as cancel button for centering
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
