import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../contexts/AuthContext';

type DrawerParamList = {
  Timeline: undefined;
  Detail: undefined;
};

type StackParamList = {
  Timeline: undefined;
  Detail: undefined;
};

type Props = {
  navigation: CompositeNavigationProp<
    DrawerNavigationProp<DrawerParamList>,
    StackNavigationProp<StackParamList>
  >;
};

interface ChatItem {
  id: string;
  tag: string;
  category: string;
  content: string;
  username: string;
  timestamp: string;
  likes: number;
  userAvatar?: string;
}

const TimelineScreen = ({ navigation }: Props) => {
  const { user, isLoggedIn } = useAuth();

  // Mock data - replace with actual API call
  const chatItems: ChatItem[] = [
    {
      id: '1',
      tag: 'ClaudeCode',
      category: '開発',
      content: 'Goの特徴、ポインターレシーバーなど',
      username: 'mitakik25',
      timestamp: '2026-01-01 11:11',
      likes: 122,
    },
    {
      id: '2',
      tag: 'ClaudeCode',
      category: '開発',
      content: 'React Nativeでの認証フロー実装',
      username: 'mitakik25',
      timestamp: '2026-01-01 10:30',
      likes: 98,
    },
    {
      id: '3',
      tag: 'ClaudeCode',
      category: '開発',
      content: 'TypeScriptのジェネリクスについて',
      username: 'mitakik25',
      timestamp: '2026-01-01 09:15',
      likes: 156,
    },
    {
      id: '4',
      tag: 'ChatGPT',
      category: 'デザイン',
      content: 'モバイルUIのベストプラクティス',
      username: 'designer_user',
      timestamp: '2026-01-01 08:45',
      likes: 203,
    },
    {
      id: '5',
      tag: 'ClaudeCode',
      category: '開発',
      content: 'Docker Composeでの環境構築手順',
      username: 'mitakik25',
      timestamp: '2025-12-31 22:30',
      likes: 87,
    },
  ];

  const renderChatItem = (item: ChatItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.chatItem}
      onPress={() => navigation.navigate('Detail')}>
      <View style={styles.chatHeader}>
        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
          <View style={styles.category}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <Icon name="launch" size={16} color="#666" />
      </View>

      <Text style={styles.chatContent}>{item.content}</Text>

      <View style={styles.chatFooter}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Icon name="account-circle" size={24} color="#666" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
            <Text style={styles.username}>{item.username}</Text>
          </View>
        </View>

        <View style={styles.likeContainer}>
          <Icon name="favorite-border" size={18} color="#666" />
          <Text style={styles.likeCount}>{item.likes}</Text>
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
        {isLoggedIn ? (
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
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="notifications-none" size={28} color="#333" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="notifications-none" size={28} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {/* Timeline Content */}
      <ScrollView style={styles.scrollContent}>
        {chatItems.map(renderChatItem)}
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
    backgroundColor: '#A8B896',
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
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F4D03F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
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
  },
  likeCount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default TimelineScreen;
