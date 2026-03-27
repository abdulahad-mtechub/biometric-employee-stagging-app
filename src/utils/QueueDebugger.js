/**
 * Remove all failed messages from the queue
 * Usage: import and call QueueDebugger.removeAllFailed()
 */
export const removeAllFailed = async () => {
  try {
    console.log('\n🗑️ Removing all failed messages...');
    await offlineMessageQueue.removeAllFailed();
    const stats = await offlineMessageQueue.getQueueStats();
    console.log('After removal, stats:', stats);
    return true;
  } catch (error) {
    console.error('Error removing failed messages:', error);
    return false;
  }
};
/**
 * QueueDebugger.js
 *
 * Utility functions to debug and manage the offline message queue
 * USE THESE IN REACT NATIVE DEBUGGER CONSOLE OR ADD A DEBUG BUTTON
 */

import offlineMessageQueue from '../services/OfflineMessageQueue';

/**
 * Inspect the current queue contents
 * Usage: import and call QueueDebugger.inspect()
 */
export const inspect = async () => {
  try {
    const queue = await offlineMessageQueue.inspectQueue();
    const stats = await offlineMessageQueue.getQueueStats();

    console.log('\n=== QUEUE INSPECTION ===');
    console.log('Stats:', stats);
    console.log('Full Queue:', queue);
    console.log('========================\n');

    return {queue, stats};
  } catch (error) {
    console.error('Error inspecting queue:', error);
    return null;
  }
};

/**
 * Force clear the entire queue
 * Usage: import and call QueueDebugger.forceClear()
 */
export const forceClear = async () => {
  try {
    console.log('\n⚠️  FORCING QUEUE CLEAR...');
    await offlineMessageQueue.forceClearAll();
    const stats = await offlineMessageQueue.getQueueStats();
    console.log('Queue cleared. New stats:', stats);
    console.log('✅ Done\n');
    return true;
  } catch (error) {
    console.error('Error clearing queue:', error);
    return false;
  }
};

/**
 * Get just the stats
 * Usage: import and call QueueDebugger.stats()
 */
export const stats = async () => {
  try {
    const queueStats = await offlineMessageQueue.getQueueStats();
    console.log('📊 Queue Stats:', queueStats);
    return queueStats;
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
};

/**
 * Remove a specific message by ID
 * Usage: import and call QueueDebugger.removeMessage('message-id-here')
 */
export const removeMessage = async messageId => {
  try {
    console.log(`Removing message: ${messageId}`);
    const result = await offlineMessageQueue.removeMessage(messageId);
    if (result) {
      console.log('✅ Message removed');
      await stats();
    } else {
      console.log('❌ Message not found');
    }
    return result;
  } catch (error) {
    console.error('Error removing message:', error);
    return false;
  }
};

// Export all functions as default object

const QueueDebugger = {
  inspect,
  forceClear,
  stats,
  removeMessage,
  removeAllFailed,
};

export default QueueDebugger;
