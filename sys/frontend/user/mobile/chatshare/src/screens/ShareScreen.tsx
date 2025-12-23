import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

type DrawerParamList = {
  Home: undefined;
  Detail: undefined;
};

type RootStackParamList = {
  Main: undefined;
  Detail: undefined;
  ShareDetail: { url: string };
};

type Props = {
  navigation: CompositeNavigationProp<
    DrawerNavigationProp<DrawerParamList>,
    StackNavigationProp<RootStackParamList>
  >;
};


const ShareScreen = ({ navigation }: Props) => {
  const handleOpenShareLink = (provider: 'claude' | 'chatgpt' | 'copilot') => {
    let url = '';
    
    switch (provider) {
      case 'claude':
        url = 'https://claude.ai/share/a4c020d8-66a5-4f66-a655-b9e25244d78c';
        break;
      case 'chatgpt':
        url = 'https://chatgpt.com/share/69466abd-6f9c-8008-b502-18bf3afcd716';
        break;
      case 'copilot':
        url = 'https://copilot.microsoft.com/shares/1PavwW8cBhKsH9wEzCb4E';
        break;
    }
    
    navigation.navigate('ShareDetail', { url });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
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
      <View style={styles.content}>
        <Text style={styles.contentText}>Share Screen</Text>
        
        <TouchableOpacity
          style={[styles.openButton, styles.claudeButton]}
          onPress={() => handleOpenShareLink('claude')}>
          <Icon name="open-in-new" size={24} color="#FFFFFF" />
          <Text style={styles.openButtonText}>Open Claude Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.openButton, styles.chatgptButton]}
          onPress={() => handleOpenShareLink('chatgpt')}>
          <Icon name="open-in-new" size={24} color="#FFFFFF" />
          <Text style={styles.openButtonText}>Open ChatGPT Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.openButton, styles.copilotButton]}
          onPress={() => handleOpenShareLink('copilot')}>
          <Icon name="open-in-new" size={24} color="#FFFFFF" />
          <Text style={styles.openButtonText}>Open Copilot Share</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 6,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#A8B896', // Sage green border
    backgroundColor: '#F5F5DC',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A8B896',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginVertical: 8,
  },
  claudeButton: {
    backgroundColor: '#CC9B7A',
  },
  chatgptButton: {
    backgroundColor: '#10A37F',
  },
  copilotButton: {
    backgroundColor: '#8E75E8',
  },
  openButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ShareScreen;
