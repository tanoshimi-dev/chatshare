import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HomeScreen from '../screens/HomeScreen';
import TimelineScreen from '../screens/TimelineScreen';
import SearchScreen from '../screens/SearchScreen';
import ShareScreen from '../screens/ShareScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const { isAuthenticatedUser } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F5F5DC',
          borderTopColor: '#A8B896',
          borderTopWidth: 1,
          height: 60,
        },
        tabBarActiveTintColor: '#6B8E23',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}>
      {/* <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-timeline" size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="search" size={size} color={color} />
          ),
        }}
      /> */}
      {/* <Tab.Screen
        name="Share"
        component={ShareScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="share" size={size} color={color} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="add-circle" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!isAuthenticatedUser) {
              e.preventDefault();
              Alert.alert('Login Required', 'Please login to register a chat');
            }
          },
        }}
      />
      <Tab.Screen
        name="Favorite"
        component={FavoriteScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="favorite" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!isAuthenticatedUser) {
              e.preventDefault();
              Alert.alert('Login Required', 'Please login to view favorites');
            }
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
