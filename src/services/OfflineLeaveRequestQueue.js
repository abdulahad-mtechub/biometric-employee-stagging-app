/**
 * OfflineLeaveRequestQueue.js
 *
 * This service handles offline leave request storage and synchronization.
 * - Saves leave requests to AsyncStorage when offline
 * - Retrieves all pending requests
 * - Syncs pending requests when online
 * - Removes successfully synced requests
 * - Notifies listeners when sync completes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {DeviceEventEmitter} from 'react-native';
import {createRequest} from '../Constants/api';

// Key for storing pending leave requests in AsyncStorage
const PENDING_REQUESTS_KEY = '@pending_leave_requests';

// Event names for sync status
export const SYNC_COMPLETED_EVENT = 'OFFLINE_REQUESTS_SYNCED';
export const SYNC_STARTED_EVENT = 'OFFLINE_REQUESTS_SYNC_STARTED';
export const SYNC_ERROR_EVENT = 'OFFLINE_REQUESTS_SYNC_ERROR';

/**
 * Save a leave request to offline queue
 * @param {Object} requestBody - The request body to save
 * @param {string} token - User authentication token
 * @returns {Promise<boolean>} - Success status
 */
export const saveOfflineRequest = async (requestBody, token) => {
  try {
    // Get existing pending requests
    const existingRequests = await getPendingRequests();

    // Create a new request object with timestamp and unique ID
    const newRequest = {
      id: Date.now().toString(), // Unique ID based on timestamp
      body: requestBody,
      token: token,
      timestamp: new Date().toISOString(),
    };

    // Add new request to the list
    const updatedRequests = [...existingRequests, newRequest];

    // Save back to AsyncStorage
    await AsyncStorage.setItem(
      PENDING_REQUESTS_KEY,
      JSON.stringify(updatedRequests),
    );

    console.log('✅ Leave request saved offline:', newRequest.id);
    return true;
  } catch (error) {
    console.error('❌ Error saving offline request:', error);
    return false;
  }
};

/**
 * Get all pending leave requests from AsyncStorage
 * @returns {Promise<Array>} - Array of pending requests
 */
export const getPendingRequests = async () => {
  try {
    const requests = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);
    return requests ? JSON.parse(requests) : [];
  } catch (error) {
    console.error('❌ Error getting pending requests:', error);
    return [];
  }
};

/**
 * Remove a specific request from the pending queue
 * @param {string} requestId - The ID of the request to remove
 * @returns {Promise<boolean>} - Success status
 */
export const removeRequest = async requestId => {
  try {
    const existingRequests = await getPendingRequests();
    const updatedRequests = existingRequests.filter(
      req => req.id !== requestId,
    );

    await AsyncStorage.setItem(
      PENDING_REQUESTS_KEY,
      JSON.stringify(updatedRequests),
    );

    console.log('✅ Request removed from queue:', requestId);
    return true;
  } catch (error) {
    console.error('❌ Error removing request:', error);
    return false;
  }
};

/**
 * Sync all pending requests with the server
 * @returns {Promise<Object>} - Object containing success and failure counts
 */
export const syncPendingRequests = async () => {
  try {
    const pendingRequests = await getPendingRequests();

    if (pendingRequests.length === 0) {
      console.log('ℹ️ No pending requests to sync');
      return {success: 0, failed: 0, total: 0};
    }

    console.log(`🔄 Syncing ${pendingRequests.length} pending request(s)...`);

    // ============ EMIT START EVENT ============
    DeviceEventEmitter.emit(SYNC_STARTED_EVENT, {
      count: pendingRequests.length,
    });
    // ==========================================

    let successCount = 0;
    let failedCount = 0;

    // Process each pending request
    for (const request of pendingRequests) {
      try {
        // Attempt to send the request to the API
        await createRequest(request.body, request.token);

        // If successful, remove from queue
        await removeRequest(request.id);
        successCount++;

        console.log(`✅ Request ${request.id} synced successfully`);
      } catch (error) {
        // If failed, keep it in the queue for next sync attempt
        failedCount++;
        console.error(`❌ Failed to sync request ${request.id}:`, error);
      }
    }

    console.log(
      `📊 Sync complete: ${successCount} successful, ${failedCount} failed`,
    );

    // ============ EMIT COMPLETION EVENT ============
    // Notify listeners that sync completed (success or partial)
    DeviceEventEmitter.emit(SYNC_COMPLETED_EVENT, {
      success: successCount,
      failed: failedCount,
      total: pendingRequests.length,
    });
    console.log('📢 Sync completion event emitted');
    // ===============================================

    return {
      success: successCount,
      failed: failedCount,
      total: pendingRequests.length,
    };
  } catch (error) {
    console.error('❌ Error during sync:', error);

    // ============ EMIT ERROR EVENT ============
    DeviceEventEmitter.emit(SYNC_ERROR_EVENT, {
      error: error.message,
    });
    // ==========================================

    return {success: 0, failed: 0, total: 0, error};
  }
};

/**
 * Get the count of pending requests
 * @returns {Promise<number>} - Number of pending requests
 */
export const getPendingRequestsCount = async () => {
  try {
    const requests = await getPendingRequests();
    return requests.length;
  } catch (error) {
    console.error('❌ Error getting pending requests count:', error);
    return 0;
  }
};

/**
 * Clear all pending requests (use with caution)
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllPendingRequests = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_REQUESTS_KEY);
    console.log('✅ All pending requests cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing pending requests:', error);
    return false;
  }
};
