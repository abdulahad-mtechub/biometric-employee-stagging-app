/**
 * SyncStatusBarManager.js
 *
 * Global component that listens to sync events and displays SyncStatusBar
 * Shows syncing progress for offline leave requests, expense requests, and document uploads
 */

import React, {useEffect, useState} from 'react';
import {DeviceEventEmitter} from 'react-native';
import {useSelector} from 'react-redux';
import SyncStatusBar from '../components/SyncStatusBar';
import {
  SYNC_COMPLETED_EVENT,
  SYNC_STARTED_EVENT,
  SYNC_ERROR_EVENT,
} from './OfflineLeaveRequestQueue';
import {
  EXPENSE_SYNC_COMPLETED_EVENT,
  EXPENSE_SYNC_STARTED_EVENT,
  EXPENSE_SYNC_ERROR_EVENT,
} from './OfflineExpenseRequestQueue';
import {
  DOCUMENT_SYNC_COMPLETED_EVENT,
  DOCUMENT_SYNC_STARTED_EVENT,
  DOCUMENT_SYNC_ERROR_EVENT,
} from './OfflineDocumentQueue';

const SyncStatusBarManager = () => {
  const {isDarkMode} = useSelector(store => store.theme);
  const [syncStatus, setSyncStatus] = useState({
    status: 'idle', // 'idle', 'syncing', 'success', 'error'
    count: 0,
    successCount: 0,
    failedCount: 0,
  });

  useEffect(() => {
    // ============ LEAVE REQUEST SYNC LISTENERS ============
    const leaveStartListener = DeviceEventEmitter.addListener(
      SYNC_STARTED_EVENT,
      eventData => {
        console.log('🎯 Leave sync started event received:', eventData);
        setSyncStatus({
          status: 'syncing',
          count: eventData.count,
          successCount: 0,
          failedCount: 0,
        });
      },
    );

    const leaveCompletionListener = DeviceEventEmitter.addListener(
      SYNC_COMPLETED_EVENT,
      eventData => {
        console.log('🎯 Leave sync completed event received:', eventData);
        setSyncStatus({
          status: 'success',
          count: eventData.total,
          successCount: eventData.success,
          failedCount: eventData.failed,
        });

        setTimeout(() => {
          setSyncStatus({
            status: 'idle',
            count: 0,
            successCount: 0,
            failedCount: 0,
          });
        }, 5500);
      },
    );

    const leaveErrorListener = DeviceEventEmitter.addListener(
      SYNC_ERROR_EVENT,
      eventData => {
        console.log('🎯 Leave sync error event received:', eventData);
        setSyncStatus({
          status: 'error',
          count: 0,
          successCount: 0,
          failedCount: 0,
        });

        setTimeout(() => {
          setSyncStatus({
            status: 'idle',
            count: 0,
            successCount: 0,
            failedCount: 0,
          });
        }, 5500);
      },
    );

    // ============ EXPENSE REQUEST SYNC LISTENERS ============
    const expenseStartListener = DeviceEventEmitter.addListener(
      EXPENSE_SYNC_STARTED_EVENT,
      eventData => {
        console.log('🎯 Expense sync started event received:', eventData);
        setSyncStatus({
          status: 'syncing',
          count: eventData.count,
          successCount: 0,
          failedCount: 0,
        });
      },
    );

    const expenseCompletionListener = DeviceEventEmitter.addListener(
      EXPENSE_SYNC_COMPLETED_EVENT,
      eventData => {
        console.log('🎯 Expense sync completed event received:', eventData);
        setSyncStatus({
          status: 'success',
          count: eventData.total,
          successCount: eventData.success,
          failedCount: eventData.failed,
        });

        setTimeout(() => {
          setSyncStatus({
            status: 'idle',
            count: 0,
            successCount: 0,
            failedCount: 0,
          });
        }, 5500);
      },
    );

    const expenseErrorListener = DeviceEventEmitter.addListener(
      EXPENSE_SYNC_ERROR_EVENT,
      eventData => {
        console.log('🎯 Expense sync error event received:', eventData);
        setSyncStatus({
          status: 'error',
          count: 0,
          successCount: 0,
          failedCount: 0,
        });

        setTimeout(() => {
          setSyncStatus({
            status: 'idle',
            count: 0,
            successCount: 0,
            failedCount: 0,
          });
        }, 5500);
      },
    );

    // ============ DOCUMENT SYNC LISTENERS ============
    const documentStartListener = DeviceEventEmitter.addListener(
      DOCUMENT_SYNC_STARTED_EVENT,
      eventData => {
        console.log('🎯 Document sync started event received:', eventData);
        setSyncStatus({
          status: 'syncing',
          count: eventData.count,
          successCount: 0,
          failedCount: 0,
        });
      },
    );

    const documentCompletionListener = DeviceEventEmitter.addListener(
      DOCUMENT_SYNC_COMPLETED_EVENT,
      eventData => {
        console.log('🎯 Document sync completed event received:', eventData);
        setSyncStatus({
          status: 'success',
          count: eventData.success + eventData.failed,
          successCount: eventData.success,
          failedCount: eventData.failed,
        });

        setTimeout(() => {
          setSyncStatus({
            status: 'idle',
            count: 0,
            successCount: 0,
            failedCount: 0,
          });
        }, 5500);
      },
    );

    const documentErrorListener = DeviceEventEmitter.addListener(
      DOCUMENT_SYNC_ERROR_EVENT,
      eventData => {
        console.log('🎯 Document sync error event received:', eventData);
        setSyncStatus({
          status: 'error',
          count: 0,
          successCount: 0,
          failedCount: 0,
        });

        setTimeout(() => {
          setSyncStatus({
            status: 'idle',
            count: 0,
            successCount: 0,
            failedCount: 0,
          });
        }, 5500);
      },
    );

    // Cleanup listeners
    return () => {
      leaveStartListener.remove();
      leaveCompletionListener.remove();
      leaveErrorListener.remove();
      expenseStartListener.remove();
      expenseCompletionListener.remove();
      expenseErrorListener.remove();
      documentStartListener.remove();
      documentCompletionListener.remove();
      documentErrorListener.remove();
    };
  }, []);

  return (
    <SyncStatusBar
      status={syncStatus.status}
      count={syncStatus.count}
      successCount={syncStatus.successCount}
      failedCount={syncStatus.failedCount}
      isDarkMode={isDarkMode}
    />
  );
};

export default SyncStatusBarManager;
