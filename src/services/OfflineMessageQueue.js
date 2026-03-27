// ...existing code...
/**
 * OfflineMessageQueue.js
 *
 * Service to manage offline message queue using AsyncStorage
 * Handles storing, retrieving, updating, and removing queued messages
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@offline_message_queue';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Progressive delays in ms

class OfflineMessageQueue {
  constructor() {
    this.queue = [];
    this.isInitialized = false;
    this.syncInProgress = false;
  }

  /**
   * Initialize the queue from AsyncStorage
   */
  async initialize() {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(
          '📦 Offline queue initialized:',
          this.queue.length,
          'messages',
        );
      } else {
        this.queue = [];
      }
      this.isInitialized = true;
      return this.queue;
    } catch (error) {
      console.error('❌ Error initializing offline queue:', error);
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
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      console.log('💾 Queue saved:', this.queue.length, 'messages');
    } catch (error) {
      console.error('❌ Error saving queue:', error);
    }
  }

  /**
   * Add a message to the queue
   * @param {Object} message - Message object to queue
   */
  async addMessage(message) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if message already exists in queue (prevent duplicates)
    const existingMessage = this.queue.find(m => m.id === message.id);
    if (existingMessage) {
      console.log('⚠️ Message already in queue, skipping:', message.id);
      return existingMessage;
    }

    const queuedMessage = {
      ...message,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'queued', // queued, sending, failed, sent
      lastAttempt: null,
      error: null,
    };

    this.queue.push(queuedMessage);
    await this.saveQueue();

    console.log('➕ Message added to queue:', queuedMessage.id);
    return queuedMessage;
  }

  /**
   * Get all queued messages
   */
  async getQueuedMessages() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return [...this.queue];
  }

  /**
   * Get queued messages for a specific thread
   */
  async getThreadMessages(threadId) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.queue.filter(msg => msg.threadId === threadId);
  }

  /**
   * Update message status in queue
   */
  async updateMessageStatus(messageId, status, error = null) {
    const messageIndex = this.queue.findIndex(msg => msg.id === messageId);

    if (messageIndex !== -1) {
      this.queue[messageIndex] = {
        ...this.queue[messageIndex],
        status,
        error,
        lastAttempt: new Date().toISOString(),
      };
      await this.saveQueue();
      console.log(`🔄 Message ${messageId} status updated to: ${status}`);
      return this.queue[messageIndex];
    }

    return null;
  }

  /**
   * Increment retry count for a message
   */
  async incrementRetry(messageId) {
    const messageIndex = this.queue.findIndex(msg => msg.id === messageId);

    if (messageIndex !== -1) {
      this.queue[messageIndex].retryCount += 1;
      this.queue[messageIndex].lastAttempt = new Date().toISOString();
      await this.saveQueue();
      return this.queue[messageIndex];
    }

    return null;
  }

  /**
   * Remove a message from the queue (after successful send)
   */
  async removeMessage(messageId) {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(msg => msg.id !== messageId);

    if (this.queue.length !== initialLength) {
      await this.saveQueue();
      console.log('✅ Message removed from queue:', messageId);
      return true;
    }

    return false;
  }

  /**
   * Get messages ready for retry
   * Returns messages that haven't exceeded max retry attempts
   */
  async getRetryableMessages() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const now = new Date();
    return this.queue.filter(msg => {
      // Don't retry if marked as failed (permanent errors)
      if (msg.status === 'failed') {
        return false;
      }

      // Don't retry if already at max attempts
      if (msg.retryCount >= MAX_RETRY_ATTEMPTS) {
        return false;
      }

      // Don't retry if currently sending
      if (msg.status === 'sending') {
        return false;
      }

      // If never attempted, include it
      if (!msg.lastAttempt) {
        return true;
      }

      // Check if enough time has passed since last attempt
      const lastAttemptTime = new Date(msg.lastAttempt);
      const timeSinceLastAttempt = now - lastAttemptTime;
      const requiredDelay =
        RETRY_DELAYS[msg.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

      return timeSinceLastAttempt >= requiredDelay;
    });
  }

  /**
   * Get failed messages that exceeded retry limit
   */
  async getFailedMessages() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.queue.filter(msg => msg.retryCount >= MAX_RETRY_ATTEMPTS);
  }

  /**
   * Clear all queued messages (use with caution)
   */
  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    console.log('🗑️ Queue cleared');
  }

  /**
   * Clear messages for a specific thread
   */
  async clearThreadQueue(threadId) {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(msg => msg.threadId !== threadId);

    if (this.queue.length !== initialLength) {
      await this.saveQueue();
      console.log(`🗑️ Thread ${threadId} queue cleared`);
    }
  }

  /**
   * Clean up stale sending messages
   * Messages stuck in 'sending' status for more than 30 seconds should be reset to 'queued'
   */
  async cleanupStaleSendingMessages() {
    const STALE_THRESHOLD = 30 * 1000; // 30 seconds
    const now = new Date();
    let cleaned = false;

    this.queue = this.queue.map(msg => {
      if (msg.status === 'sending' && msg.lastAttempt) {
        const lastAttemptTime = new Date(msg.lastAttempt);
        const timeSinceAttempt = now - lastAttemptTime;

        if (timeSinceAttempt > STALE_THRESHOLD) {
          console.log(
            `🧹 Resetting stale message ${msg.id} from 'sending' to 'queued'`,
          );
          cleaned = true;
          return {
            ...msg,
            status: 'queued',
          };
        }
      }
      return msg;
    });

    if (cleaned) {
      await this.saveQueue();
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Clean up any messages marked as 'sent' (they should have been removed)
    const sentMessages = this.queue.filter(m => m.status === 'sent');
    if (sentMessages.length > 0) {
      console.log(
        `🧹 Cleaning up ${sentMessages.length} sent messages from queue`,
      );
      this.queue = this.queue.filter(m => m.status !== 'sent');
      await this.saveQueue();
    }

    // Clean up stale 'sending' messages
    await this.cleanupStaleSendingMessages();

    // Clean up old failed messages (older than 24 hours)
    const now = new Date().getTime();
    const oneDayAgo = now - 24 * 60 * 60 * 1000; // 24 hours
    const oldFailedMessages = this.queue.filter(
      m =>
        m.status === 'failed' &&
        m.lastAttempt &&
        new Date(m.lastAttempt).getTime() < oneDayAgo,
    );
    if (oldFailedMessages.length > 0) {
      console.log(
        `🧹 Cleaning up ${oldFailedMessages.length} old failed messages from queue`,
      );
      this.queue = this.queue.filter(
        m =>
          !(
            m.status === 'failed' &&
            m.lastAttempt &&
            new Date(m.lastAttempt).getTime() < oneDayAgo
          ),
      );
      await this.saveQueue();
    }

    // Debug: Log queue contents if not empty

    if (this.queue.length > 0) {
      console.log(
        '📊 Queue Debug - Current messages:',
        this.queue.map(m => ({
          id: m.id,
          status: m.status,
          retryCount: m.retryCount,
          lastAttempt: m.lastAttempt,
          queuedAt: m.queuedAt,
        })),
      );
    }

    // Return statistics
    return {
      total: this.queue.length,
      queued: this.queue.filter(m => m.status === 'queued').length,
      sending: this.queue.filter(m => m.status === 'sending').length,
      failed: this.queue.filter(m => m.status === 'failed').length,
    };
  }

  /**
   * Remove all failed messages from the queue
   */
  async removeAllFailed() {
    const before = this.queue.length;
    this.queue = this.queue.filter(msg => msg.status !== 'failed');
    if (this.queue.length !== before) {
      await this.saveQueue();
      console.log(
        `🗑️ Removed all failed messages from queue (${
          before - this.queue.length
        } removed)`,
      );
    } else {
      console.log('No failed messages to remove.');
    }
    return true;
  }

  /**
   * Mark message as sending
   */
  async markAsSending(messageId) {
    return this.updateMessageStatus(messageId, 'sending');
  }

  /**
   * Mark message as failed
   */
  async markAsFailed(messageId, error) {
    return this.updateMessageStatus(messageId, 'failed', error);
  }

  /**
   * Mark message as sent (will be removed after confirmation)
   */
  async markAsSent(messageId) {
    return this.updateMessageStatus(messageId, 'sent');
  }

  /**
   * Debug: Get all queue contents (for inspection)
   */
  async inspectQueue() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    console.log('🔍 Queue Inspection:');
    console.log('Total messages:', this.queue.length);
    this.queue.forEach((msg, index) => {
      console.log(`\nMessage ${index + 1}:`, {
        id: msg.id,
        threadId: msg.threadId,
        status: msg.status,
        retryCount: msg.retryCount,
        queuedAt: msg.queuedAt,
        lastAttempt: msg.lastAttempt,
        error: msg.error,
        messageType: msg.messageType,
      });
    });
    return this.queue;
  }

  /**
   * Debug: Force clear all messages (for debugging)
   */
  async forceClearAll() {
    console.log('⚠️ Force clearing all messages from queue');
    this.queue = [];
    await this.saveQueue();
    console.log('✅ Queue forcefully cleared');
    return true;
  }
}

// Singleton instance
const offlineMessageQueue = new OfflineMessageQueue();
export default offlineMessageQueue;
export {MAX_RETRY_ATTEMPTS, RETRY_DELAYS};
