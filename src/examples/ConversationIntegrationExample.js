/**
 * ConversationIntegrationExample.js
 *
 * Example showing how to integrate offline messaging into Conversation.js
 * Copy the relevant sections into your actual Conversation component
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Text, FlatList, TextInput, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import offline messaging components
import useOfflineMessageHandler from '../hooks/useOfflineMessageHandler';
import NetworkStatusBar from '../components/NetworkStatusBar';

const ConversationExample = ({route, navigation}) => {
  // Existing state
  const {thread_id, userName, userAvatar} = route?.params || {};
  const {isDarkMode} = useSelector(store => store.theme);
  const token = useSelector(state => state?.auth?.user?.token);
  const userId = useSelector(state => state?.auth?.user?.worker?.id);

  const [chat, setChat] = useState('');
  const [chatData, setChatData] = useState([]);
  const [queuedCount, setQueuedCount] = useState(0);

  const socketRef = useRef(null);
  const flatListRef = useRef();

  // ========================================
  // OFFLINE MESSAGING INTEGRATION
  // ========================================

  // Initialize offline message handler
  const {
    sendTextMessage,
    sendImageMessage,
    sendFileMessage,
    getMessageStatus,
    triggerSync,
    getQueueStats,
    isOnline,
    messageStatuses,
  } = useOfflineMessageHandler(socketRef.current, token, thread_id);

  // Update queued message count for status bar
  useEffect(() => {
    const updateStats = async () => {
      const stats = await getQueueStats();
      setQueuedCount(stats.queued + stats.sending);
    };

    const interval = setInterval(updateStats, 2000);
    updateStats();

    return () => clearInterval(interval);
  }, [getQueueStats]);

  // Format time helper
  const formatTime = useCallback(dateString => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  }, []);

  // ========================================
  // SEND TEXT MESSAGE (MODIFIED FOR OFFLINE)
  // ========================================

  const handleSendMessage = async () => {
    if (!chat.trim() || !thread_id) return;

    const messageContent = chat.trim();
    const tempId = `temp_${Date.now()}`;

    setChat(''); // Clear input immediately

    // Create optimistic message for instant UI feedback
    const optimisticMessage = {
      id: tempId,
      message: messageContent,
      time: formatTime(new Date().toISOString()),
      isSender: true,
      isDelivered: false,
      senderName: 'You',
      createdAt: new Date().toISOString(),
      messageType: 'text',
      sender_id: userId,
    };

    // Add to UI immediately (optimistic update)
    setChatData(prev => [...prev, optimisticMessage]);

    try {
      // Send message (will queue if offline)
      const result = await sendTextMessage(messageContent, optimisticMessage);

      if (result.success && result.data) {
        // Update with server data if immediately successful
        setChatData(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: result.data.id,
                  isDelivered: true,
                }
              : msg,
          ),
        );
      } else if (result.queued) {
        // Message queued - status will be updated by the hook
        console.log('📦 Message queued:', tempId);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  // ========================================
  // SEND IMAGE MESSAGE (MODIFIED FOR OFFLINE)
  // ========================================

  const handleImageUploadAndSend = async file => {
    const tempId = `temp_img_${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      // Step 1: Upload image first (must be online)
      if (!isOnline) {
        Alert.alert('Offline', 'Please connect to internet to upload images');
        return;
      }

      // Show uploading indicator
      const uploadingMessage = {
        id: tempId,
        messageType: 'image',
        time: formatTime(timestamp),
        isSender: true,
        createdAt: timestamp,
        uploading: true,
        uploadProgress: 0,
      };
      setChatData(prev => [...prev, uploadingMessage]);

      // Upload image
      const imageData = {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || `image_${Date.now()}.jpg`,
      };

      const uploadResponse = await uploadImage(imageData);

      if (!uploadResponse?.data?.url) {
        throw new Error('Upload failed');
      }

      const imageUrl = uploadResponse.data.url;

      // Step 2: Create optimistic message with uploaded URL
      const optimisticMessage = {
        id: tempId,
        file_url: imageUrl,
        file_name: file.fileName,
        messageType: 'image',
        time: formatTime(timestamp),
        isSender: true,
        createdAt: timestamp,
        isDelivered: false,
      };

      // Update UI with uploaded image
      setChatData(prev =>
        prev.map(msg => (msg.id === tempId ? optimisticMessage : msg)),
      );

      // Step 3: Send message (will queue if offline)
      const result = await sendImageMessage(
        imageUrl,
        file.fileName,
        optimisticMessage,
      );

      if (result.success && result.data) {
        setChatData(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {...msg, id: result.data.id, isDelivered: true}
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error('❌ Image send error:', error);

      // Remove failed message
      setChatData(prev => prev.filter(msg => msg.id !== tempId));

      Alert.alert('Upload Failed', 'Unable to upload image');
    }
  };

  // ========================================
  // SEND FILE MESSAGE (MODIFIED FOR OFFLINE)
  // ========================================

  const handleDocumentUploadAndSend = async file => {
    const tempId = `temp_doc_${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      if (!isOnline) {
        Alert.alert('Offline', 'Please connect to internet to upload files');
        return;
      }

      // Show uploading indicator
      const uploadingMessage = {
        id: tempId,
        messageType: 'file',
        time: formatTime(timestamp),
        isSender: true,
        createdAt: timestamp,
        file_name: file.name,
        uploading: true,
      };
      setChatData(prev => [...prev, uploadingMessage]);

      // Upload file
      const uploadResponse = await uploadPdf(file, token);

      if (!uploadResponse?.data?.url) {
        throw new Error('Upload failed');
      }

      const fileUrl = uploadResponse.data.url;

      // Create optimistic message
      const optimisticMessage = {
        id: tempId,
        file_url: fileUrl,
        file_name: file.name,
        file_type: file.type,
        mime_type: file.type,
        messageType: 'file',
        time: formatTime(timestamp),
        isSender: true,
        createdAt: timestamp,
        isDelivered: false,
      };

      // Update UI
      setChatData(prev =>
        prev.map(msg => (msg.id === tempId ? optimisticMessage : msg)),
      );

      // Send message
      const result = await sendFileMessage(
        fileUrl,
        file.name,
        file.type,
        file.type,
        optimisticMessage,
      );

      if (result.success && result.data) {
        setChatData(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {...msg, id: result.data.id, isDelivered: true}
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error('❌ File send error:', error);
      setChatData(prev => prev.filter(msg => msg.id !== tempId));
      Alert.alert('Upload Failed', 'Unable to upload file');
    }
  };

  // ========================================
  // RENDER MESSAGE WITH STATUS INDICATOR
  // ========================================

  const renderMessage = ({item}) => {
    const messageStatus = getMessageStatus(item.id);
    const isTextMessage = item.messageType === 'text';
    const isImageMessage = item.messageType === 'image';
    const isFileMessage = item.messageType === 'file';

    return (
      <View style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            item.isSender ? styles.senderBubble : styles.receiverBubble,
          ]}>
          {/* Text Message */}
          {isTextMessage && (
            <Text style={styles.messageText}>{item.message}</Text>
          )}

          {/* Image Message */}
          {isImageMessage && (
            <Image source={{uri: item.file_url}} style={styles.messageImage} />
          )}

          {/* File Message */}
          {isFileMessage && (
            <TouchableOpacity style={styles.fileContainer}>
              <MaterialCommunityIcons name="file-document" size={40} />
              <Text style={styles.fileName}>{item.file_name}</Text>
            </TouchableOpacity>
          )}

          {/* Status Indicator for Sender */}
          {item.isSender && (
            <View style={styles.statusContainer}>
              <Text style={styles.timeText}>{item.time}</Text>

              {/* Queued */}
              {messageStatus.status === 'queued' && (
                <View style={styles.statusIcon}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color="#999"
                  />
                </View>
              )}

              {/* Sending */}
              {messageStatus.status === 'sending' && (
                <View style={styles.statusIcon}>
                  <MaterialCommunityIcons
                    name="clock-fast"
                    size={14}
                    color="#FFA500"
                  />
                </View>
              )}

              {/* Sent */}
              {messageStatus.status === 'sent' && (
                <View style={styles.statusIcon}>
                  <MaterialCommunityIcons
                    name="check-all"
                    size={14}
                    color="#4CAF50"
                  />
                </View>
              )}

              {/* Failed */}
              {messageStatus.status === 'failed' && (
                <View style={styles.statusIcon}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={14}
                    color="#FF6B6B"
                  />
                  <Text style={styles.failedText}>Failed</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // ========================================
  // RENDER UI
  // ========================================

  return (
    <View style={styles.container}>
      {/* Network Status Bar */}
      <NetworkStatusBar
        queuedCount={queuedCount}
        onRetryPress={triggerSync}
        isDarkMode={isDarkMode}
      />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName}</Text>
      </View>

      {/* Chat List */}
      <FlatList
        ref={flatListRef}
        data={chatData}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.chatList}
      />

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TextInput
          value={chat}
          onChangeText={setChat}
          placeholder="Type a message..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={handleSendMessage}>
          <MaterialCommunityIcons name="send" size={24} color="#006EC2" />
        </TouchableOpacity>
      </View>

      {/* Offline Indicator (optional additional indicator) */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <MaterialCommunityIcons name="wifi-off" size={16} color="#FF6B6B" />
          <Text style={styles.offlineText}>
            You're offline. Messages will be sent when online.
          </Text>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  chatList: {
    flex: 1,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  senderBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#006EC2',
  },
  receiverBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
  },
  statusIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  failedText: {
    fontSize: 10,
    color: '#FF6B6B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    marginRight: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#FFEBEE',
    gap: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#FF6B6B',
  },
});

export default ConversationExample;
