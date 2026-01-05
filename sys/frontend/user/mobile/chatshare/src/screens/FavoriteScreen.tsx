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
import { fetchFavoriteChats, Chat, removeFavorite } from '../services/chatService';
import EditChatModal from '../components/EditChatModal';

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

const FavoriteScreen = ({ navigation }: Props) => {
  const { isAuthenticatedUser, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (isAuthenticatedUser) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [isAuthenticatedUser]);

  const loadFavorites = async () => {
    try {
      console.log('Fetching favorite chats...');
      const data = await fetchFavoriteChats(1, 20);
      console.log('Favorites loaded:', data?.length || 0);
      setChats(data || []);
    } catch (err: any) {
      console.error('Error loading favorites:', err);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (chat: Chat) => {
    try {
      await removeFavorite(chat.id);
      setChats(prevChats => prevChats.filter(c => c.id !== chat.id));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove favorite');
    }
  };

  const handleChatPress = (chat: Chat) => {
    const url = chat.public_link || chat.url;
    if (!url) {
      Alert.alert('Error', 'This chat does not have a URL');
      return;
    }
    navigation.navigate('ShareDetail', { url });
  };

  const handleEditChat = (chat: Chat) => {
    setSelectedChat(chat);
    setEditModalVisible(true);
  };

  const handleChatUpdate = (updatedChat: Chat) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === updatedChat.id) {
          // Merge updated chat with original, preserving critical fields
          return {
            ...chat,
            ...updatedChat,
            // Preserve these fields from original if not in update
            is_public: updatedChat.is_public !== undefined ? updatedChat.is_public : chat.is_public,
            is_favorited: updatedChat.is_favorited !== undefined ? updatedChat.is_favorited : chat.is_favorited,
            user: updatedChat.user || chat.user,
            category: updatedChat.category || chat.category,
            user_name: updatedChat.user?.name || chat.user?.name || chat.user_name,
            user_avatar: updatedChat.user?.avatar || chat.user?.avatar || chat.user_avatar,
            category_name: updatedChat.category?.name || chat.category?.name || chat.category_name,
          };
        }
        return chat;
      })
    );
  };

  const handleChatDelete = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
  };

  const isOwnChat = (chat: Chat): boolean => {
    return user?.id === chat.user_id || user?.id === chat.user?.id;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getChatTypeTag = (chat: Chat): string => {
    const chatType = chat.chat_type;
    if (chatType === 'claude') return 'Claude';
    if (chatType === 'copilot') return 'Copilot';
    if (chatType === 'chatgpt') return 'ChatGPT';
    return 'ChatGPT';
  };

  const getChatTypeColor = (chat: Chat): string => {
    const chatType = chat.chat_type;
    if (chatType === 'claude') return '#CC9B7A';
    if (chatType === 'copilot') return '#8E75E8';
    if (chatType === 'chatgpt') return '#10A37F';
    return '#10A37F';
  };

  const renderChatItem = (item: Chat) => (
    <TouchableOpacity
      key={item.id}
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}>
      <View style={styles.chatHeader}>
        <View style={styles.tagContainer}>
          <View style={[styles.tag, { backgroundColor: getChatTypeColor(item) }]}>
            <Text style={styles.tagText}>{getChatTypeTag(item)}</Text>
          </View>
          {(item.category?.name || item.category_name) && (
            <View style={styles.category}>
              <Text style={styles.categoryText}>
                {item.category?.name || item.category_name}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.chatActions}>
          {isOwnChat(item) && (
            <TouchableOpacity
              onPress={() => handleEditChat(item)}
              style={styles.editButton}>
              <Icon name="edit" size={20} color="#666" />
            </TouchableOpacity>
          )}
          <Icon name="launch" size={16} color="#666" />
        </View>
      </View>

      <Text style={styles.chatContent} numberOfLines={2}>
        {item.title || item.content}
      </Text>

      <View style={styles.chatFooter}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            {(item.user?.avatar || item.user_avatar) ? (
              <Image
                source={{ uri: item.user?.avatar || item.user_avatar }}
                style={styles.userAvatarImage}
              />
            ) : (
              <Icon name="account-circle" size={24} color="#666" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
            <Text style={styles.username}>
              {item.user?.name || item.user_name || 'Anonymous'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.likeContainer}
          onPress={() => handleRemoveFavorite(item)}>
          <Icon name="favorite" size={20} color="#E74C3C" />
          <Text style={styles.likeCount}>
            {item.favorite_count || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={28} color="#333" />
        </TouchableOpacity>

        {/* Profile Avatar or Notification Icon */}
        {isAuthenticatedUser ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Account')}>
              {user?.avatar && user.avatar !== '' ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.profileAvatar}
                />
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#A8B896']}
              tintColor="#A8B896"
            />
          }>
          {chats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="favorite-border" size={64} color="#999" />
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptySubText}>
                Tap the heart icon on any chat to add it to favorites
              </Text>
            </View>
          ) : (
            chats.map(renderChatItem)
          )}
        </ScrollView>
      )}

      <EditChatModal
        visible={editModalVisible}
        chat={selectedChat}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedChat(null);
        }}
        onUpdate={handleChatUpdate}
        onDelete={handleChatDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8B896',
  },
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
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#A8B896',
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  lineIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00B900',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  chatItem: {
    backgroundColor: '#F5F5DC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  category: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  chatContent: {
    fontSize: 15,
    color: '#333',
    marginBottom: 16,
    lineHeight: 22,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userDetails: {
    flexDirection: 'column',
  },
  timestamp: {
    fontSize: 11,
    color: '#555',
  },
  username: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  likeCount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FavoriteScreen;
