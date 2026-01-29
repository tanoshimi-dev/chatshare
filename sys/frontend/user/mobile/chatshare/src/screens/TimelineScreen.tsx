import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicChats, fetchChatById, SearchFilters, Chat, addFavoriteUser, removeFavoriteUser, addGood, removeGood } from '../services/chatService';
import EditChatModal from '../components/EditChatModal';
import ReportModal from '../components/ReportModal';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getDefaultSearch } from '../services/searchService';
import { blockUser } from '../services/blockService';

type DrawerParamList = {
  Timeline: { searchFilters?: SearchFilters } | undefined;
  Detail: undefined;
  Account: undefined;
  SearchSettings: undefined;
};

type StackParamList = {
  Timeline: { searchFilters?: SearchFilters } | undefined;
  Detail: undefined;
  ShareDetail: { url: string };
};

type TimelineRouteProp = RouteProp<DrawerParamList, 'Timeline'>;

type Props = {
  navigation: CompositeNavigationProp<
    DrawerNavigationProp<DrawerParamList>,
    StackNavigationProp<StackParamList>
  >;
};

const TimelineScreen = ({ navigation }: Props) => {
  const route = useRoute<TimelineRouteProp>();
  const { user, isAuthenticatedUser, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false so loadChats can run
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportChat, setReportChat] = useState<Chat | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(route.params?.searchFilters || null);
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef<SearchFilters | null>(null);
  const defaultSearchLoaded = useRef(false);
  const prevAuthState = useRef(isAuthenticatedUser);
  const initialLoadDone = useRef(false);

  // Handle auth state changes (login/logout)
  useEffect(() => {
    // User just logged in (auth changed from false to true)
    if (!prevAuthState.current && isAuthenticatedUser) {
      console.log('User logged in - loading default search settings');
      initialLoadDone.current = false;
      loadDefaultSearchAfterLogin();
    }
    // User just logged out (auth changed from true to false)
    else if (prevAuthState.current && !isAuthenticatedUser) {
      console.log('User logged out - clearing search filters');
      setSearchFilters(null);
      prevFiltersRef.current = null;
      defaultSearchLoaded.current = false;
      initialLoadDone.current = false;
      setPage(1);
      setHasMore(true);
      loadChats(1, false, null);
    }
    prevAuthState.current = isAuthenticatedUser;
  }, [isAuthenticatedUser]);

  const loadDefaultSearchAfterLogin = async () => {
    try {
      const defaultSearch = await getDefaultSearch();
      if (defaultSearch) {
        console.log('Loaded default search settings after login:', defaultSearch);
        const filters: SearchFilters = {
          categoryId: defaultSearch.category_id || undefined,
          chatType: defaultSearch.chat_type || undefined,
          dateFrom: defaultSearch.date_from || undefined,
          dateTo: defaultSearch.date_to || undefined,
          sortBy: defaultSearch.sort_by || 'created_at',
          sortOrder: defaultSearch.sort_order || 'desc',
        };
        setSearchFilters(filters);
        prevFiltersRef.current = filters;
        defaultSearchLoaded.current = true;
        setPage(1);
        setHasMore(true);
        loadChats(1, false, filters);
        initialLoadDone.current = true;
      } else {
        console.log('No default search found after login - loading all chats');
        setSearchFilters(null);
        prevFiltersRef.current = null;
        defaultSearchLoaded.current = true;
        setPage(1);
        setHasMore(true);
        loadChats(1, false, null);
        initialLoadDone.current = true;
      }
    } catch (err) {
      console.log('Error loading default search after login:', err);
      setSearchFilters(null);
      prevFiltersRef.current = null;
      defaultSearchLoaded.current = true;
      setPage(1);
      setHasMore(true);
      loadChats(1, false, null);
      initialLoadDone.current = true;
    }
  };

  // Load default search settings on mount
  useEffect(() => {
    const loadDefaultSearch = async () => {
      if (defaultSearchLoaded.current || initialLoadDone.current) return;
      
      // Only load default search if user is authenticated
      if (!isAuthenticatedUser) {
        defaultSearchLoaded.current = true;
        // Load chats without filters for non-authenticated users
        if (isInitialMount.current) {
          isInitialMount.current = false;
          loadChats(1, false, null);
          initialLoadDone.current = true;
        }
        return;
      }
      
      try {
        const defaultSearch = await getDefaultSearch();
        if (defaultSearch) {
          console.log('Loaded default search settings on mount:', defaultSearch);
          const filters: SearchFilters = {
            categoryId: defaultSearch.category_id || undefined,
            chatType: defaultSearch.chat_type || undefined,
            dateFrom: defaultSearch.date_from || undefined,
            dateTo: defaultSearch.date_to || undefined,
            sortBy: defaultSearch.sort_by || 'created_at',
            sortOrder: defaultSearch.sort_order || 'desc',
          };
          setSearchFilters(filters);
          prevFiltersRef.current = filters;
          defaultSearchLoaded.current = true;
          
          // Load chats with the default filters
          if (isInitialMount.current) {
            isInitialMount.current = false;
            console.log('Loading initial chats with default filters:', filters);
            loadChats(1, false, filters);
            initialLoadDone.current = true;
          }
        } else {
          defaultSearchLoaded.current = true;
          // No default search - load all chats
          if (isInitialMount.current) {
            isInitialMount.current = false;
            console.log('Loading initial chats without filters');
            loadChats(1, false, null);
            initialLoadDone.current = true;
          }
        }
      } catch (err) {
        console.log('No default search settings or error loading:', err);
        defaultSearchLoaded.current = true;
        // Load all chats on error
        if (isInitialMount.current) {
          isInitialMount.current = false;
          console.log('Loading initial chats without filters (error)');
          loadChats(1, false, null);
          initialLoadDone.current = true;
        }
      }
    };

    loadDefaultSearch();
  }, [isAuthenticatedUser]);

  useEffect(() => {
    console.log('Route params changed:', route.params?.searchFilters);
    // Only reload when filters actually change, not on initial mount
    if (!isInitialMount.current && route.params?.searchFilters) {
      const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(route.params.searchFilters);
      console.log('Filters changed?', filtersChanged, 'prev:', prevFiltersRef.current, 'new:', route.params.searchFilters);
      if (filtersChanged) {
        prevFiltersRef.current = route.params.searchFilters;
        setSearchFilters(route.params.searchFilters);
        setPage(1);
        setHasMore(true);
        // Don't set loading here - let loadChats handle it
        console.log('Loading chats with new filters');
        loadChats(1, false, route.params.searchFilters);
      }
    }
  }, [route.params?.searchFilters]);

  const loadChats = async (pageNum: number = 1, append: boolean = false, filters?: SearchFilters | null) => {
    // Prevent concurrent requests
    if (loading || (append && loadingMore)) {
      console.log('Request already in progress, skipping...');
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const activeFilters = filters !== undefined ? filters : searchFilters;
      
      console.log('=== Loading chats ===');
      console.log('Page:', pageNum);
      console.log('Append:', append);
      console.log('Active filters:', JSON.stringify(activeFilters, null, 2));
      
      let data;
      // if (activeFilters && (activeFilters.categoryId || activeFilters.chatType || activeFilters.dateFrom || activeFilters.dateTo || activeFilters.userId)) {
      //   console.log(`Searching chats with filters (page ${pageNum}):`, activeFilters);
      //   data = await searchChatsAdvanced(activeFilters, pageNum, 10);
      //   console.log('Search results:', data?.length || 0, 'chats');
      // } else {
      //   console.log(`Fetching chats from API (page ${pageNum})...`);
      //   data = await fetchPublicChats(activeFilters ?? null, pageNum, 10);
      //   console.log('Fetch results:', data?.length || 0, 'chats');
      // }
      console.log(`Fetching chats from API (page ${pageNum})...`);
      data = await fetchPublicChats(activeFilters ?? null, pageNum, 10);
      console.log('Fetch results:', data?.length || 0, 'chats');

      console.log('Chats loaded successfully:', data?.length || 0);
      console.log('First chat:', data?.[0] ? data[0].title : 'No chats');
      console.log('===================');
      
      if (append) {
        setChats(prev => [...prev, ...(data || [])].filter(Boolean));
      } else {
        setChats((data || []).filter(Boolean));
      }
      
      // Check if there are more items to load
      if (!data || data.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err: any) {
      console.error('Error loading chats:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Set error message for user
      const errorMessage = err.message || 'Failed to load chats';
      setError(errorMessage);
      
      // Clear chats on error if not appending
      if (!append) {
        setChats([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadChats(1, false, searchFilters);
  };

  const clearSearchFilters = () => {
    prevFiltersRef.current = null;
    setSearchFilters(null);
    setPage(1);
    setHasMore(true);
    // Don't set loading here - let loadChats handle it
    loadChats(1, false, null);
  };

  const loadMoreChats = () => {
    if (!loadingMore && !loading && hasMore) {
      console.log('Loading more chats, current page:', page);
      const nextPage = page + 1;
      setPage(nextPage);
      loadChats(nextPage, true, searchFilters);
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getChatTypeTag = (chat: Chat): string => {
    const chatType = chat.chat_type;
    if (chatType === 'claude') return 'Claude';
    if (chatType === 'copilot') return 'Copilot';
    if (chatType === 'chatgpt') return 'ChatGPT';
    if (chatType === 'gemini') return 'Gemini';
    return 'Unknown'; // default
  };

  const getChatTypeColor = (chat: Chat): string => {
    const chatType = chat.chat_type;
    if (chatType === 'claude') return '#da9971';
    if (chatType === 'copilot') return '#3c9bc6';
    if (chatType === 'chatgpt') return '#161313';
    if (chatType === 'gemini') return '#6396ef';
    return '#b90000'; // default to ChatGPT green
  };

  const handleGoodToggle = async (chat: Chat) => {
    if (!isAuthenticatedUser) {
      Alert.alert('Login Required', 'Please login to good chats');
      return;
    }

    if (isOwnChat(chat)) {
      Alert.alert('Not Allowed', 'You cannot good your own chat');
      return;
    }

    try {
      const isGooded = chat.is_gooded;
      
      // Optimistic update - only toggle is_gooded, not good_count
      setChats(prevChats =>
        prevChats
          .map(c => (c && c.id === chat.id ? { ...c, is_gooded: !isGooded } : c))
          .filter(Boolean)
      );

      if (isGooded) {
        await removeGood(chat.id);
        // Update count locally after successful API call
        setChats(prev => prev.map(c => {
          if (c && c.id === chat.id) {
            return { ...c, good_count: Math.max(0, (c.good_count || 0) - 1) };
          }
          return c;
        }).filter(Boolean));
      } else {
        await addGood(chat.id);
        // Update count locally after successful API call
        setChats(prev => prev.map(c => {
          if (c && c.id === chat.id) {
            return { ...c, good_count: (c.good_count || 0) + 1 };
          }
          return c;
        }).filter(Boolean));
      }
    } catch (error: any) {
      // Revert on error (also sanitize)
      setChats(prevChats =>
        prevChats
          .map(c => (c && c.id === chat.id ? { ...c, is_gooded: chat.is_gooded } : c))
          .filter(Boolean)
      );
      
      // Handle 401 session expiration
      if (error.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                navigation.navigate('Timeline');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to update favorite');
      }
    }
  };

  const handleFavoriteUsersToggle = async (chat: Chat) => {
    if (!isAuthenticatedUser) {
      Alert.alert('Login Required', 'Please login to favorite chats');
      return;
    }

    if (isOwnChat(chat)) {
      Alert.alert('Not Allowed', 'You cannot favorite your own chat');
      return;
    }

    console.log('Favorite toggle - chat:', chat.id, 'current favorited:', chat.is_favorited);

    try {
      const isFavorited = chat.is_favorited;
      const targetUserId = chat.user_id || chat.user?.id;
      
      if (!targetUserId) {
        Alert.alert('Error', 'Cannot identify chat owner');
        return;
      }

      // Optimistic update - toggle is_favorited for ALL chats from this user
      setChats(prevChats =>
        prevChats
          .map(c => {
            if (c && (c.user_id === targetUserId || c.user?.id === targetUserId)) {
              return { ...c, is_favorited: !isFavorited };
            }
            return c;
          })
          .filter(Boolean)
      );

      if (isFavorited) {
        await removeFavoriteUser(chat.id);
        console.log('Removed favorite for chat:', chat.id);
        // Update user favorited_count locally for ALL chats from this user
        setChats(prev => prev.map(c => {
          if (c && (c.user_id === targetUserId || c.user?.id === targetUserId)) {
            const updatedChat = { ...c };
            if (updatedChat.user) {
              updatedChat.user = {
                ...updatedChat.user,
                favorited_count: Math.max(0, (updatedChat.user.favorited_count || 0) - 1)
              };
            }
            return updatedChat;
          }
          return c;
        }).filter(Boolean));
      } else {
        await addFavoriteUser(chat.id);
        console.log('Added favorite for chat:', chat.id);
        // Update user favorited_count locally for ALL chats from this user
        setChats(prev => prev.map(c => {
          if (c && (c.user_id === targetUserId || c.user?.id === targetUserId)) {
            const updatedChat = { ...c };
            if (updatedChat.user) {
              updatedChat.user = {
                ...updatedChat.user,
                favorited_count: (updatedChat.user.favorited_count || 0) + 1
              };
            }
            return updatedChat;
          }
          return c;
        }).filter(Boolean));
      }
    } catch (error: any) {
      // Revert on error (also sanitize) - revert ALL chats from this user
      const targetUserId = chat.user_id || chat.user?.id;
      setChats(prevChats =>
        prevChats
          .map(c => {
            if (c && targetUserId && (c.user_id === targetUserId || c.user?.id === targetUserId)) {
              return { ...c, is_favorited: chat.is_favorited };
            }
            return c;
          })
          .filter(Boolean)
      );
      
      // Handle 401 session expiration
      if (error.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                navigation.navigate('Timeline');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to update favorite');
      }
    }
  };


  const isOwnChat = (chat: Chat): boolean => {
    return user?.id === chat.user_id || user?.id === chat.user?.id;
  };

  const handleEditChat = (chat: Chat) => {
    setSelectedChat(chat);
    setEditModalVisible(true);
  };

  const handleChatUpdate = (updatedChat: Chat) => {
    setChats(prevChats =>
      prevChats
        .map(chat => {
          if (chat && chat.id === updatedChat.id) {
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
      .filter(Boolean)
    );
  };

  const handleChatDelete = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
  };

  const handleOpenMenu = (chatId: string) => {
    setMenuVisible(menuVisible === chatId ? null : chatId);
  };

  const handleReport = (chat: Chat) => {
    setMenuVisible(null);
    if (!isAuthenticatedUser) {
      Alert.alert('Login Required', 'Please login to report content');
      return;
    }
    if (isOwnChat(chat)) {
      Alert.alert('Not Allowed', 'You cannot report your own content');
      return;
    }
    setReportChat(chat);
    setReportModalVisible(true);
  };

  const handleBlockUser = async (chat: Chat) => {
    setMenuVisible(null);
    if (!isAuthenticatedUser) {
      Alert.alert('Login Required', 'Please login to block users');
      return;
    }
    if (isOwnChat(chat)) {
      Alert.alert('Not Allowed', 'You cannot block yourself');
      return;
    }

    const userName = chat.user?.name || chat.user_name || 'this user';
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName}? Their content will no longer appear in your feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const targetUserId = chat.user_id || chat.user?.id;
              if (!targetUserId) {
                Alert.alert('Error', 'Could not identify user');
                return;
              }
              await blockUser(targetUserId);
              // Remove all chats from the blocked user from the feed
              setChats(prevChats =>
                prevChats.filter(c => c.user_id !== targetUserId && c.user?.id !== targetUserId)
              );
              Alert.alert('User Blocked', `${userName} has been blocked. You can unblock them in Settings > Blocked Users.`);
            } catch (error: any) {
              if (error.status === 401) {
                Alert.alert(
                  'Session Expired',
                  'Your session has expired. Please login again.',
                  [{ text: 'OK', onPress: () => logout() }]
                );
              } else {
                Alert.alert('Error', error.message || 'Failed to block user');
              }
            }
          },
        },
      ]
    );
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
          {item.tags && item.tags.length > 0 && item.tags[0] && (
            <View style={styles.category}>
              <Text style={styles.categoryText}>{item.tags[0]}</Text>
            </View>
          )}
        </View>
        <View style={styles.chatHeaderActions}>
          {isOwnChat(item) ? (
            <TouchableOpacity
              onPress={() => handleEditChat(item)}
              style={styles.editButton}>
              <Icon name="edit" size={18} color="#666" />
            </TouchableOpacity>
          ) : (
            <View style={styles.menuContainer}>
              <TouchableOpacity
                onPress={() => handleOpenMenu(item.id)}
                style={styles.menuButton}>
                <Icon name="more-vert" size={20} color="#666" />
              </TouchableOpacity>
              {menuVisible === item.id && (
                <View style={styles.menuDropdown}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleReport(item)}>
                    <Icon name="flag" size={18} color="#666" />
                    <Text style={styles.menuItemText}>Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleBlockUser(item)}>
                    <Icon name="block" size={18} color="#D9534F" />
                    <Text style={[styles.menuItemText, styles.menuItemDanger]}>Block User</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.likeContainer}
              onPress={() => handleFavoriteUsersToggle(item)}>
              <Icon
                name={item.is_favorited ? 'favorite' : 'favorite-border'}
                size={20}
                color={item.is_favorited ? '#f67d70' : '#666'}
              />
              <Text style={styles.likeCount}>
                {item.user?.favorited_count || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.likeContainer}
            onPress={() => handleGoodToggle(item)}>
            <Icon
              name={item.is_gooded ? 'thumb-up' : 'thumb-up-off-alt'}
              size={20}
              color={item.is_gooded ? '#f5c528' : '#666'}
            />
            <Text style={styles.likeCount}>
              {item.good_count || 0}
            </Text>
          </TouchableOpacity>
        </View>
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
            {/* <TouchableOpacity style={styles.notificationButton}>
              <Icon name="notifications-none" size={28} color="#333" />
            </TouchableOpacity> */}
          </View>
        ) : (
          <></>
          // <TouchableOpacity style={styles.notificationButton}>
          //   <Icon name="notifications-none" size={28} color="#333" />
          // </TouchableOpacity>
        )}
      </View>

      {/* Search Filters Indicator */}
      {searchFilters && (searchFilters.categoryId || searchFilters.chatType || searchFilters.dateFrom || searchFilters.dateTo) && (
        <View style={styles.filterBanner}>
          <View style={styles.filterBannerContent}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchSettings')}
              style={{ marginRight: 8 }}
            >
              <Icon name="filter-list" size={20} color="#7c4803ff" />
            </TouchableOpacity>
            <Text style={styles.filterBannerText}>
              Filters active
              {searchFilters.chatType && ` · ${searchFilters.chatType}`}
              {searchFilters.dateFrom && ` · From ${formatDate(searchFilters.dateFrom)}`}
            </Text>
          </View>
          <TouchableOpacity onPress={clearSearchFilters} style={styles.clearFilterButton}>
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Timeline Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8B896" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#999" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadChats()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={({ item, index }) => (item ? renderChatItem(item) : null)}
          keyExtractor={(item, index) => (item && item.id) ? item.id : `missing-${index}`}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#A8B896']}
              tintColor="#A8B896"
            />
          }
          onEndReached={loadMoreChats}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="chat-bubble-outline" size={64} color="#999" />
              <Text style={styles.emptyText}>No chats yet</Text>
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

      <ReportModal
        visible={reportModalVisible}
        onClose={() => {
          setReportModalVisible(false);
          setReportChat(null);
        }}
        contentType="chat"
        contentId={reportChat?.id || ''}
        onReportSuccess={() => {
          // Optionally refresh or show feedback
        }}
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
  filterBanner: {
    backgroundColor: '#f0f4e8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8d8',
  },
  filterBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  filterBannerText: {
    fontSize: 14,
    color: '#7c4803ff',
    fontWeight: '500',
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7c4803ff',
    borderRadius: 6,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
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
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    padding: 4,
  },
  menuDropdown: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 140,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  menuItemDanger: {
    color: '#D9534F',
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
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#A8B896',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#999',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default TimelineScreen;
