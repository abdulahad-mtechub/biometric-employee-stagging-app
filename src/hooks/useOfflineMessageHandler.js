/**
 * useOfflineMessageHandler.js
 *
 * Custom hook to integrate offline messaging functionality
 * Handles sending messages, queueing when offline, and auto-sync
 */

import {useEffect, useCallback, useRef, useState} from 'react';
import useNetworkStatus from './useNetworkStatus';
import offlineMessageQueue from '../services/OfflineMessageQueue';
import messageSyncService from '../services/MessageSyncService';

const useOfflineMessageHandler = (socketRef, token, threadId) => {
  const {isOnline} = useNetworkStatus();
  const [messageStatuses, setMessageStatuses] = useState({}); // Track status per message
  const wasOfflineRef = useRef(false);
  const syncScheduledRef = useRef(false);

  /**
   * Initialize offline queue on mount
   */
  useEffect(() => {
    const initQueue = async () => {
      await offlineMessageQueue.initialize();

      // Load existing queued messages for this thread
      const threadMessages = await offlineMessageQueue.getThreadMessages(
        threadId,
      );

      // Set initial statuses
      const statuses = {};
      threadMessages.forEach(msg => {
        statuses[msg.id] = {
          status: msg.status,
          retryCount: msg.retryCount,
          error: msg.error,
        };
      });
      setMessageStatuses(statuses);
    };

    initQueue();
  }, [threadId]);

  /**
   * Handle network status changes
   */
  useEffect(() => {
    const handleConnectionChange = async () => {
      if (isOnline && wasOfflineRef.current) {
        // Connection restored - trigger sync
        console.log('🌐 Connection restored, triggering sync...');

        if (!syncScheduledRef.current) {
          syncScheduledRef.current = true;

          // Schedule sync with a small delay to ensure socket is ready
          const socket = socketRef?.current;
          messageSyncService.scheduleSync(socket, token, 2000);

          // Reset flag after sync completes
          setTimeout(() => {
            syncScheduledRef.current = false;
          }, 5000);
        }
      }

      wasOfflineRef.current = !isOnline;
    };

    handleConnectionChange();
  }, [isOnline, socketRef, token]);

  /**
   * Update message status
   */
  const updateMessageStatus = useCallback((messageId, status, data = null) => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: {
        status,
        data,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  /**
   * Queue a message for later sending
   */
  const queueMessage = useCallback(
    async (optimisticMessage, messageType, content = null, fileData = null) => {
      const queuedMessage = {
        id: optimisticMessage.id,
        threadId: threadId,
        messageType: messageType,
        content: content || optimisticMessage.message,
        message: content || optimisticMessage.message,
        ...fileData,
        senderName: optimisticMessage.senderName,
        createdAt: optimisticMessage.createdAt,
      };

      await offlineMessageQueue.addMessage(queuedMessage);
      updateMessageStatus(optimisticMessage.id, 'queued');

      // Register callback for status updates during sync
      messageSyncService.registerCallback(
        optimisticMessage.id,
        (status, data) => {
          updateMessageStatus(optimisticMessage.id, status, data);
        },
      );
    },
    [threadId, updateMessageStatus],
  );

  /**
   * Send a text message - ONLY QUEUES (online sending handled in Conversation.js)
   */
  const sendTextMessage = useCallback(
    async (content, optimisticMessage) => {
      const messageId = optimisticMessage.id;

      try {
        // Queue message for offline sending
        console.log('📴 Queueing text message:', messageId);
        await queueMessage(optimisticMessage, 'text', content);
        updateMessageStatus(messageId, 'queued');
        return {queued: true};
      } catch (error) {
        console.error('❌ Error queueing message:', error);
        return {queued: false, error};
      }
    },
    [threadId, updateMessageStatus, queueMessage],
  );

  /**
   * Send an image message - ONLY QUEUES (online sending handled in Conversation.js)
   */
  const sendImageMessage = useCallback(
    async (fileUrl, fileName, optimisticMessage) => {
      const messageId = optimisticMessage.id;

      try {
        // Queue message for offline sending
        console.log('📴 Queueing image message:', messageId);
        await queueMessage(optimisticMessage, 'image', null, {
          file_url: fileUrl,
          file_name: fileName,
          mime_type: optimisticMessage.mime_type || 'image/jpeg',
        });
        updateMessageStatus(messageId, 'queued');
        return {queued: true};
      } catch (error) {
        console.error('❌ Error queueing image:', error);
        return {queued: false, error};
      }
    },
    [threadId, updateMessageStatus, queueMessage],
  );

  /**
   * Send a file/document message - ONLY QUEUES (online sending handled in Conversation.js)
   */
  const sendFileMessage = useCallback(
    async (fileUrl, fileName, fileType, mimeType, optimisticMessage) => {
      const messageId = optimisticMessage.id;

      try {
        // Queue message for offline sending
        console.log('📴 Queueing file message:', messageId);
        await queueMessage(optimisticMessage, 'file', null, {
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          mime_type: mimeType,
        });
        updateMessageStatus(messageId, 'queued');
        return {queued: true};
      } catch (error) {
        console.error('❌ Error queueing file:', error);
        return {queued: false, error};
      }
    },
    [threadId, updateMessageStatus, queueMessage],
  );

  /**
   * Manually trigger sync (useful for retry button)
   */
  const triggerSync = useCallback(async () => {
    if (isOnline) {
      const socket = socketRef?.current;
      await messageSyncService.syncMessages(socket, token);
    }
  }, [isOnline, socketRef, token]);

  /**
   * Get status for a specific message
   */
  const getMessageStatus = useCallback(
    messageId => {
      return messageStatuses[messageId] || {status: 'sent'};
    },
    [messageStatuses],
  );

  /**
   * Get queue statistics
   */
  const getQueueStats = useCallback(async () => {
    return await offlineMessageQueue.getQueueStats();
  }, []);

  return {
    sendTextMessage,
    sendImageMessage,
    sendFileMessage,
    getMessageStatus,
    triggerSync,
    getQueueStats,
    isOnline,
    messageStatuses,
  };
};

export default useOfflineMessageHandler;
