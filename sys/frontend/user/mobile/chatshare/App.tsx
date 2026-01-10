/**
 * ChatShare App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import EmulatorDetector from './src/constants/EmulatorDetector';
import BootSplash from 'react-native-bootsplash';

function App() {

  // Get device type
  const deviceType = EmulatorDetector.getDeviceType();
  console.log('Device type:', deviceType);
  EmulatorDetector.logDeviceInfo();

  useEffect(() => {
    // Hide splash screen after app loads
    BootSplash.hide({fade: true});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
