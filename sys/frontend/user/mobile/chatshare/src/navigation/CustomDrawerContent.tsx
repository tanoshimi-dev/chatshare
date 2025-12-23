import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
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
});

export default CustomDrawerContent;
