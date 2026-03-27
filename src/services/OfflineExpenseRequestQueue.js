/**
 * OfflineExpenseRequestQueue.js
 *
 * This service handles offline expense request storage and synchronization.
 * - Saves expense requests to AsyncStorage when offline
 * - Retrieves all pending requests
 * - Syncs pending requests when online
 * - Removes successfully synced requests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {DeviceEventEmitter} from 'react-native';
import {createExpenses, uploadImage, uploadPdf} from '../Constants/api';

// Key for storing pending expense requests in AsyncStorage
const PENDING_EXPENSE_REQUESTS_KEY = '@pending_expense_requests';

// Event names for sync status
export const EXPENSE_SYNC_COMPLETED_EVENT = 'OFFLINE_EXPENSE_REQUESTS_SYNCED';
export const EXPENSE_SYNC_STARTED_EVENT =
  'OFFLINE_EXPENSE_REQUESTS_SYNC_STARTED';
export const EXPENSE_SYNC_ERROR_EVENT = 'OFFLINE_EXPENSE_REQUESTS_SYNC_ERROR';

/**
 * Save an expense request to offline queue
 * @param {Object} requestBody - The request body to save
 * @param {Object} fileData - Image or PDF file data
 * @param {string} fileType - 'image' or 'pdf'
 * @param {string} token - User authentication token
 * @returns {Promise<boolean>} - Success status
 */
export const saveOfflineExpenseRequest = async (
  requestBody,
  fileData,
  fileType,
  token,
) => {
  try {
    // Get existing pending requests
    const existingRequests = await getPendingExpenseRequests();

    // Create a new request object with timestamp and unique ID
    const newRequest = {
      id: Date.now().toString(), // Unique ID based on timestamp
      body: requestBody,
      fileData: fileData,
      fileType: fileType,
      token: token,
      timestamp: new Date().toISOString(),
    };

    // Add new request to the list
    const updatedRequests = [...existingRequests, newRequest];

    // Save back to AsyncStorage
    await AsyncStorage.setItem(
      PENDING_EXPENSE_REQUESTS_KEY,
      JSON.stringify(updatedRequests),
    );

    console.log('✅ Expense request saved offline:', newRequest.id);
    return true;
  } catch (error) {
    console.error('❌ Error saving offline expense request:', error);
    return false;
  }
};

/**
 * Get all pending expense requests from AsyncStorage
 * @returns {Promise<Array>} - Array of pending requests
 */
export const getPendingExpenseRequests = async () => {
  try {
    const requests = await AsyncStorage.getItem(PENDING_EXPENSE_REQUESTS_KEY);
    return requests ? JSON.parse(requests) : [];
  } catch (error) {
    console.error('❌ Error getting pending expense requests:', error);
    return [];
  }
};

/**
 * Remove a specific expense request from the pending queue
 * @param {string} requestId - The ID of the request to remove
 * @returns {Promise<boolean>} - Success status
 */
export const removeExpenseRequest = async requestId => {
  try {
    const existingRequests = await getPendingExpenseRequests();
    const updatedRequests = existingRequests.filter(
      req => req.id !== requestId,
    );

    await AsyncStorage.setItem(
      PENDING_EXPENSE_REQUESTS_KEY,
      JSON.stringify(updatedRequests),
    );

    console.log('✅ Expense request removed from queue:', requestId);
    return true;
  } catch (error) {
    console.error('❌ Error removing expense request:', error);
    return false;
  }
};

/**
 * Sync all pending expense requests with the server
 * @returns {Promise<Object>} - Object containing success and failure counts
 */
export const syncPendingExpenseRequests = async () => {
  try {
    const pendingRequests = await getPendingExpenseRequests();

    if (pendingRequests.length === 0) {
      console.log('ℹ️ No pending expense requests to sync');
      return {success: 0, failed: 0, total: 0};
    }

    console.log(
      `🔄 Syncing ${pendingRequests.length} pending expense request(s)...`,
    );

    // ============ EMIT START EVENT ============
    DeviceEventEmitter.emit(EXPENSE_SYNC_STARTED_EVENT, {
      count: pendingRequests.length,
    });
    // ==========================================

    let successCount = 0;
    let failedCount = 0;

    // Process each pending request
    for (const request of pendingRequests) {
      try {
        let uploadedReceiptUrl = '';

        // Upload file based on type
        if (request.fileType === 'image' && request.fileData) {
          const responseImage = await uploadImage(request.fileData);
          if (responseImage?.data?.url) {
            uploadedReceiptUrl = responseImage.data.url;
          }
        } else if (request.fileType === 'pdf' && request.fileData) {
          const responsePdf = await uploadPdf(request.fileData, request.token);
          if (responsePdf?.data?.url) {
            uploadedReceiptUrl = responsePdf.data.url;
          }
        }

        // Create the expense request body with uploaded file URL
        const body = {
          ...request.body,
          receipt_url: uploadedReceiptUrl,
        };

        // Attempt to send the request to the API
        await createExpenses(body, request.token);

        // If successful, remove from queue
        await removeExpenseRequest(request.id);
        successCount++;

        console.log(`✅ Expense request ${request.id} synced successfully`);
      } catch (error) {
        // If failed, keep it in the queue for next sync attempt
        failedCount++;
        console.error(
          `❌ Failed to sync expense request ${request.id}:`,
          error,
        );
      }
    }

    console.log(
      `📊 Expense sync complete: ${successCount} successful, ${failedCount} failed`,
    );

    // ============ EMIT COMPLETION EVENT ============
    // Notify listeners that sync completed (success or partial)
    DeviceEventEmitter.emit(EXPENSE_SYNC_COMPLETED_EVENT, {
      success: successCount,
      failed: failedCount,
      total: pendingRequests.length,
    });
    console.log('📢 Expense sync completion event emitted');
    // ===============================================

    return {
      success: successCount,
      failed: failedCount,
      total: pendingRequests.length,
    };
  } catch (error) {
    console.error('❌ Error during expense sync:', error);

    // ============ EMIT ERROR EVENT ============
    DeviceEventEmitter.emit(EXPENSE_SYNC_ERROR_EVENT, {
      error: error.message,
    });
    // ==========================================

    return {success: 0, failed: 0, total: 0, error};
  }
};

/**
 * Get the count of pending expense requests
 * @returns {Promise<number>} - Number of pending requests
 */
export const getPendingExpenseRequestsCount = async () => {
  try {
    const requests = await getPendingExpenseRequests();
    return requests.length;
  } catch (error) {
    console.error('❌ Error getting pending expense requests count:', error);
    return 0;
  }
};

/**
 * Clear all pending expense requests (use with caution)
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllPendingExpenseRequests = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_EXPENSE_REQUESTS_KEY);
    console.log('✅ All pending expense requests cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing pending expense requests:', error);
    return false;
  }
};
