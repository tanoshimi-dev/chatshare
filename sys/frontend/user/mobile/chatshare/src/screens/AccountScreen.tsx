import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { deleteAccount } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';

type Props = {
  navigation: DrawerNavigationProp<any>;
};

const AccountScreen = ({ navigation }: Props) => {
  const [deleting, setDeleting] = useState(false);

  const { logout: contextLogout } = useAuth();

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (deleting) return;
            setDeleting(true);
            try {
              await deleteAccount();
              // Inform auth context to update app state
              try {
                await contextLogout();
              } catch (e) {
                // ignore
              }
              Alert.alert('Account deleted', 'Your account has been deleted and you have been signed out.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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
        <View style={styles.placeholder} />
      </View>
      <View style={styles.content}>
        <Text style={styles.contentText}>Account Screen</Text>
        <TouchableOpacity
          style={[styles.deleteButton, deleting ? styles.deleteButtonDisabled : null]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    paddingTop: 50,
    paddingLeft: 16,
    paddingBottom: 20,
    // height: 60,
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // alignItems: 'center',
    // paddingHorizontal: 15,
    // backgroundColor: '#F5F5DC',
  },
  menuButton: {
    padding: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },  
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 38,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 16,
    color: '#666',
  },
  deleteButton: {
    marginTop: 20,
    backgroundColor: '#FF4D4F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
});

export default AccountScreen;
