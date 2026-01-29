import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DrawerNavigationProp } from '@react-navigation/drawer';

type Props = {
  navigation: DrawerNavigationProp<any>;
};

const SettingsScreen = ({ navigation }: Props) => {
  const handleOpenTerms = () => {
    Linking.openURL('https://chatshare.dev/terms');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://chatshare.dev/privacy');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={32} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('BlockedUsers')}>
          <View style={styles.menuItemLeft}>
            <Icon name="block" size={24} color="#666" />
            <Text style={styles.menuItemText}>Blocked Users</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Legal</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleOpenTerms}>
          <View style={styles.menuItemLeft}>
            <Icon name="description" size={24} color="#666" />
            <Text style={styles.menuItemText}>Terms of Service</Text>
          </View>
          <Icon name="open-in-new" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleOpenPrivacy}>
          <View style={styles.menuItemLeft}>
            <Icon name="privacy-tip" size={24} color="#666" />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
          </View>
          <Icon name="open-in-new" size={20} color="#999" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Icon name="info" size={24} color="#666" />
            <Text style={styles.menuItemText}>Version</Text>
          </View>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5D0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginTop: 20,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
});

export default SettingsScreen;
