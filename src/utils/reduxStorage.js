import AsyncStorage from '@react-native-async-storage/async-storage';

// Save a slice to AsyncStorage
export async function saveSlice(key, state) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(state));
    if (key === SLICE_KEYS.messageCount) {
      console.log('✅ Saved messageCount to AsyncStorage:', {
        totalCount: state.totalCount,
        totalUnreadCount: state.totalUnreadCount,
        threadCount: Object.keys(state.threadCounts || {}).length,
        initialized: state.initialized
      });
    }
  } catch (error) {
    console.error(`[reduxStorage] Failed to save ${key}:`, error);
  }
}

// Load a slice from AsyncStorage
export async function loadSlice(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value && key === SLICE_KEYS.messageCount) {
      const parsed = JSON.parse(value);
      console.log('📥 Loaded messageCount from AsyncStorage:', {
        totalCount: parsed.totalCount,
        totalUnreadCount: parsed.totalUnreadCount,
        threadCount: Object.keys(parsed.threadCounts || {}).length,
        initialized: parsed.initialized
      });
      return parsed;
    }
    return value ? JSON.parse(value) : undefined;
  } catch (error) {
    console.error(`[reduxStorage] Failed to load ${key}:`, error);
    return undefined;
  }
}

// Storage keys for slices
export const SLICE_KEYS = {
  auth: '@redux_auth',
  theme: '@redux_theme',
  rememberMe: '@redux_rememberMe',
  messageCount: '@redux_messageCount',
};
