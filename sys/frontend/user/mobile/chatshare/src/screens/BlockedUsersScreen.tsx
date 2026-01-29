import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { fetchBlockedUsers, unblockUser, BlockedUser } from '../services/blockService';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: DrawerNavigationProp<any>;
};

const BlockedUsersScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const data = await fetchBlockedUsers(pageNum, 20);

      if (append) {
        setBlockedUsers(prev => [...prev, ...data.items]);
      } else {
        setBlockedUsers(data.items);
      }

      setHasMore(pageNum < data.total_pages);
    } catch (error: any) {
      if (error.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK', onPress: () => logout() }]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to load blocked users');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [logout]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadBlockedUsers(1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadBlockedUsers(nextPage, true);
    }
  };

  const handleUnblock = (blockedUser: BlockedUser) => {
    const userName = blockedUser.blocked?.name || 'this user';
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}? They will be able to appear in your feed again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            try {
              setUnblockingId(blockedUser.blocked_id);
              await unblockUser(blockedUser.blocked_id);
              setBlockedUsers(prev => prev.filter(b => b.id !== blockedUser.id));
              Alert.alert('Success', `${userName} has been unblocked.`);
            } catch (error: any) {
              if (error.status === 401) {
                Alert.alert(
                  'Session Expired',
                  'Your session has expired. Please login again.',
                  [{ text: 'OK', onPress: () => logout() }]
                );
              } else {
                Alert.alert('Error', error.message || 'Failed to unblock user');
              }
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        {item.blocked?.avatar ? (
          <Image source={{ uri: item.blocked.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Icon name="account-circle" size={40} color="#999" />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.blocked?.name || 'Unknown User'}</Text>
          <Text style={styles.blockedDate}>Blocked on {formatDate(item.created_at)}</Text>
          {item.reason && (
            <Text style={styles.reason} numberOfLines={1}>
              Reason: {item.reason}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item)}
        disabled={unblockingId === item.blocked_id}
      >
        {unblockingId === item.blocked_id ? (
          <ActivityIndicator size="small" color="#A8B896" />
        ) : (
          <Text style={styles.unblockButtonText}>Unblock</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={32} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.placeholder} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8B896" />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#A8B896']}
              tintColor="#A8B896"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="block" size={64} color="#999" />
              <Text style={styles.emptyText}>No blocked users</Text>
              <Text style={styles.emptySubtext}>
                Users you block will appear here
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#A8B896" />
              </View>
            ) : null
          }
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  blockedDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  reason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A8B896',
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonText: {
    fontSize: 14,
    color: '#A8B896',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default BlockedUsersScreen;
