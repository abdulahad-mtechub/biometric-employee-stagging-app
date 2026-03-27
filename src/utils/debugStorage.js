import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug utility to check AsyncStorage contents
 * Call this function to see what's stored in AsyncStorage
 */
export const debugAsyncStorage = async () => {
  try {
    console.log('🔍 === AsyncStorage Debug ===');

    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 All keys in AsyncStorage:', keys);

    // Get all items
    const items = await AsyncStorage.multiGet(keys);
    console.log('📦 All items in AsyncStorage:', items);

    // Check specifically for auth-related keys
    const authKeys = ['jwt_token', 'localuserData', 'isLoggedIn', 'profile_token'];
    console.log('🔑 Checking auth-related keys:');

    for (const key of authKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(value);
          console.log(`  ✅ ${key}:`, parsed);
        } catch {
          // If not JSON, just show the value
          console.log(`  ✅ ${key}:`, value);
        }
      } else {
        console.log(`  ❌ ${key}: Not found`);
      }
    }

    console.log('🔍 === End AsyncStorage Debug ===');
  } catch (error) {
    console.error('❌ Error debugging AsyncStorage:', error);
  }
};

/**
 * Check if user is properly authenticated
 */
export const checkAuthStatus = async () => {
  try {
    console.log('🔐 === Authentication Status Check ===');

    const token = await AsyncStorage.getItem('jwt_token');
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    const userData = await AsyncStorage.getItem('localuserData');

    console.log('Token exists:', !!token);
    console.log('isLoggedIn flag:', isLoggedIn);
    console.log('UserData exists:', !!userData);

    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        console.log('User data:', parsed);
      } catch (error) {
        console.log('User data (raw):', userData);
      }
    }

    console.log('🔐 === End Authentication Status Check ===');

    return {
      hasToken: !!token,
      isLoggedIn: isLoggedIn === 'true',
      hasUserData: !!userData,
    };
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    return {
      hasToken: false,
      isLoggedIn: false,
      hasUserData: false,
      error: error.message,
    };
  }
};
