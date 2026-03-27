/**
 * OfflineProfileQueue.js
 *
 * Service to manage offline profile updates using AsyncStorage
 * Handles storing, retrieving, and syncing profile changes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_QUEUE_KEY = '@offline_profile_queue';

class OfflineProfileQueue {
  constructor() {
    this.queue = [];
    this.isInitialized = false;
  }

  /**
   * Initialize the queue from AsyncStorage
   */
  async initialize() {
    try {
      const queueData = await AsyncStorage.getItem(PROFILE_QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(
          '📦 Offline profile queue initialized:',
          this.queue.length,
          'updates',
        );
      } else {
        this.queue = [];
      }
      this.isInitialized = true;
      return this.queue;
    } catch (error) {
      console.error('❌ Error initializing offline profile queue:', error);
      this.queue = [];
      this.isInitialized = true;
      return [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  async saveQueue() {
    try {
      await AsyncStorage.setItem(PROFILE_QUEUE_KEY, JSON.stringify(this.queue));
      console.log('💾 Profile queue saved:', this.queue.length, 'updates');
    } catch (error) {
      console.error('❌ Error saving profile queue:', error);
    }
  }

  /**
   * Add or update profile data in queue
   * @param {Object} profileData - Profile data to queue
   * @param {String} userId - User ID
   * @param {Object} localImagePath - Optional local image path/data for offline upload
   */
  async addProfileUpdate(profileData, userId, localImagePath = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🔍 addProfileUpdate called with:', {
      userId,
      hasLocalImagePath: !!localImagePath,
      localImagePathType: typeof localImagePath,
      localImagePathData: localImagePath,
    });

    // Check if there's already a pending update for this user
    const existingIndex = this.queue.findIndex(item => item.userId === userId);

    const queuedUpdate = {
      userId: userId,
      profileData: profileData,
      localImagePath: localImagePath, // Store local image for later upload
      queuedAt: new Date().toISOString(),
      status: 'pending', // pending, syncing, synced, failed
      retryCount: 0,
      lastAttempt: null,
      error: null,
    };

    console.log(
      '💾 Queueing update with localImagePath:',
      !!queuedUpdate.localImagePath,
    );

    if (existingIndex !== -1) {
      // Update existing queue item
      this.queue[existingIndex] = {
        ...this.queue[existingIndex],
        profileData: profileData,
        localImagePath: localImagePath,
        queuedAt: new Date().toISOString(),
        status: 'pending',
      };
      console.log('🔄 Profile update replaced in queue for user:', userId);
    } else {
      // Add new queue item
      this.queue.push(queuedUpdate);
      console.log('➕ Profile update added to queue for user:', userId);
    }

    if (localImagePath) {
      console.log('📷 Local image stored in queue for later upload');
    }

    await this.saveQueue();
    return queuedUpdate;
  }

  /**
   * Get all pending profile updates
   */
  async getPendingUpdates() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.queue.filter(item => item.status === 'pending');
  }

  /**
   * Get profile update for specific user
   */
  async getUserProfileUpdate(userId) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.queue.find(item => item.userId === userId);
  }

  /**
   * Update status of a profile update
   */
  async updateStatus(userId, status, error = null) {
    const itemIndex = this.queue.findIndex(item => item.userId === userId);

    if (itemIndex !== -1) {
      this.queue[itemIndex] = {
        ...this.queue[itemIndex],
        status: status,
        lastAttempt: new Date().toISOString(),
        error: error,
        retryCount:
          status === 'syncing'
            ? this.queue[itemIndex].retryCount + 1
            : this.queue[itemIndex].retryCount,
      };

      await this.saveQueue();
      console.log(`🔄 Profile update status for user ${userId}:`, status);
      return true;
    }

    return false;
  }

  /**
   * Remove profile update from queue
   */
  async removeProfileUpdate(userId) {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.userId !== userId);

    if (this.queue.length !== initialLength) {
      await this.saveQueue();
      console.log(`✅ Profile update removed from queue for user: ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Clear all profile updates
   */
  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    console.log('🗑️ Profile queue cleared');
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      syncing: this.queue.filter(item => item.status === 'syncing').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
    };
  }
}

// Singleton instance
const offlineProfileQueue = new OfflineProfileQueue();
export default offlineProfileQueue;
