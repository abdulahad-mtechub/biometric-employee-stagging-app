/**
 * DebugQueueButton.js
 *
 * Temporary debug button to inspect and clear the offline message queue
 * Add this to your Conversation screen to debug the queue issue
 *
 * USAGE IN CONVERSATION.JS:
 *
 * 1. Import: import DebugQueueButton from '../../components/DebugQueueButton';
 * 2. Add anywhere in your render: <DebugQueueButton />
 * 3. Remove after debugging
 */

import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Alert} from 'react-native';
import QueueDebugger from '../utils/QueueDebugger';

const DebugQueueButton = () => {
  const handleInspect = async () => {
    const result = await QueueDebugger.inspect();
    if (result) {
      Alert.alert(
        'Queue Debug',
        `Total: ${result.stats.total}\nQueued: ${result.stats.queued}\nSending: ${result.stats.sending}\nFailed: ${result.stats.failed}\n\nCheck console for details`,
      );
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear Queue?',
      'This will remove all messages from the offline queue. Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const result = await QueueDebugger.forceClear();
            if (result) {
              Alert.alert('Success', 'Queue cleared successfully');
            }
          },
        },
      ],
    );
  };

  const handleStats = async () => {
    const stats = await QueueDebugger.stats();
    if (stats) {
      Alert.alert(
        'Queue Stats',
        `Total: ${stats.total}\nQueued: ${stats.queued}\nSending: ${stats.sending}\nFailed: ${stats.failed}\nMax Retries: ${stats.maxRetries}`,
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleStats}>
        <Text style={styles.buttonText}>📊 Stats</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleInspect}>
        <Text style={styles.buttonText}>🔍 Inspect</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={handleClear}>
        <Text style={styles.buttonText}>🗑️ Clear</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'column',
    gap: 10,
    zIndex: 9999,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default DebugQueueButton;
