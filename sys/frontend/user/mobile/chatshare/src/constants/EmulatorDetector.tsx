import { Platform } from 'react-native';
//import { API_URL_ANDROID, API_URL_ANDROID_EMULATOR, API_URL_IOS_SIMULATOR } from '@env';
import DeviceInfo from 'react-native-device-info';
import Config from 'react-native-config';

/**
 * Manual Emulator/Simulator Detection
 * No external libraries required - uses Platform API
 */
class EmulatorDetector {
  /**
   * Check if running on iOS Simulator
   * iOS simulators run on Mac's x86_64 or arm64 architecture
   */
  static isIOSSimulator() {
    if (Platform.OS !== 'ios') return false;

    // Prefer synchronous native check if available
    try {
      if (typeof (DeviceInfo as any).isEmulatorSync === 'function') {
        return (DeviceInfo as any).isEmulatorSync();
      }
    } catch (e) {
      // ignore and fallback to heuristic
    }

    // Fallback heuristic: try multiple possible keys and normalize case
    const constants: any = Platform.constants || {};
    const modelRaw =
      (constants.Model ?? constants.model ?? constants.machine ?? constants.modelName ?? '') + '';
    const model = modelRaw.toLowerCase();

    // Include arm64 because Apple Silicon simulators can expose arm identifiers
    return /simulator|x86|i386|x86_64|arm64/.test(model);
  }
  /**
   * Check if running on Android Emulator
   * Android emulators have specific brand/model signatures
   */
  static isAndroidEmulator() {
    if (Platform.OS !== 'android') return false;
    
    const constants: any = Platform.constants || {};
    const Brand = constants.Brand ?? constants.brand ?? '';
    const Model = constants.Model ?? constants.model ?? '';
    const Manufacturer = constants.Manufacturer ?? constants.manufacturer ?? '';

    // Common Android emulator signatures
     const emulatorIndicators = {
       brands: ['generic', 'google', 'android'],
       models: [
         'sdk',
         'emulator',
         'android sdk built for x86',
         'sdk_gphone',
         'google_sdk',
         'droid4x',
         'genymotion',
         'adt',
       ],
       manufacturers: ['genymotion', 'google', 'generic'],
     };
     
    const brandLower = (Brand || '').toLowerCase();
    const modelLower = (Model || '').toLowerCase();
    const manufacturerLower = (Manufacturer || '').toLowerCase();
     
     // Check if any emulator indicator matches
     const isBrandMatch = emulatorIndicators.brands.some(brand =>
       brandLower.includes(brand)
     );
     
     const isModelMatch = emulatorIndicators.models.some(model =>
       modelLower.includes(model)
     );
     
     const isManufacturerMatch = emulatorIndicators.manufacturers.some(manufacturer =>
       manufacturerLower.includes(manufacturer)
     );
     
     return isBrandMatch || isModelMatch || isManufacturerMatch;
   }

  /**
   * Check if running on any emulator/simulator
   */
  static isEmulator() {
    return this.isIOSSimulator() || this.isAndroidEmulator();
  }

  /**
   * Get device type as string
   */
  static getDeviceType() {
    if (this.isIOSSimulator()) return 'iOS Simulator';
    if (this.isAndroidEmulator()) return 'Android Emulator';
    return 'Real Device';
  }

  /**
   * Get comprehensive device information
   */
  static getDeviceInfo() {
    const isEmulator = this.isEmulator();
    
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isEmulator,
      deviceType: this.getDeviceType(),
      isIOSSimulator: this.isIOSSimulator(),
      isAndroidEmulator: this.isAndroidEmulator(),
      isDevelopment: __DEV__,
      constants: {
        ...Platform.constants,
      },
    };
  }

  /**
   * Check if running on real device
   */
  static isRealDevice() {
    return !this.isEmulator();
  }

  /**
   * Get appropriate API URL based on device type
   */
  static getAPIUrl(config: {
    androidEmulatorUrl?: string;
    iosSimulatorUrl?: string;
    realDeviceUrl?: string;
    productionUrl?: string;
  } = {}) {
    const {
      androidEmulatorUrl = Config.API_URL_ANDROID_EMULATOR,
      iosSimulatorUrl = Config.API_URL_IOS_SIMULATOR,
      // Prefer explicit platform URL, fall back to general API_BASE_URL
      realDeviceUrl = Config.API_URL_ANDROID || Config.API_URL_IOS || Config.API_BASE_URL,
      // Use configured API_BASE_URL for production by default
      productionUrl = Config.API_BASE_URL || 'https://api.production.com',
    } = config;

    if (!__DEV__) {
      return productionUrl;
    }

    if (this.isAndroidEmulator()) {
      return androidEmulatorUrl;
    }

    if (this.isIOSSimulator()) {
      return iosSimulatorUrl;
    }

    // Real device in development mode
    return realDeviceUrl;
  }

  /**
   * Log device information to console
   */
  static logDeviceInfo() {
    const info = this.getDeviceInfo();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 DEVICE INFORMATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Platform: ${info.platform}`);
    console.log(`Version: ${info.version}`);
    console.log(`Device Type: ${info.deviceType}`);
    console.log(`Is Emulator: ${info.isEmulator ? 'YES' : 'NO'}`);
    console.log(`Development Mode: ${info.isDevelopment ? 'YES' : 'NO'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (Platform.OS === 'android') {
      const constants: any = Platform.constants || {};
      console.log(`Brand: ${constants.Brand ?? constants.brand ?? ''}`);
      console.log(`Model: ${constants.Model ?? constants.model ?? ''}`);
      console.log(`Manufacturer: ${constants.Manufacturer ?? constants.manufacturer ?? ''}`);
    }
     
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

export default EmulatorDetector;