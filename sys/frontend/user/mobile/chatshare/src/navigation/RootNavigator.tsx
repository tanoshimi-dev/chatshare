import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import DrawerNavigator from './DrawerNavigator';
import DetailScreen from '../screens/DetailScreen';
import ShareDetailScreen from '../screens/ShareDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { LineLoginWebView } from '../screens/LineLoginWebView';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import { useAuth } from '../contexts/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Detail: undefined;
  ShareDetail: { url: string };
  TermsOfService: undefined;
  LineLoginWebView: {
    url: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isLoggedIn, isAuthenticatedUser, tosAccepted, tosLoading, loading, logout, setTosAccepted } = useAuth();

  if (loading || tosLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Show ToS screen for authenticated users who haven't accepted
  const needsToSAcceptance = isLoggedIn && isAuthenticatedUser && !tosAccepted;

  if (needsToSAcceptance) {
    return (
      <TermsOfServiceScreen
        onAccept={() => setTosAccepted(true)}
        onDecline={logout}
      />
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="LineLoginWebView"
            component={LineLoginWebView}
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="ShareDetail" component={ShareDetailScreen} />
          <Stack.Screen
            name="LineLoginWebView"
            component={LineLoginWebView}
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default RootNavigator;
