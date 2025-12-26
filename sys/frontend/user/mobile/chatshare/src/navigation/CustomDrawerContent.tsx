import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            props.navigation.closeDrawer();
            await logout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => props.navigation.closeDrawer()}>
          <Icon name="close" size={32} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Drawer Content */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerContent}>
        {/* Drawer Menu Items */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.navigate('Account');
          }}>
          <Icon name="account-circle" size={24} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.navigate('History');
          }}>
          <Icon name="history" size={24} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuItemText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.navigate('Settings');
          }}>
          <Icon name="settings" size={24} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleLogout}>
          <Icon name="logout" size={24} color="#7c4803ff" style={styles.menuIcon} />
          <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8B896', // Sage green color
  },
  header: {
    paddingTop: 50,
    paddingLeft: 16,
    paddingBottom: 20,
  },
  closeButton: {
    paddingTop: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerContent: {
    paddingTop: 20,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 12,
    marginHorizontal: 24,
  },
  logoutText: {
    color: '#7c4803ff',
  },
});

export default CustomDrawerContent;
