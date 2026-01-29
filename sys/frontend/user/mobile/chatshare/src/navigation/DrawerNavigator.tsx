import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabNavigator from './BottomTabNavigator';
import AccountScreen from '../screens/AccountScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SearchSettingsScreen from '../screens/SearchSettingsScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: '60%',
          backgroundColor: '#A8B896', // Sage green color
        },
        overlayColor: 'transparent',
      }}>
      <Drawer.Screen name="Tabs" component={BottomTabNavigator} />
      <Drawer.Screen name="Account" component={AccountScreen} />
      <Drawer.Screen name="SearchSettings" component={SearchSettingsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      {/* <Drawer.Screen name="History" component={HistoryScreen} /> */}
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
