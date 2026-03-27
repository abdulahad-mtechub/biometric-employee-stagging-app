/**
 * MessageSyncService.js
 *
 * Service to handle automatic synchronization of offline messages
 * Manages retry logic, duplicate prevention, and batch syncing
 */

import offlineMessageQueue from './OfflineMessageQueue';
import {sendMessage as apiSendMessage} from '../Constants/api';

class MessageSyncService {
  constructor() {
    this.syncInProgress = false;
    this.syncCallbacks = new Map(); // Store callbacks for message status updates
    this.processedMessageIds = new Set(); // Track processed messages to prevent duplicates
    this.syncTimeout = null;
  }

  /**
   * Register a callback for message status updates
   */
  registerCallback(messageId, callback) {
    this.syncCallbacks.set(messageId, callback);
  }

  /**
   * Unregister a callback
   */
  unregisterCallback(messageId) {
    this.syncCallbacks.delete(messageId);
  }

  /**
   * Notify callback of message status change
   */
  notifyCallback(messageId, status, data = null) {
    const callback = this.syncCallbacks.get(messageId);
    if (callback) {
      callback(status, data);
    }
  }

  /**
   * Main sync function - syncs all queued messages
   */
  async syncMessages(socket, token) {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Starting message sync...');

      // Get all retryable messages
      const retryableMessages =
        await offlineMessageQueue.getRetryableMessages();

      if (retryableMessages.length === 0) {
        console.log('✅ No messages to sync');
        this.syncInProgress = false;
        return;
      }

      console.log(`📤 Syncing ${retryableMessages.length} messages...`);
      console.log(
        '📋 Message IDs to sync:',
        retryableMessages.map(m => m.id),
      );

      // Sort messages by queuedAt timestamp (oldest first)
      const sortedMessages = retryableMessages.sort(
        (a, b) => new Date(a.queuedAt) - new Date(b.queuedAt),
      );

      // Process messages sequentially to maintain order
      for (const message of sortedMessages) {
        // Skip if already processed (duplicate prevention)
        if (this.processedMessageIds.has(message.id)) {
          console.log(`⏭️ Skipping already processed message: ${message.id}`);
          await offlineMessageQueue.removeMessage(message.id);
          continue;
        }

        try {
          await this.syncSingleMessage(message, socket, token);
          // Small delay between messages to prevent overwhelming the server
          await this.delay(100);
        } catch (error) {
          console.error(`❌ Error syncing message ${message.id}:`, error);
        }
      }

      console.log('✅ Message sync completed');
    } catch (error) {
      console.error('❌ Error during message sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single message
   */
  async syncSingleMessage(message, socket, token) {
    try {
      console.log(`📤 Syncing message: ${message.id}`);

      // Mark as sending and increment retry count
      await offlineMessageQueue.markAsSending(message.id);
      await offlineMessageQueue.incrementRetry(message.id);
      this.notifyCallback(message.id, 'sending');

      // Check if message has a local file that needs uploading
      const needsUpload =
        message.file_url &&
        (message.file_url.startsWith('file://') ||
          message.file_url.startsWith('/data/') ||
          message.file_url.startsWith('/storage/') ||
          message.file_url.startsWith('content://'));

      if (needsUpload) {
        console.log(
          `📤 Message has local file, uploading first:`,
          message.file_url,
        );

        try {
          const {uploadImage, uploadPdf} = require('../Constants/api');

          // Prepare file data in the correct format for uploads
          // Determine mime type - use message's mime_type, or infer from message type
          let mimeType =
            message.mime_type ||
            message.file_type ||
            'application/octet-stream';

          // If mime type is missing, infer from message type
          if (
            !message.mime_type &&
            !message.file_type &&
            (message.messageType === 'image' ||
              message.message_type === 'image')
          ) {
            mimeType = 'image/jpeg';
          }

          const fileData = {
            uri: message.file_url,
            path: message.file_url,
            name: message.file_name || `file_${Date.now()}`,
            type: mimeType,
            mime: mimeType,
            filename: message.file_name || `file_${Date.now()}`,
          };

          console.log('📤 File data for upload:', {
            uri: fileData.uri,
            name: fileData.name,
            type: fileData.type,
            mime: fileData.mime,
            messageType: message.messageType,
            originalMimeType: message.mime_type,
          });

          let uploadRes;
          // Determine upload method based on file type
          if (
            message.messageType === 'image' ||
            message.message_type === 'image'
          ) {
            console.log('📤 Uploading image file...');
            uploadRes = await uploadImage(fileData);
          } else if (
            message.messageType === 'audio' ||
            message.message_type?.includes('audio') ||
            message.mime_type?.includes('audio') ||
            message.file_type?.includes('audio') ||
            mimeType?.includes('audio')
          ) {
            console.log(
              '📤 Audio file detected - skipping upload, will send local path to socket',
            );
            uploadRes = {
              data: {url: message.file_url},
              error: false,
            };
          } else {
            console.log('📤 Uploading document file...');
            uploadRes = await uploadPdf(fileData, token);
          }
          if (uploadRes && !uploadRes.error && uploadRes.data?.url) {
            console.log('✅ File uploaded successfully:', uploadRes.data.url);
            message = {
              ...message,
              file_url: uploadRes.data.url,
            };
          } else {
            const errorMsg = uploadRes?.message || 'File upload failed';
            console.error('❌ Upload response error:', errorMsg);
            throw new Error(errorMsg);
          }
        } catch (uploadError) {
          console.error('❌ File upload failed:', uploadError);
          console.error('❌ File details:', {
            url: message.file_url,
            name: message.file_name,
            mimeType: message.mime_type,
            fileType: message.file_type,
            messageType: message.messageType,
          });

          if (message.file_url?.startsWith('content://')) {
            throw new Error(
              'Cannot upload file with content:// URI. File must be saved to device first.',
            );
          }

          throw new Error(`File upload failed: ${uploadError.message}`);
        }
      }

      let result;

      if (socket && socket.connected) {
        result = await this.sendViaSocket(message, socket);
      } else {
        result = await this.sendViaAPI(message, token);
      }

      if (result.success) {
        this.processedMessageIds.add(message.id);

        await offlineMessageQueue.removeMessage(message.id);

        this.notifyCallback(message.id, 'sent', result.data);

        console.log(`✅ Message ${message.id} synced successfully`);
        return true;
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error(`❌ Failed to sync message ${message.id}:`, error);

      const errorMessage = error.message || String(error);
      const isPermanentError =
        errorMessage.includes('does not exist') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('invalid thread') ||
        errorMessage.includes('unauthorized');

      const messageInQueue = (
        await offlineMessageQueue.getQueuedMessages()
      ).find(m => m.id === message.id);

      if (isPermanentError) {
        await offlineMessageQueue.markAsFailed(message.id, errorMessage);
        console.log(
          `❌ Message ${message.id} marked as failed (permanent error: ${errorMessage})`,
        );
        this.notifyCallback(message.id, 'failed', {error: errorMessage});
      } else if (messageInQueue && messageInQueue.retryCount >= 4) {
        await offlineMessageQueue.markAsFailed(message.id, errorMessage);
        console.log(
          `❌ Message ${message.id} marked as failed (max retries reached)`,
        );
        this.notifyCallback(message.id, 'failed', {error: errorMessage});
      } else {
        await offlineMessageQueue.updateMessageStatus(
          message.id,
          'queued',
          errorMessage,
        );
        console.log(`🔄 Message ${message.id} reset to 'queued' for retry`);
        this.notifyCallback(message.id, 'queued', {error: errorMessage});
      }

      return false;
    }
  }

  async sendViaSocket(message, socket) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket send timeout'));
      }, 10000);

      try {
        const responseHandler = data => {
          clearTimeout(timeout);
          socket.off('message_sent', responseHandler);
          socket.off('message_error', errorHandler);

          resolve({
            success: true,
            data: data,
          });
        };

        const errorHandler = error => {
          clearTimeout(timeout);
          socket.off('message_sent', responseHandler);
          socket.off('message_error', errorHandler);

          resolve({
            success: false,
            error: error.message || 'Socket error',
          });
        };

        // Emit message
        if (message.messageType === 'text') {
          socket.once('message_sent', responseHandler);
          socket.once('message_error', errorHandler);

          const payload = {
            threadId: message.threadId,
            content: message.content || message.message,
            message_type: 'text',
          };
          console.log('📤 Socket emit send_message:', payload);
          socket.emit('send_message', payload);
        } else if (message.messageType === 'image') {
          // For images, use send_message event (not send_image) - matches working Conversation.js implementation
          // The file is already uploaded, just emit and consider it sent
          const payload = {
            threadId: message.threadId,
            content: message.content || '',
            messageType: 'image',
            fileUrl: message.file_url,
            fileName: message.file_name,
            fileSize: message.file_size || null,
            mimeType: message.mime_type || 'image/jpeg',
            tempId: message.id,
          };
          console.log('📤 Socket emit send_message (image):', payload);
          socket.emit('send_message', payload);

          // Clear timeout and resolve immediately
          // The message will appear when backend sends it back via new_image_message
          clearTimeout(timeout);
          console.log(
            '✅ Image message emitted successfully (upload completed)',
          );
          resolve({
            success: true,
            data: {
              file_url: message.file_url,
              file_name: message.file_name,
            },
          });
        } else if (
          message.messageType === 'audio' ||
          message.message_type === 'audio/webm' ||
          message.mime_type === 'audio/webm'
        ) {
          socket.once('message_sent', responseHandler);
          socket.once('message_error', errorHandler);

          const payload = {
            threadId: message.threadId,
            content: null,
            messageType: 'audio',
            fileUrl: message.file_url,
            fileName: message.file_name,
            fileSize: null,
            mimeType: 'audio/webm',
          };
          console.log('📤 Socket emit send_message (audio):', payload);
          socket.emit('send_message', payload);
        } else if (
          message.messageType === 'file' ||
          message.messageType === 'document'
        ) {
          // For documents, use send_message event with 'system' messageType - matches working implementation
          const payload = {
            threadId: message.threadId,
            content: message.content || '',
            messageType: 'system', // Backend expects 'system' for documents
            fileUrl: message.file_url,
            fileName: message.file_name,
            fileSize: message.file_size || null,
            mimeType:
              message.mime_type || message.file_type || 'application/pdf',
            tempId: message.id,
          };
          console.log('📤 Socket emit send_message (document):', payload);
          socket.emit('send_message', payload);

          // Clear timeout and resolve immediately
          clearTimeout(timeout);
          console.log(
            '✅ Document message emitted successfully (upload completed)',
          );
          resolve({
            success: true,
            data: {
              file_url: message.file_url,
              file_name: message.file_name,
            },
          });
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Send message via API (fallback)
   */
  async sendViaAPI(message, token) {
    try {
      const response = await apiSendMessage(
        message.threadId,
        message.content || message.message,
        token,
      );

      if (response && !response.error) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: response.message || 'API error',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  /**
   * Schedule automatic sync when connection is restored
   */
  scheduleSync(socket, token, delayMs = 1000) {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.syncMessages(socket, token);
    }, delayMs);
  }

  /**
   * Cancel scheduled sync
   */
  cancelScheduledSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  /**
   * Clear processed message IDs (call periodically to prevent memory leak)
   */
  clearProcessedIds() {
    this.processedMessageIds.clear();
  }

  /**
   * Helper: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      inProgress: this.syncInProgress,
      processedCount: this.processedMessageIds.size,
      activeCallbacks: this.syncCallbacks.size,
    };
  }
}

// Singleton instance
const messageSyncService = new MessageSyncService();

export default messageSyncService;
