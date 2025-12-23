import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Text,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import WebView from 'react-native-webview';

type RootStackParamList = {
  ShareDetail: { url: string };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ShareDetail'>;
  route: RouteProp<RootStackParamList, 'ShareDetail'>;
};

const ShareDetailScreen = ({ navigation, route }: Props) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#A8B896" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={32} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shared Content</Text>
        <View style={styles.placeholder} />
      </View>

      {/* WebView Content Area */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={64} color="#666" />
            <Text style={styles.errorText}>Failed to load content</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(false);
                setLoading(true);
              }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A8B896" />
                <Text style={styles.loadingText}>Loading content...</Text>
              </View>
            )}
            <WebView
              source={{ uri: url }}
              style={styles.webview}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8B896',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#A8B896',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ShareDetailScreen;
