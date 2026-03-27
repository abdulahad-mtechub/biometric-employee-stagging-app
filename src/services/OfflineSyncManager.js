/**
 * OfflineSyncManager.js
 *
 * Global component that monitors network connectivity and automatically
 * syncs pending leave requests, expense requests, and document uploads when device comes online.
 *
 * Usage: Add <OfflineSyncManager /> to your App.js or root component
 */

import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  syncPendingRequests,
  getPendingRequestsCount,
} from './OfflineLeaveRequestQueue';
import {
  syncPendingExpenseRequests,
  getPendingExpenseRequestsCount,
} from './OfflineExpenseRequestQueue';
import {
  syncPendingDocuments,
  getPendingDocumentsCount,
} from './OfflineDocumentQueue';

const OfflineSyncManager = () => {
  const isOnlineRef = useRef(true);
  const appStateRef = useRef(AppState.currentState);

  // ============ PERFORM SYNC (Status shown via SyncStatusBar) ============
  const performSync = async () => {
    try {
      // Check for pending leave requests
      const pendingLeaveCount = await getPendingRequestsCount();
      // Check for pending expense requests
      const pendingExpenseCount = await getPendingExpenseRequestsCount();
      // Check for pending documents
      const pendingDocumentsCount = await getPendingDocumentsCount();

      if (
        pendingLeaveCount === 0 &&
        pendingExpenseCount === 0 &&
        pendingDocumentsCount === 0
      ) {
        console.log('ℹ️ No pending data to sync');
        return;
      }

      // Sync leave requests
      if (pendingLeaveCount > 0) {
        console.log(
          `📶 Syncing ${pendingLeaveCount} pending leave request(s)...`,
        );
        await syncPendingRequests();
      }

      // Sync expense requests
      if (pendingExpenseCount > 0) {
        console.log(
          `📶 Syncing ${pendingExpenseCount} pending expense request(s)...`,
        );
        await syncPendingExpenseRequests();
      }

      // Sync documents
      if (pendingDocumentsCount > 0) {
        console.log(
          `📶 Syncing ${pendingDocumentsCount} pending document(s)...`,
        );
        await syncPendingDocuments();
      }
    } catch (error) {
      console.error('❌ Error during auto-sync:', error);
    }
  };
  // =======================================================================

  useEffect(() => {
    // ============ NETWORK CONNECTIVITY LISTENER ============
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOffline = !isOnlineRef.current;
      const isNowOnline = state.isConnected && state.isInternetReachable;

      isOnlineRef.current = isNowOnline;

      // If device just came online (transition from offline to online)
      if (wasOffline && isNowOnline) {
        console.log('📶 Network restored - checking for pending requests...');
        performSync();
      }
    });

    // Initial network check
    NetInfo.fetch().then(state => {
      isOnlineRef.current = state.isConnected && state.isInternetReachable;
    });

    // ============ APP STATE LISTENER ============
    // Sync when app comes to foreground (in case requests were added while app was in background)
    const appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active' &&
          isOnlineRef.current
        ) {
          console.log(
            '📱 App came to foreground - checking for pending requests...',
          );
          performSync();
        }
        appStateRef.current = nextAppState;
      },
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeNetInfo();
      appStateSubscription?.remove();
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default OfflineSyncManager;
