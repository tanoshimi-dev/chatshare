import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

  const navigateToDetail = () => {
    navigation.navigate('Detail');
  };

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
        <TouchableOpacity style={styles.notificationButton}>
          <Icon name="notifications-none" size={28} color="#333" />
        </TouchableOpacity>
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
