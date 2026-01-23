import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../contexts/AuthContext';
import { fetchFavoriteUsers, removeFavoriteUser } from '../services/favoriteUsersService';

type DrawerParamList = {
  Timeline: undefined;
  Favorite: undefined;
  Account: undefined;
};

type StackParamList = {
  Timeline: undefined;
  Favorite: undefined;
  ShareDetail: { url: string };
};

type Props = {
  navigation: CompositeNavigationProp<
    DrawerNavigationProp<DrawerParamList>,
    StackNavigationProp<StackParamList>
  >;
};

const FavoriteUsersScreen = ({ navigation }: Props) => {
  const { isAuthenticatedUser, user, logout } = useAuth();
  const [users, setUsers] = useState<{
    id: string;
    name?: string;
    avatar?: string;
    provider?: string;
    favorited_count?: number;
    repChatId: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticatedUser) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [isAuthenticatedUser]);

  const loadFavorites = async () => {
    try {
      const data = await fetchFavoriteUsers(1, 100);
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error loading favorite users:', err);
      if (err.status === 401) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              navigation.navigate('Timeline');
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to load favorite users');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavoriteUser = async (userId: string) => {
    try {
      await removeFavoriteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      if (error.status === 401) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              navigation.navigate('Timeline');
            },
          },
        ]);
      } else {
        Alert.alert('Error', error.message || 'Failed to remove favorite user');
      }
    }
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate('Account');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={28} color="#333" />
        </TouchableOpacity>

        {isAuthenticatedUser ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Account')}>
              {user?.avatar && user.avatar !== '' ? (
                <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  {user?.provider === 'google' ? (
                    <View style={styles.googleIconContainer}>
                      <FontAwesome name="google" size={24} color="#4285F4" />
                    </View>
                  ) : user?.provider === 'line' ? (
                    <View style={styles.lineIconContainer}>
                      <FontAwesome name="comment" size={24} color="#00B900" />
                    </View>
                  ) : (
                    <Icon name="account-circle" size={36} color="#A8B896" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <></>
        )}
      </View>

      {!isAuthenticatedUser ? (
        <View style={styles.emptyContainer}>
          <Icon name="favorite-border" size={64} color="#999" />
          <Text style={styles.emptyText}>Please login to view favorites</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8B896" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#A8B896"]} tintColor="#A8B896" />
          }>
          {users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="favorite-border" size={64} color="#999" />
              <Text style={styles.emptyText}>No favorite users yet</Text>
              <Text style={styles.emptySubText}>Tap the heart icon on a user's chat to add them to your favorites</Text>
            </View>
          ) : (
            users.map(u => (
              <TouchableOpacity key={u.id} style={styles.chatItem} onPress={() => {}}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.userAvatar}>
                      {u.avatar ? <Image source={{ uri: u.avatar }} style={styles.userAvatarImage} /> : <Icon name="account-circle" size={32} color="#666" />}
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.username}>{u.name || 'Anonymous'}</Text>
                      <Text style={styles.timestamp}>{(u.favorited_count || 0) + ' favorited'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.likeContainer} onPress={() => handleRemoveFavoriteUser(u.id)} accessibilityLabel="Remove favorite">
                    <Icon name="delete" size={20} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#A8B896' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ? StatusBar.currentHeight : 6),
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#A8B896',
    backgroundColor: '#F5F5DC',
  },
  menuButton: { padding: 8 },
  profileButton: { padding: 4 },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#A8B896' },
  profileAvatarPlaceholder: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  googleIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#4285F4' },
  lineIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00B900' },
  scrollContent: { flex: 1, padding: 16 },
  chatItem: { backgroundColor: '#F5F5DC', borderRadius: 12, padding: 16, marginBottom: 16 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  userAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  userDetails: { flexDirection: 'column' },
  timestamp: { fontSize: 11, color: '#555' },
  username: { fontSize: 12, color: '#333', fontWeight: '500' },
  likeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#666', textAlign: 'center' },
  emptySubText: { marginTop: 8, fontSize: 14, color: '#999', textAlign: 'center' },
});

export default FavoriteUsersScreen;
