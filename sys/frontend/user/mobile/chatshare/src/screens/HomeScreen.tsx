import React from 'react';
import {
  View,
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
  Home: undefined;
  Detail: undefined;
};

type StackParamList = {
  Home: undefined;
  Detail: undefined;
};

type Props = {
  navigation: CompositeNavigationProp<
    DrawerNavigationProp<DrawerParamList>,
    StackNavigationProp<StackParamList>
  >;
};

const HomeScreen = ({ navigation }: Props) => {
  //const [selectedTab, setSelectedTab] = useState('home');
  const { user, isLoggedIn } = useAuth();

  const navigateToDetail = () => {
    navigation.navigate('Detail');
  };

  // Debug logging
  React.useEffect(() => {
    console.log('========== HomeScreen Auth Debug ==========');
    console.log('isLoggedIn:', isLoggedIn);
    console.log('user:', JSON.stringify(user, null, 2));
    console.log('user.avatar:', user?.avatar);
    console.log('user.avatar length:', user?.avatar?.length);
    console.log('user.provider:', user?.provider);
    console.log('Condition check:');
    console.log('  - Has avatar:', user?.avatar && user.avatar !== '');
    console.log('  - Is google:', user?.provider === 'google');
    console.log('  - Is line:', user?.provider === 'line');
    console.log('==========================================');
  }, [user, isLoggedIn]);

  const renderContent = () => {
    // if (selectedTab === 'home') {
    //   return null; // Empty for home
    // }

    // Render green content items for other tabs
    return (
      <ScrollView style={styles.scrollContent}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.contentItem}
            onPress={navigateToDetail}>
            <View style={styles.contentItemInner} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

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

      {/* Main Content Area */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Action Bar */}
      {/* <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setSelectedTab('home')}>
          <Icon 
            name="home" 
            size={28} 
            color={selectedTab === 'home' ? '#000' : '#333'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setSelectedTab('search')}>
          <Icon 
            name="search" 
            size={28} 
            color={selectedTab === 'search' ? '#000' : '#333'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setSelectedTab('share')}>
          <Icon 
            name="share" 
            size={28} 
            color={selectedTab === 'share' ? '#000' : '#333'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setSelectedTab('favorite')}>
          <Icon 
            name="favorite-border" 
            size={28} 
            color={selectedTab === 'favorite' ? '#000' : '#333'} 
          />
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Cream/beige color
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ? StatusBar.currentHeight : 6),
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#A8B896', // Sage green border
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
  googleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4285F4',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5DC',
  },
  lineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00B900',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5DC',
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
  content: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  contentItem: {
    backgroundColor: '#A8B896', // Sage green
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    minHeight: 150,
  },
  contentItemInner: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 2,
    borderTopColor: '#A8B896', // Sage green border
    backgroundColor: '#F5F5DC',
  },
  actionButton: {
    padding: 8,
  },
});

export default HomeScreen;
