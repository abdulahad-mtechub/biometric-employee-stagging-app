import React, { useEffect } from 'react';
import {
  AppState,
  LogBox,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getLocales } from 'react-native-localize';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { AlertProvider } from './src/Providers/AlertContext';
import i18n from './src/Translations/i18n';
import DynamicAlert from './src/components/DynamicAlert';
import Router from './src/navigations/router';
import {
  setCount,
  updateMultipleThreadCounts,
  clearAllCounts,
  setUnreadCounts,
} from './src/redux/Slices/MessageCountSlice';
import { setButtonColors, setTheme } from './src/redux/Slices/Theme';
import {
  logout,
  setLanguage,
  setLoggedIn,
  setProfileData,
  setRememberMe,
  setUserData,
} from './src/redux/Slices/authSlice';
import { clearAccounts, saveAccount } from './src/redux/Slices/rememberMeSlice';
import { Store } from './src/redux/Store/Store';
import OfflineSyncManager from './src/services/OfflineSyncManager';
import SyncStatusBarManager from './src/services/SyncStatusBarManager';
import LanguageInitializer from './src/utils/LanguageInitializer';
import Orientation from 'react-native-orientation-locker';
import { loadSlice, saveSlice, SLICE_KEYS } from './src/utils/reduxStorage';
import NotificationService from './src/utils/NotificationService';
import { useAlert } from './src/Providers/AlertContext';
import useGlobalUnreadCount from './src/hooks/useGlobalUnreadCount';

const MainRoot = () => {
  const { showAlert } = useAlert();
  if (__DEV__) {
    // console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    LogBox.ignoreAllLogs(true);
  }
  const { isDarkMode } = useSelector(store => store.theme);
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  const { user } = useSelector(store => store.auth);
  const token = user?.token;
  const [rehydrated, setRehydrated] = React.useState(false);

  useEffect(() => {
    Orientation.lockToPortrait();
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') Orientation.lockToPortrait();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    async function restoreReduxState() {
      try {
        const auth = await loadSlice(SLICE_KEYS.auth);
        if (auth) {
          if (auth.user) dispatch(setUserData(auth.user));
          if (typeof auth.isLoggedIn === 'boolean')
            dispatch(setLoggedIn(auth.isLoggedIn));
          if (typeof auth.rememberMe === 'boolean')
            dispatch(setRememberMe(auth.rememberMe));
          if (auth.profile) dispatch(setProfileData(auth.profile));
          if (auth.language) dispatch(setLanguage(auth.language));
        }
        const theme = await loadSlice(SLICE_KEYS.theme);
        if (theme) {
          if (typeof theme.isDarkMode === 'boolean')
            dispatch(setTheme(theme.isDarkMode));
          if (theme.buttonColors) dispatch(setButtonColors(theme.buttonColors));
        }
        const rememberMe = await loadSlice(SLICE_KEYS.rememberMe);
        if (rememberMe && Array.isArray(rememberMe.savedAccounts)) {
          dispatch(clearAccounts());
          rememberMe.savedAccounts.forEach(acc => dispatch(saveAccount(acc)));
        }

        // Load persisted message counts to show badge immediately
        console.log('📥 Loading persisted message counts...');
        const persistedMessageCount = await loadSlice(SLICE_KEYS.messageCount);
        console.log('📥 Persisted message count result:', persistedMessageCount);

        if (persistedMessageCount) {
          console.log('📥 Found persisted counts, restoring...');
          const { totalCount, totalUnreadCount, threadCounts, lastMessageTimestamps, superAdminCount, companyAdminCount } = persistedMessageCount;

          // Format threads array for setUnreadCounts
          const threads = threadCounts ? Object.entries(threadCounts).map(([threadId, count]) => ({
            threadId: parseInt(threadId),
            unreadCount: count,
            timestamp: lastMessageTimestamps?.[threadId] || new Date().toISOString()
          })) : [];

          console.log('📥 Dispatching setUnreadCounts...');
          dispatch(setUnreadCounts({
            total: totalUnreadCount || totalCount || 0,
            threads: threads,
            roleBased: {
              superadmin: superAdminCount || 0,
              company_admin: companyAdminCount || 0
            }
          }));

          console.log('🔄 Restored persisted counts:', {
            total: totalUnreadCount || totalCount,
            threadCount: threads.length,
            initialized: true
          });
        } else {
          // No persisted data, clear counts
          console.log('🧹 No persisted data, clearing counts...');
          dispatch(clearAllCounts());
        }
      } catch (e) {
        console.error('[Manual Redux Restore] Error:', e);
      }
      setRehydrated(true);
    }
    restoreReduxState();
  }, []);

  useEffect(() => {
    dispatch(setTheme(false));
    if (!token) {
      dispatch(logout());
    }

    const locales = getLocales();
    const deviceLang = locales[0]?.languageCode || 'en';
    if (deviceLang === 'es') {
      i18n.changeLanguage('es');
      dispatch(setLanguage('Español'));
    } else {
      i18n.changeLanguage('en');
      dispatch(setLanguage('English'));
    }
    // Set custom showAlert for NotificationService and initialize
    NotificationService.setShowAlertFunction(showAlert);
    NotificationService.initialize();
  }, [colorScheme]);

  // Initialize global unread count syncing (API + socket)
  useGlobalUnreadCount();

  // Force save message count when app goes to background
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background') {
        // Force save messageCount slice immediately when app goes to background
        const state = Store.getState();
        if (state.messageCount) {
          console.log('💾 Force saving messageCount on background...');
          saveSlice(SLICE_KEYS.messageCount, state.messageCount);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  if (!rehydrated) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}>
        <StatusBar barStyle={'dark-content'} />
        <DynamicAlert />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'light-content'} />
      <OfflineSyncManager />
      <SyncStatusBarManager />
      <Router />
      <DynamicAlert />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView>
      <Provider store={Store}>
        <AlertProvider>
          <LanguageInitializer />
          <MainRoot />
        </AlertProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
