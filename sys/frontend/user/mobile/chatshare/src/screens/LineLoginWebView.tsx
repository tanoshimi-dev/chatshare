import React, { useRef } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

console.log("LineLoginWebView loaded with URL:", url);



  const handleNavigationStateChange = async (navState: any) => {
    const { url: currentUrl } = navState;

console.log("LineLoginWebView loaded with currentUrl:", currentUrl);


    // Check if this is the callback URL
    if (currentUrl.includes("/auth/line/callback")) {
      try {
        // Extract authorization code from URL
        const urlObj = new URL(currentUrl);
        const code = urlObj.searchParams.get("code");
        const error = urlObj.searchParams.get("error");

        if (error) {
          // Store error for LoginScreen to handle
          await AsyncStorage.setItem("line_login_error", error);
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Login');
          }
          return;
        }

        if (code) {
          // Store code for LoginScreen to handle
          await AsyncStorage.setItem("line_auth_code", code);
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Login');
          }
          return;
        }
      } catch (e) {
        console.error("Error parsing callback URL:", e);
        await AsyncStorage.setItem(
          "line_login_error",
          "Failed to parse callback URL"
        );
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Login');
        }
      }
    }
  };

  const handleCancel = async () => {
    await AsyncStorage.setItem("line_login_error", "User cancelled");
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
