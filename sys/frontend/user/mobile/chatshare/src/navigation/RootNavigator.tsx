import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DrawerNavigator from './DrawerNavigator';
import DetailScreen from '../screens/DetailScreen';
import ShareDetailScreen from '../screens/ShareDetailScreen';

export type RootStackParamList = {
  Main: undefined;
  Detail: undefined;
  ShareDetail: { url: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}>
      <Stack.Screen name="Main" component={DrawerNavigator} />
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="ShareDetail" component={ShareDetailScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
