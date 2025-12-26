import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import DrawerNavigator from './DrawerNavigator';
import DetailScreen from '../screens/DetailScreen';
import ShareDetailScreen from '../screens/ShareDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../contexts/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Detail: undefined;
  ShareDetail: { url: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="ShareDetail" component={ShareDetailScreen} />
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
