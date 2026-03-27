/**
 * ProfileSyncService.js
 *
 * Service to handle automatic synchronization of offline profile updates
 * Manages retry logic and syncing with the backend
 */

import offlineProfileQueue from './OfflineProfileQueue';
import {editProfile} from '../Constants/api';
import {Alert} from 'react-native';

const MAX_RETRY_ATTEMPTS = 3;

class ProfileSyncService {
  constructor() {
    this.syncInProgress = false;
    this.syncCallbacks = new Map(); // Store callbacks for profile status updates
  }

  /**
   * Register a callback for profile status updates
   */
  registerCallback(userId, callback) {
    this.syncCallbacks.set(userId, callback);
  }

  /**
   * Unregister a callback
   */
  unregisterCallback(userId) {
    this.syncCallbacks.delete(userId);
  }

  /**
   * Notify callback of profile status change
   */
  notifyCallback(userId, status, data = null) {
    const callback = this.syncCallbacks.get(userId);
    if (callback) {
      callback(status, data);
    }
  }

  /**
   * Main sync function - syncs all pending profile updates
   */
  async syncProfiles(token) {
    if (this.syncInProgress) {
      console.log('⏳ Profile sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Starting profile sync...');

      const pendingUpdates = await offlineProfileQueue.getPendingUpdates();

      if (pendingUpdates.length === 0) {
        console.log('✅ No profile updates to sync');
        this.syncInProgress = false;
        return;
      }

      console.log(`📤 Syncing ${pendingUpdates.length} profile updates...`);

      // Process each profile update
      for (const update of pendingUpdates) {
        try {
          await this.syncSingleProfile(update, token);
          // Small delay between syncs
          await this.delay(100);
        } catch (error) {
          console.error(
            `❌ Error syncing profile for user ${update.userId}:`,
            error,
          );
        }
      }

      console.log('✅ Profile sync completed');
    } catch (error) {
      console.error('❌ Error during profile sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single profile update
   */
  async syncSingleProfile(update, token) {
    try {
      console.log(`📤 Syncing profile for user: ${update.userId}`);

      // Mark as syncing
      await offlineProfileQueue.updateStatus(update.userId, 'syncing');
      this.notifyCallback(update.userId, 'syncing');

      let profileDataToSync = {...update.profileData};

      // Debug: Log the entire update object
      console.log('🔍 Full update object:', JSON.stringify(update, null, 2));
      console.log('🔍 localImagePath exists?', !!update.localImagePath);
      console.log('🔍 localImagePath type:', typeof update.localImagePath);
      console.log('🔍 localImagePath value:', update.localImagePath);

      // Check if there's a local image that needs to be uploaded
      if (
        update.localImagePath &&
        typeof update.localImagePath === 'object' &&
        update.localImagePath.path
      ) {
        console.log(
          '📷 Found local image, uploading first:',
          update.localImagePath.path,
        );
        console.log('📷 Full local image data:', update.localImagePath);

        try {
          const {uploadImage} = require('../Constants/api');
          console.log('📤 Calling uploadImage API...');
          const imageResponse = await uploadImage(update.localImagePath, token);
          console.log(
            '📥 uploadImage API response:',
            JSON.stringify(imageResponse, null, 2),
          );

          if (imageResponse.error === false && imageResponse.data?.url) {
            console.log(
              '✅ Image uploaded successfully:',
              imageResponse.data.url,
            );
            profileDataToSync.profile_image = imageResponse.data.url;
            console.log(
              '✅ Updated profile_image in profileDataToSync:',
              profileDataToSync.profile_image,
            );
          } else {
            console.warn(
              '⚠️ Image upload failed, syncing without image:',
              imageResponse.message,
            );
            console.warn('⚠️ Full imageResponse:', imageResponse);
          }
        } catch (imageError) {
          console.error('❌ Error uploading image:', imageError);
          console.error(
            '❌ Error details:',
            imageError.message,
            imageError.stack,
          );
          // Continue with sync even if image upload fails
        }
      } else {
        console.log('ℹ️ No local image to upload or invalid format');
        console.log('ℹ️ Conditions check:');
        console.log('   - localImagePath exists:', !!update.localImagePath);
        console.log(
          '   - is object:',
          typeof update.localImagePath === 'object',
        );
        console.log('   - has path:', update.localImagePath?.path);
      }

      // Call the API
      console.log('📤 Calling editProfile API with data:', profileDataToSync);
      const response = await editProfile(profileDataToSync, token);
      console.log(
        '📥 editProfile API response:',
        JSON.stringify(response, null, 2),
      );

      if (response?.error === false) {
        // Success - remove from queue
        await offlineProfileQueue.removeProfileUpdate(update.userId);
        Alert.alert(
          'Profile Synced',
          'Your profile has been successfully synced with the server.',
        );
        console.log(
          '🔔 Notifying callback with synced status and data:',
          response.data,
        );
        this.notifyCallback(update.userId, 'synced', response.data);

        console.log(
          `✅ Profile synced successfully for user: ${update.userId}`,
        );
        return {success: true, data: response.data};
      } else {
        console.error('❌ API returned error:', response?.message);
        throw new Error(response?.message || 'Failed to sync profile');
      }
    } catch (error) {
      console.error(
        `❌ Failed to sync profile for user ${update.userId}:`,
        error,
      );

      // Check retry count
      if (update.retryCount >= MAX_RETRY_ATTEMPTS) {
        // Max retries reached - mark as failed
        await offlineProfileQueue.updateStatus(
          update.userId,
          'failed',
          error.message,
        );
        this.notifyCallback(update.userId, 'failed', {error: error.message});
        console.log(
          `❌ Profile update failed (max retries) for user: ${update.userId}`,
        );
      } else {
        // Reset to pending for retry
        await offlineProfileQueue.updateStatus(
          update.userId,
          'pending',
          error.message,
        );
        this.notifyCallback(update.userId, 'pending', {error: error.message});
        console.log(
          `🔄 Profile update reset to pending for retry (user: ${update.userId})`,
        );
      }

      return {success: false, error: error.message};
    }
  }

  /**
   * Schedule sync with delay
   */
  scheduleSync(token, delay = 2000) {
    console.log(`⏰ Profile sync scheduled in ${delay}ms`);
    setTimeout(() => {
      console.log('🚀 Executing scheduled profile sync...');
      this.syncProfiles(token);
    }, delay);
  }

  /**
   * Helper: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const profileSyncService = new ProfileSyncService();
export default profileSyncService;
