import {pick, types} from '@react-native-documents/picker';
import {useFocusEffect} from '@react-navigation/native';
import moment from 'moment';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import NitroSound from 'react-native-nitro-sound';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {WebView} from 'react-native-webview';
import {useDispatch, useSelector} from 'react-redux';
import {io} from 'socket.io-client';
import {Images} from '../../assets/Images/Images';
import {Svgs} from '../../assets/Svgs/Svgs';
import CameraBottomSheet from '../../components/BottomSheets/CameraBottomSheet';
import NetworkStatusBar from '../../components/NetworkStatusBar';
import TxtInput from '../../components/TextInput/Txtinput';
import {
  getMessagebyThread,
  markAllAsRead,
  uploadImage,
  uploadPdf,
} from '../../Constants/api';
import {ImgURL} from '../../Constants/Base_URL';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import useOfflineMessageHandler from '../../hooks/useOfflineMessageHandler';
import {
  clearThreadCount,
  incrementThreadCount,
} from '../../redux/Slices/MessageCountSlice';
import {pxToPercentage} from '../../utils/responsive';
import {useAlert} from '../../Providers/AlertContext';

const Conversation = ({navigation, route}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPath, setAudioPath] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [audioDuration, setAudioDuration] = useState({});
  const recordingIntervalRef = useRef(null);
  const formatAudioTime = milliseconds => {
    const totalSeconds = Math.floor((milliseconds || 0) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: t('Audio Recording Permission'),
            message: t(
              'This app needs access to your microphone to record audio messages.',
            ),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showAlert(t('Microphone permission denied'), 'error');
          return;
        }
      }

      setIsRecording(true);
      setRecordingTime(0);
      NitroSound.addRecordBackListener(e => {
        if (typeof e.currentPosition === 'number') {
          setRecordingTime(Math.floor(e.currentPosition / 1000));
        }
      });
      const path = await NitroSound.startRecorder();
      setAudioPath(path);
    } catch (error) {
      setIsRecording(false);
      setRecordingTime(0);
      showAlert(t('Failed to start recording. Please try again.'), 'error');
    }
  };

  // Audio: Stop recording and send
  const stopRecording = async () => {
    try {
      NitroSound.removeRecordBackListener();
      const filePath = await NitroSound.stopRecorder();
      setIsRecording(false);
      setRecordingTime(0);
      setAudioPath(null);
      if (filePath) {
        await sendAudioMessage(filePath);
      }
    } catch (error) {
      setIsRecording(false);
      setRecordingTime(0);
      showAlert('Failed to stop recording.', 'error', 'Error');
    }
  };

  // Audio: Cancel recording
  const cancelRecording = async () => {
    try {
      NitroSound.removeRecordBackListener();
      await NitroSound.stopRecorder();
      setIsRecording(false);
      setRecordingTime(0);
      setAudioPath(null);
    } catch (error) {
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Audio: Send audio message (OFFLINE-ENABLED)
  const sendAudioMessage = async filePath => {
    const tempId = `temp_audio_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    const timestamp = new Date().toISOString();

    try {
      // Optimistic UI - show immediately
      const tempMessage = {
        id: tempId,
        thread_id: thread_id,
        sender_id: userId,
        message_type: 'audio/webm',
        messageType: 'audio',
        content: null,
        file_url: filePath, // Use local path initially
        file_name: `audio_${Date.now()}.webm`,
        mime_type: 'audio/webm',
        created_at: timestamp,
        updated_at: timestamp,
        senderName: 'You',
        uploading: isOnline, // Only show uploading if online
        isSender: true,
        time: formatTime(timestamp),
        isRead: false, // Message not read when first sent
      };
      setChatData(prev => capMessagesForFirstPage([...prev, tempMessage]));

      // Scroll to bottom when audio message is sent
      setTimeout(scrollToBottomOnNewMessage, 100);

      let audioLiveUrl = filePath; // Default to local path
      let optimisticMessage = tempMessage;

      // Only upload if online
      if (isOnline) {
        const audioData = {
          uri: filePath,
          path: filePath,
          name: `audio_${Date.now()}.webm`,
          mime: 'audio/webm',
        };

        console.log('📤 Online: Uploading audio file...');
        const uploadRes = await (typeof uploadAudio === 'function'
          ? uploadAudio(audioData)
          : Promise.resolve({data: {url: filePath}}));

        if (!uploadRes || uploadRes.error || !uploadRes.data?.url) {
          throw new Error(uploadRes?.message || 'Failed to upload audio');
        }

        audioLiveUrl = uploadRes.data.url;
        console.log('✅ Audio uploaded successfully, URL:', audioLiveUrl);

        optimisticMessage = {
          ...tempMessage,
          uploading: false,
          file_url: audioLiveUrl,
          isDelivered: false,
        };

        setChatData(prev =>
          prev.map(msg => (msg.id === tempId ? optimisticMessage : msg)),
        );
      } else {
        console.log('📴 Offline: Audio will be uploaded when online');
        optimisticMessage = {
          ...tempMessage,
          uploading: false,
          isDelivered: false,
        };
        setChatData(prev =>
          prev.map(msg => (msg.id === tempId ? optimisticMessage : msg)),
        );
      }

      // Send message - ONLINE use socket directly, OFFLINE queue it
      const socket = socketRef?.current;

      if (isOnline && socket && socket.connected) {
        // ONLINE: Send directly via socket
        console.log('📤 Sending audio message ONLINE via socket:', {
          tempId,
          audioUrl: audioLiveUrl,
        });

        socket.emit('send_message', {
          threadId: thread_id,
          content: null,
          messageType: 'audio',
          fileUrl: audioLiveUrl,
          fileName: tempMessage.file_name,
          fileSize: null,
          mimeType: 'audio/webm',
          tempId: tempId,
        });

        console.log(
          '✅ Audio message emitted via socket (will be confirmed by server)',
        );
      } else {
        // OFFLINE: Queue for later sending
        console.log('📴 OFFLINE: Queueing audio message for later:', tempId);
        const result = await sendFileMessage(
          audioLiveUrl,
          tempMessage.file_name,
          'audio/webm',
          'audio/webm',
          optimisticMessage,
        );

        if (result.queued) {
          console.log('📦 Audio message queued successfully:', tempId);
        }
      }
    } catch (error) {
      console.error('❌ Audio send failed:', error);
      showAlert(
        error.message || 'Failed to send audio message.',
        'error',
        'Error',
      );
      setChatData(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  // Audio: Play audio
  const playAudio = async (audioUrl, messageId) => {
    try {
      if (playingAudio === messageId) {
        await NitroSound.stopPlayer();
        NitroSound.removePlayBackListener();
        setPlayingAudio(null);
        setAudioProgress(prev => ({...prev, [messageId]: 0}));
      } else {
        if (playingAudio) {
          await NitroSound.stopPlayer();
          NitroSound.removePlayBackListener();
          setAudioProgress(prev => ({...prev, [playingAudio]: 0}));
        }
        setPlayingAudio(messageId);
        NitroSound.addPlayBackListener(e => {
          const currentPos = e.currentPosition || 0;
          const totalDuration = e.duration || 0;
          if (totalDuration > 0 && !audioDuration[messageId]) {
            setAudioDuration(prev => ({...prev, [messageId]: totalDuration}));
          }
          setAudioProgress(prev => ({...prev, [messageId]: currentPos}));
          if (currentPos >= totalDuration - 100 && totalDuration > 0) {
            NitroSound.stopPlayer();
            NitroSound.removePlayBackListener();
            setPlayingAudio(null);
            setAudioProgress(prev => ({...prev, [messageId]: 0}));
          }
        });
        await NitroSound.startPlayer(audioUrl);
      }
    } catch (error) {
      NitroSound.removePlayBackListener();
      setPlayingAudio(null);
      setAudioProgress(prev => ({...prev, [messageId]: 0}));
      showAlert('Failed to play audio.', 'error', 'Error');
    }
  };

  // Audio: Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      NitroSound.removeRecordBackListener();
      NitroSound.removePlayBackListener();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (playingAudio) {
        NitroSound.stopPlayer().catch(() => {});
      }
    };
  }, []);
  const {thread_id, userName, userAvatar, other_user_id} = route?.params || {};
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {showAlert} = useAlert();
  const [chat, setChat] = useState('');
  const [chatData, setChatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [socketUserId, setSocketUserId] = useState(null);
  const [otherUserOnline, setOtherUserOnlineStatus] = useState(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState(null);
  const MESSAGES_PER_PAGE = 7;
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Scroll position management
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const lastLoadedMessagesCount = useRef(0);
  const lastScrollTriggerTime = useRef(0);
  const shouldScrollToBottomOnInitialLoadRef = useRef(false);
  const userScrollStartedRef = useRef(false);

  const onRefresh = useCallback(async () => {
    console.log('🔄 Pull-to-refresh triggered');
    // Pull-to-refresh on the chat should load older (previous) messages
    if (!hasMoreMessages || loadingMoreRef.current) {
      console.log(
        '🚫 onRefresh aborted - no more messages or already loading',
        {
          hasMoreMessages,
          loadingMore: loadingMoreRef.current,
        },
      );
      return;
    }

    try {
      await loadMoreMessages();
    } catch (e) {
      console.error('❌ onRefresh/loadMoreMessages error:', e);
    }
  }, [fetchChatMessages]);

  // Enhanced scroll detection with debouncing and position management
  const handleScrollEnhanced = event => {
    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
    const {y} = contentOffset;

    setScrollOffset(y);
    setContentHeight(contentSize.height);
    setContainerHeight(layoutMeasurement.height);

    // Only trigger when the user scrolls near the top of the list.
    // Use a single threshold and a debounce to avoid multiple rapid triggers.
    const now = Date.now();
    const DEBOUNCE_MS = 500; // Wait 500ms between triggers
    const lastTrigger = lastScrollTriggerTime.current;
    const timeSinceLastTrigger = now - lastTrigger;

    const TRIGGER_THRESHOLD = 120; // px from top

    if (
      userScrollStartedRef.current &&
      y <= TRIGGER_THRESHOLD &&
      hasMoreMessages &&
      !loadingMoreRef.current &&
      timeSinceLastTrigger >= DEBOUNCE_MS
    ) {
      console.log('🖱️ [DEBOUNCED] Triggering loadMoreMessages...', {
        y,
        timeSinceLastTrigger,
      });
      lastScrollTriggerTime.current = now;
      loadMoreMessages();
    }
  };

  // Preserve scroll position during pagination
  const preserveScrollPosition = useCallback(
    (currentScrollOffset, currentContentHeight, newMessagesCount) => {
      if (flatListRef?.current) {
        // Calculate the new offset based on how much content was added
        // Since we prepended messages, we need to scroll down by the height of new messages
        // The height added is approximately: (new messages) * (estimated message height)
        const estimatedMessageHeight = 60; // Average height of a message item
        const heightAdded = newMessagesCount * estimatedMessageHeight;

        console.log('📐 Preserving scroll position:', {
          currentScrollOffset,
          currentContentHeight,
          newMessagesCount,
          heightAdded,
          newOffset: currentScrollOffset + heightAdded,
        });

        // Scroll down by the height of the new content that was added
        // This keeps the user's visual position the same
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: currentScrollOffset + heightAdded,
            animated: false,
          });
          console.log('✅ Scroll position preserved by', heightAdded, 'pixels');
        }, 50);
      }
    },
    [],
  );

  // Handle content size change (when messages are loaded)
  const handleContentSizeChange = (contentWidth, contentHeight) => {
    console.log('📐 Content size changed:', {
      contentHeight,
      previousOffset: scrollOffset,
      chatDataLength: chatData.length,
    });

    setContentHeight(contentHeight);

    // Initial screen render: ensure we land on the latest message at the bottom
    // after FlatList has measured and painted content.
    if (
      shouldScrollToBottomOnInitialLoadRef.current &&
      !loadingMoreRef.current &&
      chatData.length > 0
    ) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({animated: false});
      });
      shouldScrollToBottomOnInitialLoadRef.current = false;
    }
  };

  // Handle layout measurement change
  const handleLayoutChange = event => {
    const {height} = event.nativeEvent.layout;
    console.log('📏 Container layout changed:', {height});
    setContainerHeight(height);
  };

  // Debounce ref to prevent multiple rapid calls
  const loadMoreTimeoutRef = useRef(null);
  // Ref guard to prevent concurrent loadMore calls from causing race conditions
  const loadingMoreRef = useRef(false);
  // Keep first page bounded so sent/received messages follow same page size.
  const capMessagesForFirstPage = useCallback(
    (messages, pageNumber = currentPage) => {
      if (loadingMoreRef.current || pageNumber > 1) return messages;
      if (messages.length <= MESSAGES_PER_PAGE) return messages;
      return messages.slice(messages.length - MESSAGES_PER_PAGE);
    },
    [currentPage, MESSAGES_PER_PAGE],
  );

  const getOtherUserStatusText = () => {
    try {
      if (otherUserOnline) return t('Online');
      if (otherUserLastSeen) {
        const d = new Date(otherUserLastSeen);
        if (!isNaN(d.getTime())) {
          const today = new Date();
          const isToday =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
          const time = d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          if (isToday) return `Last seen today at ${time}`;
          return `Last seen on ${d.toLocaleDateString('en-US')} at ${time}`;
        }
      }
    } catch (e) {
      // fallback
    }
    return t('Offline');
  };
  const [document, setDocument] = useState(null);
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  const [documentUploadProgress, setDocumentUploadProgress] = useState({});
  const [downloadingDocuments, setDownloadingDocuments] = useState({});
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [headerImageError, setHeaderImageError] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState(null);

  const userId = useSelector(state => state?.auth?.user?.worker?.id);
  const token = useSelector(state => state?.auth?.user?.token);

  const CameraBottomSheetRef = useRef(null);
  const flatListRef = useRef();
  const threadIdRef = useRef(thread_id);
  const userIdRef = useRef(userId);
  const socketRef = useRef(null);

  // ========================================
  // OFFLINE MESSAGING INTEGRATION
  // ========================================
  const {
    sendTextMessage,
    sendImageMessage,
    sendFileMessage,
    getMessageStatus,
    triggerSync,
    getQueueStats,
    isOnline,
    messageStatuses,
  } = useOfflineMessageHandler(socketRef, token, thread_id);

  const [queuedCount, setQueuedCount] = useState(0);

  // Update queued message count for status bar
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await getQueueStats();
        if (
          stats &&
          typeof stats.queued !== 'undefined' &&
          typeof stats.sending !== 'undefined'
        ) {
          setQueuedCount(stats.queued + stats.sending);
        } else {
          console.warn('Invalid stats returned from getQueueStats:', stats);
          setQueuedCount(0);
        }
      } catch (error) {
        console.error('Error updating queue stats:', error);
        setQueuedCount(0);
      }
    };

    const interval = setInterval(updateStats, 2000);
    updateStats();

    return () => clearInterval(interval);
  }, [getQueueStats]);

  useEffect(() => {
    threadIdRef.current = thread_id;
    userIdRef.current = userId;
    // Reset pagination state whenever switching/opening a thread.
    setCurrentPage(1);
    setHasMoreMessages(true);
  }, [thread_id, userId]);

  const formatTime = useCallback(dateString => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
  }, []);

  // --- MESSAGE TRANSFORM (per docs) ---
  const transformMessage = useCallback(
    data => {
      // Accepts message object from socket or API
      // Check for read status from various possible field names
      const isRead =
        data.is_read === true ||
        data.seen === true ||
        data.is_seen === true ||
        data.read_at != null ||
        data.seen_at != null ||
        data.read_receipt === true;

      return {
        id:
          data.id?.toString() ||
          `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        message: data.content,
        time: formatTime(data.created_at || new Date().toISOString()),
        isSender: data.sender_id === (socketUserId || userIdRef.current),
        isDelivered: true,
        isRead: isRead,
        senderName: data.sender_name || 'Unknown',
        senderAvatar: data.sender_avatar,
        messageType: data.message_type || 'text',
        createdAt: data.created_at || new Date().toISOString(),
        file_url: data.file_url,
        file_name: data.file_name,
        file_type: data.file_type,
        sender_id: data.sender_id,
        mime_type: data.mime_type,
      };
    },
    [formatTime, socketUserId],
  );

  // --- SOCKET INITIALIZATION (per docs) ---
  const initializeSocket = useCallback(() => {
    if (!token) {
      console.log('❌ No token available for socket connection');
      return;
    }

    console.log('🔄 Initializing socket connection...');

    // Debug: show which other_user_id we have for presence tracking
    console.log('🔎 other_user_id (from route params):', other_user_id);

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Clean the URL - remove trailing spaces and ensure proper format
    const cleanUrl = ImgURL.trim();
    console.log('🌐 Connecting to:', cleanUrl);

    // Initialize new socket with same config as web
    const socket = io(cleanUrl, {
      auth: {token},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
      forceNew: true,
    });
    socketRef.current = socket;

    // Socket event handlers
    const handleConnect = () => {
      console.log('🔌 Socket connected successfully');
      setIsConnected(true);
      try {
        console.log('🔗 socket.id:', socket.id);
      } catch (e) {}

      // Authenticate socket
      // Log a masked token to help debug missing/invalid token issues
      try {
        const masked = token ? `${String(token).slice(0, 8)}...` : 'null';
        console.log('🔐 Authenticating socket with token (masked):', masked);
      } catch (e) {
        console.log('🔐 Authenticating socket (token unknown)');
      }

      try {
        // Emit authenticate with acknowledgement callback to capture server ACK or error
        socket.emit('authenticate', {token}, ack => {
          try {
            console.log('📣 authenticate ack:', ack);
          } catch (e) {
            console.log('📣 authenticate ack received');
          }
        });
      } catch (e) {
        console.warn('⚠️ Failed to emit authenticate', e);
      }
    };

    const handleAuthenticated = data => {
      console.log('✅ Socket authentication successful:', data);
      if (data.user) {
        setSocketUserId(data.user.id);
        console.log('🔑 Socket user ID set:', data.user.id);

        // Emit online status when authenticated
        socket.emit('update_online_status', {
          userId: data.user.id,
          isOnline: true,
        });
        console.log('📡 Emitted online status:', {
          userId: data.user.id,
          isOnline: true,
        });
        socket.on('user_status_change', data => {
          console.log('User Status Changed:', data, {context: 'Conversation'});
          if (data.userId === other_user_id) {
            setOtherUserOnlineStatus(data.status);
          }
        });

        // Join user room and thread room after authentication
        try {
          socket.emit('join_user_room', data.user.id, ack => {
            console.log(
              '📣 join_user_room ack for current user:',
              data.user.id,
              ack,
            );
          });
        } catch (e) {
          console.warn(
            '⚠️ join_user_room emit failed for current user',
            data.user.id,
            e,
          );
        }

        // Also join the other user's room so we receive their online/offline updates
        if (other_user_id) {
          try {
            socket.emit('join_user_room', other_user_id, ack => {
              console.log(
                '📣 join_user_room ack for other_user_id:',
                other_user_id,
                ack,
              );
            });
          } catch (e) {
            console.warn(
              '⚠️ join_user_room emit failed for other_user_id',
              other_user_id,
              e,
            );
          }
          console.log(
            '🚀 Joined other user room to receive status updates:',
            other_user_id,
          );

          // Request current status for the other user (if server supports it)
          try {
            socket.emit('get_user_status', {userId: other_user_id}, ack => {
              console.log('📣 get_user_status ack:', other_user_id, ack);
            });
            console.log(
              '📡 Requested current status for other_user_id:',
              other_user_id,
            );
          } catch (e) {
            console.warn(
              '⚠️ get_user_status emit failed (server may not support it)',
            );
          }

          // Also emit a minimal online status and fallback status requests
          // to support backends that expect different shapes or RPC names.
          try {
            socket.emit('update_online_status', {isOnline: true}, ack => {
              console.log('📣 update_online_status ack (minimal):', ack);
            });
            console.log('📡 Emitted minimal online status (isOnline:true)');
          } catch (e) {
            console.warn('⚠️ Emitting minimal update_online_status failed', e);
          }

          [
            'get_user_status',
            'request_user_status',
            'get_presence',
            'fetch_user_status',
          ].forEach(evt => {
            try {
              socket.emit(evt, {userId: other_user_id}, ack => {
                console.log('📣 fallback emit ack', evt, other_user_id, ack);
              });
              console.log(
                '📡 Emitted fallback status request',
                evt,
                other_user_id,
              );
            } catch (e) {
              console.warn('⚠️ Emit failed for', evt, e);
            }
          });
        }
        if (thread_id) {
          console.log('🚀 Joining thread room after auth:', thread_id);
          socket.emit('join_thread_room', thread_id);
        }
      }
    };

    // Handle incoming messages
    const handleIncomingMessage = (data, eventName) => {
      console.log(`📩 [${eventName}] Socket message received:`, data);

      const incomingThreadId = data.threadId || data.thread_id;
      const currentThreadId = parseInt(threadIdRef.current);

      if (parseInt(incomingThreadId) !== currentThreadId) {
        // Increment count for other threads
        dispatch(
          incrementThreadCount({
            threadId: incomingThreadId,
            timestamp: data.created_at || new Date().toISOString(),
          }),
        );
        return;
      }

      try {
        const messageData = data.message || data;
        const newMessage = transformMessage(messageData);
        console.log('✅ Transformed new message:', newMessage);

        setChatData(prev => {
          const isDuplicate = prev.some(
            msg =>
              msg.id === newMessage.id ||
              (msg.id.startsWith('temp_') &&
                msg.message === newMessage.message &&
                msg.isSender === newMessage.isSender),
          );

          if (isDuplicate) {
            console.log('⚠️ Duplicate message ignored:', newMessage.id);
            return prev;
          }

          const updatedMessages = [...prev, newMessage].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
          );

          console.log(
            '📝 Added new message, total messages:',
            updatedMessages.length,
          );

          // Scroll to bottom when new message arrives
          setTimeout(scrollToBottomOnNewMessage, 100);

          return capMessagesForFirstPage(updatedMessages);
        });

        // Clear count for current thread when receiving messages (guarded)
        try {
          if (Number.isFinite(currentThreadId)) {
            dispatch(clearThreadCount({threadId: currentThreadId}));
          } else {
            console.warn(
              'clearThreadCount skipped: invalid currentThreadId',
              currentThreadId,
            );
          }
        } catch (e) {
          console.warn('Error dispatching clearThreadCount:', e);
        }
      } catch (error) {
        console.error('❌ Error processing socket message:', error);
      }
    };

    const handleMessageSent = data => {
      console.log('✅ Message sent confirmation:', data);
      // Update optimistic message with real ID
      if (data.message && data.tempId) {
        setChatData(prev =>
          prev.map(msg => {
            if (msg.id === data.tempId) {
              const transformed = transformMessage(data.message);
              // Preserve the isRead status from the optimistic message
              return {
                ...transformed,
                isDelivered: true,
                isRead: msg.isRead || false,
              };
            }
            return msg;
          }),
        );
      }
    };

    const handleDisconnect = reason => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);

      // Emit offline status when disconnected
      socket.emit('update_online_status', {
        userId: socketUserId || userIdRef.current,
        isOnline: false,
      });
      console.log('📡 Emitted offline status on disconnect');
    };

    const handleConnectError = error => {
      console.error('❌ Socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
      });
      setIsConnected(false);
    };

    const handleError = error => {
      console.error('❌ Socket error:', error);
    };
    socket.on('authenticated', data => {
      console.log('✅ Socket authenticated:', {
        user: data.user,
        userId: data.user?.id,
        currentUserId: currentUser?.id,
        socketId: socket.id,
      });
    });
    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('authenticated', handleAuthenticated);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('error', handleError);
    socket.on('message_sent', handleMessageSent);

    // Debug: catch any event the server emits so we can discover unknown event names
    try {
      socket.onAny((event, ...args) => {
        try {
          console.log(
            '🔔 socket.onAny event:',
            event,
            args && args.length === 1 ? args[0] : args,
          );
        } catch (e) {
          console.log('🔔 socket.onAny event:', event);
        }
      });
    } catch (e) {
      // some older socket.io-client versions may not support onAny in this environment
    }

    // Listen to all message events
    ['new_message', 'receive_message', 'new_image_message'].forEach(event => {
      socket.on(event, data => handleIncomingMessage(data, event));
    });

    // Listen for read receipts
    socket.on('messages_read', data => {
      console.log('📖 Messages read event received:', data);
      try {
        const {threadId, readByUserId, messageIds, markedCount} = data;

        // Only update if the read receipt is from the other user in this conversation
        const currentUserId = socketUserId || userIdRef.current;
        console.log('📖 Current user ID:', currentUserId);
        console.log('📖 Read by user ID:', readByUserId);
        console.log('📖 Message IDs from event:', messageIds);
        console.log('📖 Thread ID from event:', threadId);

        if (String(readByUserId) !== String(currentUserId)) {
          console.log(
            '📖 Updating read status for messages in thread:',
            threadId,
          );

          setChatData(prev => {
            console.log('📖 Current chat messages count:', prev.length);
            console.log(
              '📖 Current message IDs:',
              prev.map(m => m.id),
            );

            // Update messages in this thread to mark as read
            const updatedMessages = prev.map(message => {
              // If messageIds is provided, check if current message ID matches
              let shouldMarkAsRead = false;

              if (
                messageIds &&
                Array.isArray(messageIds) &&
                messageIds.length > 0
              ) {
                // Check if this message's ID is in the read list
                shouldMarkAsRead = messageIds.some(id => {
                  // Try exact match
                  if (String(id) === String(message.id)) return true;

                  // Try matching temp IDs (e.g., temp_123 vs 123)
                  if (
                    String(id).startsWith('temp_') &&
                    message.id.startsWith('temp_')
                  ) {
                    return String(id) === String(message.id);
                  }

                  // Try stripping 'temp_' prefix and matching
                  const realId = message.id.startsWith('temp_')
                    ? message.id.replace('temp_', '')
                    : message.id;
                  const eventId = String(id).startsWith('temp_')
                    ? String(id).replace('temp_', '')
                    : String(id);
                  if (realId === eventId) return true;

                  return false;
                });
              } else {
                // If no specific messageIds provided, mark all sender messages in thread as read
                shouldMarkAsRead =
                  message.isSender &&
                  (message.thread_id == threadId ||
                    message.threadId == threadId);
              }

              if (shouldMarkAsRead) {
                console.log('📖 Marking message as read:', {
                  messageId: message.id,
                  isSender: message.isSender,
                  thread_id: message.thread_id,
                  content: message.message?.substring(0, 30),
                });
                return {
                  ...message,
                  isRead: true,
                };
              }
              return message;
            });

            const newlyUpdatedCount = updatedMessages.filter(
              m => m.isRead,
            ).length;
            console.log(
              '📖 Total messages now marked as read:',
              newlyUpdatedCount,
            );
            console.log('📖 Total messages updated:', markedCount);
            return updatedMessages;
          });
        } else {
          console.log('📖 Read receipt from current user, skipping update');
        }
      } catch (error) {
        console.error('❌ Error handling messages_read event:', error);
      }
    });

    // Normalize and handle online status updates from server
    const handleOnlineStatusUpdate = data => {
      try {
        console.log('📡 Online status event received:', data);

        // server may send different shapes: {userId, isOnline} or {user_id, status} etc.
        const userId = data?.userId ?? data?.user_id ?? data?.id;
        const statusRaw =
          data?.isOnline ??
          data?.is_online ??
          data?.status ??
          data?.online ??
          false;

        // Normalize status to boolean
        let isOnline = false;
        if (typeof statusRaw === 'boolean') {
          isOnline = statusRaw;
        } else if (typeof statusRaw === 'string') {
          const s = statusRaw.toLowerCase().trim();
          isOnline = s === 'online' || s === 'true' || s === '1';
        } else if (typeof statusRaw === 'number') {
          isOnline = statusRaw === 1;
        }

        // Try to extract last-seen timestamp if provided
        const lastSeen =
          data?.last_seen_at ??
          data?.lastSeen ??
          data?.last_seen ??
          data?.last_seen_time ??
          null;

        // debug log
        console.log('📡 Parsed online status:', {
          userId,
          statusRaw,
          isOnline,
          lastSeen,
        });

        if (!other_user_id) {
          console.warn('⚠️ other_user_id is not available in route params');
          return;
        }

        if (String(userId) === String(other_user_id)) {
          setOtherUserOnlineStatus(Boolean(isOnline));
          if (lastSeen) setOtherUserLastSeen(lastSeen);
          console.log(
            '📡 Updated other user online state:',
            Boolean(isOnline),
            'lastSeen:',
            lastSeen,
          );
        }
      } catch (e) {
        console.error('❌ Error handling online status update:', e);
      }
    };

    // Listen for multiple possible event names for backward-compatibility

    return () => {
      console.log('🧹 Cleaning up socket connection');
      try {
        if (socket && typeof socket.offAny === 'function') {
          socket.offAny();
        }
      } catch (e) {}

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, thread_id, transformMessage, dispatch]);

  useEffect(() => {
    const cleanup = initializeSocket();
    return cleanup;
  }, [initializeSocket]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottomOnNewMessage = useCallback(() => {
    if (flatListRef?.current && chatData?.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [chatData]);

  // Only scroll to bottom on initial load and when new messages arrive
  // Removed automatic scroll to prevent re-renders when loading older messages

  // --- AUTO UPDATE WHEN OFFLINE MESSAGES DELIVERED ---
  // When MessageSyncService marks queued messages as 'sent', update them locally instead of refetching
  const reRenderDebounceRef = useRef(null);
  useEffect(() => {
    try {
      // Find any messages that transitioned to 'sent'
      const statuses = Object.values(messageStatuses || {});
      const hasDelivered = statuses.some(s => s?.status === 'sent');

      if (hasDelivered) {
        console.log(
          '📦 Messages delivered from offline queue, updating locally...',
        );
        // NO REFETCH - Just update the local messages
        // The messages are already in chatData, they just need their status updated
        setChatData(prev =>
          prev.map(msg => {
            const status = messageStatuses[msg.id];
            if (status?.status === 'sent') {
              return {
                ...msg,
                isDelivered: true,
              };
            }
            return msg;
          }),
        );
      }
    } catch (e) {
      // No-op: defensive guard
    }
  }, [messageStatuses]);

  // --- FETCH MESSAGES (per docs) ---
  const fetchChatMessages = async (isLoadMore = false, pageToFetch = null) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setCurrentPage(1);
        setChatData([]);
      } else {
        setLoadingMore(true);
      }

      const page = pageToFetch || currentPage;

      const response = await getMessagebyThread(
        thread_id,
        token,
        MESSAGES_PER_PAGE,
        page,
      );

      if (!response) {
        throw new Error('No response received from server');
      }

      if (response?.error === true) {
        throw new Error(response.message || 'Failed to fetch messages');
      }

      // Handle different possible response structures flexibly
      let messages = [];

      if (response?.data?.messages && Array.isArray(response.data.messages)) {
        // Format 1: { data: { messages: [...] } }
        messages = response.data.messages;
      } else if (response?.data && Array.isArray(response.data)) {
        // Format 2: { data: [...] }
        messages = response.data;
      } else if (response?.messages && Array.isArray(response.messages)) {
        // Format 3: { messages: [...] }
        messages = response.messages;
      } else if (Array.isArray(response)) {
        // Format 4: Direct array
        messages = response;
      } else {
        // No messages found - show empty conversation
        messages = [];
      }

      // Ensure messages is an array before mapping
      if (!Array.isArray(messages)) {
        messages = [];
      }
      const transformedMessages = messages.map((message, index) => {
        try {
          // Check for read status from various possible field names
          const isRead =
            message.is_read === true ||
            message.seen === true ||
            message.is_seen === true ||
            message.read_at != null ||
            message.seen_at != null ||
            message.read_receipt === true;

          return {
            id: message.id?.toString() || `temp_${Date.now()}_${Math.random()}`,
            message: message.content || '',
            time: formatTime(message.created_at),
            isSender: message.sender_id === userId,
            isDelivered: true,
            isRead: isRead,
            senderName: message.sender_name || 'Unknown',
            senderAvatar: message.sender_avatar || null,
            messageType: message.message_type || 'text',
            createdAt: message.created_at,
            file_url: message.file_url || null,
            file_name: message.file_name || null,
            file_type: message.file_type || null,
            sender_id: message.sender_id,
            mime_type: message.mime_type || null,
          };
        } catch (mapError) {
          console.error(
            `❌ Error transforming message at index ${index}:`,
            mapError,
          );
          console.error('Message data:', message);
          throw mapError;
        }
      });
      // Keep message order chronological so the latest message is at the bottom.
      transformedMessages.sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return aTime - bTime;
      });

      // Check for pagination info in response
      const hasMore =
        response?.data?.hasMore ||
        response?.hasMore ||
        transformedMessages.length === MESSAGES_PER_PAGE;

      console.log('📊 Pagination check:', {
        hasMore,
        responseHasMore: response?.data?.hasMore || response?.hasMore,
        messagesCount: transformedMessages.length,
        MESSAGES_PER_PAGE,
      });
      setHasMoreMessages(hasMore);

      if (isLoadMore) {
        // Store the count of new messages before updating
        const newMessagesCount = transformedMessages.length;
        lastLoadedMessagesCount.current = newMessagesCount;

        console.log('📥 Storing new messages count:', newMessagesCount);

        // Get current scroll position BEFORE updating chatData
        const currentScrollOffset = scrollOffset;
        const currentContentHeight = contentHeight;

        console.log('📍 Current position before load:', {
          currentScrollOffset,
          currentContentHeight,
          newMessagesCount,
        });

        // Append older messages to the beginning when loading more
        // PRESERVE scroll position to prevent jump
        setChatData(prev => [...transformedMessages, ...prev]);
        setLoadingMore(false);

        // Reset debounce timer when loading completes to allow next trigger
        lastScrollTriggerTime.current = 0;

        // Preserve scroll position after new messages are added
        // Pass the captured values to ensure we use the correct position
        setTimeout(() => {
          preserveScrollPosition(
            currentScrollOffset,
            currentContentHeight,
            newMessagesCount,
          );
        }, 100);
      } else {
        // Initial load - always jump to latest message at the bottom.
        setChatData(capMessagesForFirstPage(transformedMessages, page));
        setLoading(false);
        shouldScrollToBottomOnInitialLoadRef.current =
          transformedMessages.length > 0;
      }

      setError(null);
    } catch (err) {
      console.error('❌ Error fetching messages:', err);
      console.error('❌ Error stack:', err.stack);

      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);

      // Only show alert for non-network errors
      if (
        !errorMessage.includes('Network') &&
        !errorMessage.includes('timeout')
      ) {
        Alert.alert('Error', 'Failed to load messages: ' + errorMessage);
      }

      if (!isLoadMore) {
        setChatData([]);
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Load more messages (older messages) when scrolling to the top
  const loadMoreMessages = async () => {
    console.log('🔍 loadMoreMessages called:', {
      loadingMore: loadingMoreRef.current,
      hasMoreMessages,
      currentPage,
      chatDataLength: chatData.length,
    });

    if (loadingMoreRef.current || !hasMoreMessages) {
      console.log('🚫 loadMoreMessages aborted:', {
        loadingMore: loadingMoreRef.current,
        hasMoreMessages,
      });
      return;
    }

    // Guard concurrent calls
    loadingMoreRef.current = true;
    setLoadingMore(true);

    const pageToFetch = currentPage + 1;
    console.log('📥 Loading more messages, pageToFetch:', pageToFetch);

    try {
      await fetchChatMessages(true, pageToFetch);

      // Only update the page number after a successful fetch
      setCurrentPage(pageToFetch);
    } catch (e) {
      console.error('❌ loadMoreMessages failed:', e);
      // keep currentPage unchanged on failure
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
      // Reset debounce timer when loading completes to allow next trigger
      lastScrollTriggerTime.current = 0;
    }
  };

  // Handle scroll to detect when user is near the top
  const markMessagesAsRead = async () => {
    try {
      if (!thread_id) {
        console.warn('markMessagesAsRead: missing thread_id, skipping');
        return;
      }

      // Optimistically clear local/unread Redux count for this thread so UI updates immediately
      try {
        dispatch(clearThreadCount({threadId: thread_id}));
      } catch (e) {
        console.warn('Failed to dispatch clearThreadCount optimistically', e);
      }

      // Emit socket event (if connected) to inform server and other clients
      if (socketRef.current && socketRef.current.connected) {
        try {
          socketRef.current.emit('mark_read', {threadId: thread_id});
        } catch (e) {
          console.warn('Failed to emit mark_read via socket', e);
        }
      }

      // Call API to mark messages as read on server
      await markAllAsRead(thread_id, token);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Fetch chat messages on focus
  useFocusEffect(
    useCallback(() => {
      console.log('🚦 Chat screen focused, fetching messages...', thread_id);
      if (thread_id) {
        fetchChatMessages(false, 1); // Fetch page 1 on initial load
        markMessagesAsRead();
      }
    }, [thread_id, token, userId]),
  );

  // Handle file selection from camera bottom sheet
  const handleFileSelect = async file => {
    if (!file) return;

    console.log('📎 File selected:', {
      type: file.type,
      mime: file.mime,
      name: file.name,
      filename: file.filename,
      size: file.size,
      uri: file.uri,
      path: file.path,
    });

    const isImage =
      file.type?.startsWith('image/') || file.mime?.startsWith('image/');
    const isDocument = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ].includes(file.type || file.mime);

    // Don't wrap in try-catch - let the individual functions handle errors
    if (isImage) {
      console.log('🖼️ Handling image upload...');
      await handleImageUploadAndSend(file);
    } else if (isDocument) {
      console.log('📄 Handling document upload...');
      await handleDocumentUploadAndSend(file);
    }
  };

  // Upload and send image via socket (OFFLINE-ENABLED)
  const handleImageUploadAndSend = async file => {
    const tempId = `temp_img_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    const timestamp = moment().format();

    try {
      // Create temporary message for immediate UI feedback
      const tempMessage = {
        id: tempId,
        thread_id: thread_id,
        sender_id: userId,
        message_type: 'image',
        content: chat || '',
        file_url: file.path || file.uri, // Use local path for now
        file_name: file.filename || file.name || `image_${Date.now()}.jpg`,
        file_size: file.size || null,
        mime_type: file.mime || file.type || 'image/jpeg',
        created_at: timestamp,
        updated_at: timestamp,
        sender_name: 'You',
        sender_avatar: null,
        uploading: isOnline, // Only show uploading if online
        time: formatTime(timestamp),
        isSender: true,
        messageType: 'image',
        isRead: false, // Message not read when first sent
      };

      console.log('📤 Adding temp image message:', tempId);
      setChatData(prev => capMessagesForFirstPage([...prev, tempMessage]));

      // Scroll to bottom when image message is sent
      setTimeout(scrollToBottomOnNewMessage, 100);

      let imageUrl = file.path || file.uri; // Default to local path
      let optimisticMessage = tempMessage;

      // Only upload if online
      if (isOnline) {
        setImageUploadProgress(prev => ({...prev, [tempId]: 0}));

        console.log('📤 Online: Starting image upload with file:', {
          uri: file.path || file.uri,
          type: file.mime || file.type,
          name: file.filename || file.name,
        });

        const uploadRes = await uploadImage(file);

        if (!uploadRes || uploadRes.error || !uploadRes.data?.url) {
          const errorMsg =
            uploadRes?.message || uploadRes?.error || 'Failed to upload image';
          console.error('❌ Upload validation failed:', errorMsg);
          throw new Error(errorMsg);
        }

        imageUrl = uploadRes.data.url;
        console.log('✅ Image uploaded successfully, URL:', imageUrl);

        // Update temp message with uploaded URL
        optimisticMessage = {
          ...tempMessage,
          uploading: false,
          file_url: imageUrl,
          isDelivered: false,
        };

        setChatData(prev =>
          prev.map(msg => (msg.id === tempId ? optimisticMessage : msg)),
        );

        // Clear image upload progress
        setImageUploadProgress(prev => {
          const newProgress = {...prev};
          delete newProgress[tempId];
          return newProgress;
        });
      } else {
        console.log('📴 Offline: Image will be uploaded when online');
        optimisticMessage = {
          ...tempMessage,
          uploading: false,
          isDelivered: false,
        };
        setChatData(prev =>
          prev.map(msg => (msg.id === tempId ? optimisticMessage : msg)),
        );
      }

      // Send message - ONLINE use socket directly, OFFLINE queue it
      const socket = socketRef?.current;

      if (isOnline && socket && socket.connected) {
        // ONLINE: Send directly via socket
        console.log('📤 Sending image message ONLINE via socket:', {
          tempId,
          imageUrl,
        });

        socket.emit('send_message', {
          threadId: thread_id,
          content: '',
          messageType: 'image',
          fileUrl: imageUrl,
          fileName: tempMessage.file_name,
          fileSize: file.size || null,
          mimeType: file.mime || file.type || 'image/jpeg',
          tempId: tempId,
        });

        console.log(
          '✅ Image message emitted via socket (will be confirmed by server)',
        );
      } else {
        // OFFLINE: Queue for later sending
        console.log('📴 OFFLINE: Queueing image message for later:', tempId);
        const result = await sendImageMessage(
          imageUrl,
          tempMessage.file_name,
          optimisticMessage,
        );

        if (result.queued) {
          console.log('📦 Image message queued successfully:', tempId);
        }
      }

      // Clear chat input
      setChat('');
    } catch (error) {
      console.error('❌ Image upload/send failed:', error);
      Alert.alert('Error', error.message || 'Failed to send image');

      // Remove temp message on error
      setChatData(prev => prev.filter(msg => msg.id !== tempId));
      setImageUploadProgress(prev => {
        const newProgress = {...prev};
        delete newProgress[tempId];
        return newProgress;
      });
    }
  };

  // Upload and send document via socket (OFFLINE-ENABLED)
  const handleDocumentUploadAndSend = async file => {
    const tempId = `temp_doc_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    const timestamp = moment().format();

    try {
      // Create temporary message for immediate UI feedback
      const tempMessage = {
        id: tempId,
        thread_id: thread_id,
        sender_id: userId,
        message_type: 'system',
        messageType: 'file',
        content: chat || '',
        file_url: file.path || file.uri, // Use local path for now
        file_name: file.name || 'document.pdf',
        file_size: file.size || null,
        mime_type: file.type || file.mime || 'application/pdf',
        created_at: timestamp,
        updated_at: timestamp,
        sender_name: 'You',
        sender_avatar: null,
        uploading: isOnline, // Only show uploading if online
        time: formatTime(timestamp),
        isSender: true,
        isRead: false, // Message not read when first sent
      };

      console.log('📤 Adding temp document message:', tempId);
      setChatData(prev => capMessagesForFirstPage([...prev, tempMessage]));

      // Scroll to bottom when document message is sent
      setTimeout(scrollToBottomOnNewMessage, 100);

      let documentUrl = file.path || file.uri; // Default to local path
      let optimisticMessage = tempMessage;

      // Only upload if online
      if (isOnline) {
        setDocumentUploadProgress(prev => ({...prev, [tempId]: 0}));

        console.log('📤 Online: Starting document upload...');
        const uploadRes = await uploadPdf(file, token);

        if (!uploadRes || uploadRes.error || !uploadRes.data?.url) {
          throw new Error(uploadRes?.message || 'Failed to upload document');
        }

        documentUrl = uploadRes.data.url;
        console.log('✅ Document uploaded successfully, URL:', documentUrl);

        // Update temp message with uploaded URL
        optimisticMessage = {
          ...tempMessage,
          uploading: false,
          file_url: documentUrl,
          isDelivered: false,
        };

        setChatData(prev =>
          prev.map(msg => (msg.id === tempId ? optimisticMessage : msg)),
        );

        // Clear document upload progress
        setDocumentUploadProgress(prev => {
          const newProgress = {...prev};
          delete newProgress[tempId];
          return newProgress;
        });
      } else {
        console.log('📴 Offline: Document will be uploaded when online');
        optimisticMessage = {
          ...tempMessage,
          uploading: false,
          isDelivered: false,
        };
        setChatData(prev =>
          prev.map(msg => (msg.id === tempId ? optimisticMessage : msg)),
        );
      }

      // Send message - ONLINE use socket directly, OFFLINE queue it
      const socket = socketRef?.current;

      if (isOnline && socket && socket.connected) {
        // ONLINE: Send directly via socket
        console.log('📤 Sending document message ONLINE via socket:', {
          tempId,
          documentUrl,
        });

        socket.emit('send_message', {
          threadId: thread_id,
          content: '',
          messageType: 'system',
          fileUrl: documentUrl,
          fileName: tempMessage.file_name,
          fileSize: file.size || null,
          mimeType: tempMessage.mime_type,
          tempId: tempId,
        });

        console.log(
          '✅ Document message emitted via socket (will be confirmed by server)',
        );
      } else {
        // OFFLINE: Queue for later sending
        console.log('📴 OFFLINE: Queueing document message for later:', tempId);
        const result = await sendFileMessage(
          documentUrl,
          tempMessage.file_name,
          tempMessage.mime_type,
          tempMessage.mime_type,
          optimisticMessage,
        );

        if (result.queued) {
          console.log('📦 Document message queued successfully:', tempId);
        }
      }

      // Clear chat input
      setChat('');
    } catch (error) {
      console.error('❌ Document upload/send failed:', error);
      Alert.alert('Error', error.message || 'Failed to send document');

      // Remove temp message on error
      setChatData(prev => prev.filter(msg => msg.id !== tempId));
      setDocumentUploadProgress(prev => {
        const newProgress = {...prev};
        delete newProgress[tempId];
        return newProgress;
      });
    }
  };

  const clearUploadedFiles = () => {
    setUploadedImageUrl(null);
    setUploadedFileUrl(null);
    setImagePreview(null);
    setSelectedImageFile(null);
    setSelectedFile(null);
    setIsUploadingImage(false);
    setIsUploadingFile(false);
  };

  // Document Picker Function
  const handleDocumentPick = async () => {
    try {
      const results = await pick({type: [types.pdf, types.allFiles]});
      if (results && results.length > 0) {
        const selectedDoc = results[0];
        console.log('📄 Picked document:', selectedDoc);

        // Directly upload and send the document
        await handleDocumentUploadAndSend(selectedDoc);
      }
    } catch (err) {
      if (err?.code === 'CANCELLED') {
        console.log('Document picker cancelled');
      } else {
        console.error('Document picker error:', err);
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  // --- SEND MESSAGE (OFFLINE-ENABLED) ---
  const handleSendMessage = async () => {
    if (!chat.trim() || !thread_id) return;

    const messageContent = chat.trim();
    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 11)}`;

    setChat(''); // Clear input immediately

    // Create optimistic message for instant UI feedback
    const optimisticMessage = {
      id: tempId,
      message: messageContent,
      time: formatTime(new Date().toISOString()),
      isSender: true,
      isDelivered: false,
      isRead: false, // Message not read when first sent
      senderName: 'You',
      createdAt: new Date().toISOString(),
      messageType: 'text',
      sender_id: userId,
      thread_id: thread_id, // Add thread_id for matching
    };

    // Add to UI immediately (optimistic update)
    dispatch(clearThreadCount({threadId: thread_id}));
    setChatData(prev =>
      capMessagesForFirstPage([...prev, optimisticMessage]),
    );

    // Scroll to bottom when message is sent
    setTimeout(scrollToBottomOnNewMessage, 100);

    try {
      const socket = socketRef?.current;

      // Check if online and socket connected
      if (isOnline && socket && socket.connected) {
        // ONLINE: Send directly via socket
        console.log('📤 Sending message ONLINE via socket:', tempId);

        socket.emit('send_message', {
          threadId: thread_id,
          content: messageContent,
          messageType: 'text',
          tempId: tempId,
        });

        console.log(
          '✅ Message emitted via socket (will be confirmed by server)',
        );
      } else {
        // OFFLINE: Queue for later sending
        console.log('📴 OFFLINE: Queueing message for later:', tempId);
        const result = await sendTextMessage(messageContent, optimisticMessage);

        if (result.queued) {
          console.log('📦 Message queued successfully:', tempId);
        }
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      // Try to queue if online sending failed
      if (!isOnline) {
        await sendTextMessage(messageContent, optimisticMessage);
      }
    }
  };

  // Handle Document Download/Open
  const handleDocumentOpen = async (documentUrl, documentName, mimeType) => {
    if (!documentUrl) {
      Alert.alert('Error', 'Document URL not available');
      return;
    }

    try {
      // Resolve full URL if relative
      const fullUrl =
        documentUrl.startsWith('http://') || documentUrl.startsWith('https://')
          ? documentUrl
          : `${ImgURL}${documentUrl}`;

      console.log('📄 Opening document:', fullUrl);

      // Check if it's an image
      const isImage =
        mimeType?.includes('image/') ||
        documentUrl?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);

      if (isImage) {
        // Open image viewer for images
        console.log('🖼️ Opening image viewer');
        setImageViewerUrl(fullUrl);
        setImageViewerVisible(true);
      } else {
        // Open document viewer for other files
        console.log('📄 Opening document viewer');
        setPdfUrl(fullUrl);
        setPdfViewerVisible(true);
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  // Get file icon based on type
  const getFileIcon = mimeType => {
    if (mimeType?.includes('pdf')) return 'file-pdf-box';
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return 'file-word-box';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet'))
      return 'file-excel-box';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation'))
      return 'file-powerpoint-box';
    if (mimeType?.includes('zip') || mimeType?.includes('compressed'))
      return 'folder-zip';
    return 'file-document';
  };

  const renderMessage = ({item}) => {
    const isImageMessage = item.messageType === 'image';
    const isFileMessage =
      item.messageType === 'file' || item.messageType === 'document';
    const isDocumentMessage = item.messageType === 'system';
    const isAudioMessage =
      item.message_type === 'audio/webm' ||
      item.mime_type === 'audio/webm' ||
      item.messageType === 'audio' ||
      (item.file_url && item.file_url.includes('.webm'));
    // Audio message rendering
    if (isAudioMessage) {
      const isSender = item?.isSender;
      const isPlaying = playingAudio === item.id;
      const isUploading = item.uploading;
      const currentProgress = audioProgress[item.id] || 0;
      const totalDuration = audioDuration[item.id] || 0;
      const progressPercent =
        totalDuration > 0 ? (currentProgress / totalDuration) * 100 : 0;

      // Generate waveform bars (simulate audio waveform)
      const generateWaveformBars = () => {
        const bars = [];
        const barCount = 30;
        for (let i = 0; i < barCount; i++) {
          // Random heights for visual effect (in real app, use actual audio data)
          const height = Math.random() * 20 + 8;
          const isActive = progressPercent > (i / barCount) * 100;
          bars.push(
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: height,
                  backgroundColor: isActive
                    ? isSender
                      ? '#fff'
                      : Colors.darkTheme.primaryColor
                    : isSender
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.2)',
                },
              ]}
            />,
          );
        }
        return bars;
      };

      return (
        <View style={styles.messageContainer}>
          {!item.isSender && (
            <Image
              source={
                item.senderAvatar ? {uri: item.senderAvatar} : Images.artist1
              }
              style={styles.avatarSmall}
              defaultSource={Images.artist1}
            />
          )}
          <View
            style={[
              styles.audioBubble,
              isSender ? styles.senderBubble : styles.receiverBubble,
            ]}>
            <View style={styles.audioContent}>
              <TouchableOpacity
                onPress={() =>
                  !isUploading && playAudio(item.file_url, item.id)
                }
                disabled={isUploading}
                style={[
                  styles.audioPlayButton,
                  isSender && styles.audioPlayButtonSender,
                  isPlaying && styles.audioPlayButtonActive,
                ]}
                activeOpacity={0.7}>
                {isUploading ? (
                  <ActivityIndicator
                    size="small"
                    color={isSender ? Colors.darkTheme.primaryColor : '#fff'}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={isPlaying ? 'pause' : 'play'}
                    size={RFPercentage(2.5)}
                    color={isSender ? Colors.darkTheme.primaryColor : '#fff'}
                  />
                )}
              </TouchableOpacity>

              <View style={styles.audioInfoContainer}>
                {/* Progress Line */}
                <View style={styles.audioProgressLineContainer}>
                  <View
                    style={[
                      styles.audioProgressLineBackground,
                      {
                        backgroundColor: isSender
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(0, 0, 0, 0.15)',
                      },
                    ]}>
                    <View
                      style={[
                        styles.audioProgressLineFill,
                        {
                          width: `${progressPercent}%`,
                          backgroundColor: isSender
                            ? '#fff'
                            : Colors.darkTheme.primaryColor,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Time Display */}
                <View style={styles.audioTimeContainer}>
                  <MaterialCommunityIcons
                    name="microphone"
                    size={Math.round(RFPercentage(1.4))}
                    color={
                      isSender ? '#fff' : Colors.darkTheme.primaryTextColor
                    }
                    style={{opacity: 0.7}}
                  />
                  <Text
                    style={[
                      styles.audioDurationText,
                      {
                        color: isSender
                          ? '#fff'
                          : isDarkMode
                          ? Colors.darkTheme.primaryTextColor
                          : Colors.lightTheme.primaryTextColor,
                      },
                    ]}>
                    {isUploading
                      ? 'Uploading...'
                      : isPlaying && audioProgress[item.id]
                      ? formatAudioTime(audioProgress[item.id])
                      : audioDuration[item.id]
                      ? formatAudioTime(audioDuration[item.id])
                      : '0:00'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.audioTimeStampContainer}>
              <Text
                style={[
                  styles.timeText,
                  isSender ? styles.senderTimeText : styles.receiverTimeText,
                ]}>
                {item.time}
              </Text>
              {item.error && (
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={RFPercentage(2)}
                  color={Colors.error}
                  style={styles.errorIcon}
                />
              )}
            </View>
          </View>
        </View>
      );
    }

    // Render Document Message
    const renderDocumentMessage = (messageItem, isSender) => {
      const isUploading = messageItem.uploading;
      const uploadProgress = documentUploadProgress[messageItem.id] || 0;
      const isDownloading = downloadingDocuments[messageItem.file_url];

      return (
        <TouchableOpacity
          style={[
            styles.documentContainer,
            isSender ? styles.senderDocument : styles.receiverDocument,
          ]}
          onPress={() =>
            handleDocumentOpen(
              messageItem.file_url,
              messageItem.file_name,
              messageItem.mime_type || messageItem.file_type,
            )
          }
          disabled={isUploading || isDownloading}>
          {/* Document Icon and Info */}
          <View style={styles.documentInfoContainer}>
            <MaterialCommunityIcons
              name={getFileIcon(messageItem.mime_type || messageItem.file_type)}
              size={RFPercentage(4)}
              color={
                isSender
                  ? Colors.lightTheme.backgroundColor
                  : Colors.darkTheme.primaryColor
              }
            />

            <View style={styles.documentDetails}>
              <Text
                style={[
                  styles.documentName,
                  isSender && styles.senderDocumentText,
                ]}
                numberOfLines={1}>
                {messageItem.file_name ||
                  messageItem?.file_url?.split('/').pop() ||
                  'Document'}
              </Text>

              <View style={styles.documentMeta}>
                <Text
                  style={[
                    styles.documentSize,
                    isSender && styles.senderDocumentMeta,
                  ]}>
                  PDF
                </Text>
                <Text
                  style={[
                    styles.documentType,
                    isSender && styles.senderDocumentMeta,
                  ]}>
                  •{' '}
                  {messageItem.mime_type
                    ? messageItem.mime_type.split('/').pop()?.toUpperCase()
                    : 'FILE'}
                </Text>
              </View>
            </View>
          </View>

          {isDownloading && (
            <ActivityIndicator
              size="small"
              color={isSender ? '#fff' : Colors.darkTheme.primaryColor}
              style={styles.downloadIndicator}
            />
          )}
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.messageContainer}>
        {!item.isSender && (
          <Image
            source={
              item.senderAvatar ? {uri: item.senderAvatar} : Images.artist1
            }
            style={styles.avatarSmall}
            defaultSource={Images.artist1}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            item.isSender ? styles.senderBubble : styles.receiverBubble,
          ]}>
          {!item.isSender && (
            <Text style={styles.senderName}>
              {item.senderName ? item.senderName : userName}
            </Text>
          )}

          {/* Document Message */}
          {(isFileMessage || isDocumentMessage) &&
            renderDocumentMessage(item, item.isSender)}

          {/* Image Message */}
          {isImageMessage ? (
            <TouchableOpacity
              onPress={() => {
                if (item.file_url && !item.uploading) {
                  const fullUrl =
                    item.file_url.startsWith('http://') ||
                    item.file_url.startsWith('https://')
                      ? item.file_url
                      : `${ImgURL}${item.file_url}`;
                  setImageViewerUrl(fullUrl);
                  setImageViewerVisible(true);
                }
              }}
              disabled={item.uploading}>
              <Image
                source={{uri: item.file_url}}
                style={styles.messageImage}
                resizeMode="cover"
              />
              {item.uploading && (
                <View style={styles.imageUploadOverlay}>
                  <ActivityIndicator
                    size="large"
                    color={Colors.lightTheme.backgroundColor}
                  />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
              {item.message && item.message !== 'File shared' && (
                <Text
                  style={[
                    styles.messageText,
                    item.isSender ? styles.senderText : styles.receiverText,
                  ]}>
                  {item.message}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            // Text Message
            item.message &&
            !isFileMessage &&
            !isDocumentMessage && (
              <Text
                style={[
                  styles.messageText,
                  item.isSender ? styles.senderText : styles.receiverText,
                ]}>
                {item.message}
              </Text>
            )
          )}

          <View
            style={[
              styles.timeContainer,
              item.isSender
                ? styles.senderTimeContainer
                : styles.receiverTimeContainer,
            ]}>
            <Text
              style={[
                styles.timeText,
                item.isSender ? styles.senderTimeText : styles.receiverTimeText,
              ]}>
              {item.time}
            </Text>

            {/* Message Status Indicator */}
            {item.isSender &&
              (() => {
                const messageStatus = getMessageStatus(item.id);
                if (messageStatus === 'queued') {
                  return (
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={RFPercentage(1.8)}
                      color={item.isSender ? 'rgba(255,255,255,0.7)' : '#999'}
                      style={{marginLeft: wp(1)}}
                    />
                  );
                } else if (messageStatus === 'sending') {
                  return (
                    <ActivityIndicator
                      size="small"
                      color={item.isSender ? 'rgba(255,255,255,0.7)' : '#999'}
                      style={{
                        marginLeft: wp(1),
                        width: RFPercentage(1.8),
                        height: RFPercentage(1.8),
                      }}
                    />
                  );
                } else if (messageStatus === 'failed') {
                  return (
                    <TouchableOpacity onPress={() => triggerSync()}>
                      <MaterialCommunityIcons
                        name="alert-circle"
                        size={RFPercentage(2)}
                        color={Colors.error}
                        style={{marginLeft: wp(1)}}
                      />
                    </TouchableOpacity>
                  );
                } else {
                  // Message delivered successfully - show read status
                  console.log('📖 Rendering message status:', {
                    messageId: item.id,
                    isRead: item.isRead,
                    isDelivered: item.isDelivered,
                    isSender: item.isSender,
                  });

                  if (item.isRead) {
                    // Double blue tick - message seen
                    console.log(
                      '📖 ✅ Rendering DOUBLE blue ticks for message:',
                      item.id,
                    );
                    return (
                      <View style={{flexDirection: 'row', marginLeft: wp(1)}}>
                        <MaterialCommunityIcons
                          name="check-all"
                          size={RFPercentage(1.8)}
                          color="#4ae24aff"
                          style={{marginRight: -3}}
                        />
                      </View>
                    );
                  } else if (item.isDelivered) {
                    return (
                      <MaterialCommunityIcons
                        name="check"
                        size={RFPercentage(1.8)}
                        color="rgba(255, 255, 255, 0.7)"
                        style={{marginLeft: wp(1)}}
                      />
                    );
                  }
                }
                return null;
              })()}

            {item.error && (
              <MaterialCommunityIcons
                name="alert-circle"
                size={RFPercentage(2)}
                color={Colors.error}
                style={styles.errorIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator
          size="large"
          color={
            isDarkMode
              ? Colors.darkTheme.primaryColor
              : Colors.lightTheme.primaryColor
          }
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          onPress={fetchChatMessages}
          style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : hp(3.5)}>
      {/* Network Status Bar */}
      <NetworkStatusBar
        isOnline={isOnline}
        queuedCount={queuedCount}
        onRetryPress={triggerSync}
        isDarkMode={isDarkMode}
      />

      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <MaterialCommunityIcons
            name={'chevron-left'}
            onPress={() => navigation.goBack()}
            size={RFPercentage(5)}
            color={
              isDarkMode
                ? Colors.darkTheme.primaryTextColor
                : Colors.lightTheme.primaryTextColor
            }
          />
          <Pressable
            style={{flexDirection: 'row', alignItems: 'center'}}
            // onPress={() =>
            //   navigation.navigate(SCREENS.CHATPROFILESCREEN, {
            //     user: {name: userName, avatar: userAvatar},
            //   })
            // }
          >
            {!headerImageError && userAvatar ? (
              <Image
                source={{uri: userAvatar}}
                style={styles.avatar}
                onError={() => setHeaderImageError(true)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={wp(12)}
                  color={
                    isDarkMode
                      ? Colors.darkTheme.secondryTextColor
                      : Colors.lightTheme.secondryTextColor
                  }
                />
              </View>
            )}
            <View>
              <Text style={styles.screenHeading}>
                {userName || t('Unknown User')}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {otherUserOnline && (
                  <View
                    accessible={false}
                    style={styles.onlineDot}
                    testID="other-user-online-dot"
                  />
                )}
                {other_user_id && (
                  <Text
                    style={[
                      {marginLeft: wp(2), fontSize: RFPercentage(1.6)},
                      otherUserOnline ? {color: '#4CD964'} : {color: '#888'},
                    ]}>
                    {getOtherUserStatusText()}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={chatData}
            renderItem={renderMessage}
            keyExtractor={(item, index) => {
              // Ensure unique keys by combining ID with index as fallback
              const baseKey = item.id || `msg_${index}`;
              const uniqueKey = `${baseKey}_${index}`;
              return uniqueKey;
            }}
            extraData={chatData}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => {
              userScrollStartedRef.current = true;
            }}
            onMomentumScrollBegin={() => {
              userScrollStartedRef.current = true;
            }}
            onScroll={handleScrollEnhanced}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleLayoutChange}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator
                    size="small"
                    color={
                      isDarkMode
                        ? Colors.darkTheme.primaryColor
                        : Colors.lightTheme.primaryColor
                    }
                  />
                  <Text style={styles.loadMoreText}>
                    Loading previous messages...
                  </Text>
                </View>
              ) : null
            }
            inverted={false}
          />
        </View>

        {/* Recording UI - shown when recording */}
        {isRecording ? (
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: '#f8d7da', borderRadius: 25},
            ]}>
            <TouchableOpacity
              onPress={cancelRecording}
              style={styles.iconWrapper}>
              <MaterialCommunityIcons name="close" size={24} color="#FF3B30" />
            </TouchableOpacity>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MaterialCommunityIcons
                name="microphone"
                size={20}
                color="#FF3B30"
              />
              <Text
                style={{marginLeft: 8, color: '#FF3B30', fontWeight: 'bold'}}>
                {t('Recording...')} {formatAudioTime(recordingTime * 1000)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={stopRecording}
              style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name="send"
                size={24}
                color={Colors.darkTheme.primaryColor}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => CameraBottomSheetRef.current?.open()}
              style={styles.iconWrapper}>
              <Svgs.plusBlue />
            </TouchableOpacity>

            {/* Document Picker Button */}
            <TouchableOpacity
              onPress={handleDocumentPick}
              style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={22}
                color={Colors.darkTheme.primaryColor}
              />
            </TouchableOpacity>

            <TxtInput
              value={chat}
              onChangeText={setChat}
              placeholder={t('Write message...')}
              style={styles.input}
              containerStyle={{
                marginBottom: 0,
                borderWidth: 0,
                paddingHorizontal: wp('2.5%'),
                borderRadius: wp(6),
                backgroundColor: isDarkMode
                  ? Colors.darkTheme.input
                  : Colors.lightTheme.backgroundColor,
              }}
              multiline
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            {chat.trim() ? (
              <TouchableOpacity
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: Colors.darkTheme.primaryColor,
                  },
                ]}
                onPress={handleSendMessage}
                disabled={!chat.trim()}>
                <Svgs.sendWhite />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.iconWrapper}
                onPress={startRecording}>
                <MaterialCommunityIcons
                  name="microphone"
                  size={24}
                  color={Colors.darkTheme.primaryColor}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        <CameraBottomSheet
          refRBSheet={CameraBottomSheetRef}
          onPick={handleFileSelect}
          includeDocuments={true}
          cameraType={'back'}
        />

        {/* Image Viewer Modal */}
        <Modal
          visible={imageViewerVisible}
          transparent={true}
          onRequestClose={() => setImageViewerVisible(false)}>
          <ImageViewer
            imageUrls={[{url: imageViewerUrl || ''}]}
            enableSwipeDown={true}
            onSwipeDown={() => setImageViewerVisible(false)}
            onCancel={() => setImageViewerVisible(false)}
            saveToLocalByLongPress={false}
            menuContext={{
              saveToLocal: t('Save to gallery'),
              cancel: t('Cancel'),
            }}
            backgroundColor="rgba(0, 0, 0, 0.95)"
            renderHeader={() => (
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={() => setImageViewerVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={RFPercentage(4)}
                  color={Colors.lightTheme.backgroundColor}
                />
              </TouchableOpacity>
            )}
            loadingRender={() => (
              <ActivityIndicator
                size="large"
                color={Colors.lightTheme.backgroundColor}
              />
            )}
            enableImageZoom={true}
            doubleClickInterval={250}
            maxOverflow={300}
          />
        </Modal>

        {/* PDF Viewer Modal */}
        <Modal
          visible={pdfViewerVisible}
          animationType="slide"
          onRequestClose={() => setPdfViewerVisible(false)}>
          <View style={styles.pdfModalContainer}>
            <View style={styles.pdfToolbar}>
              <TouchableOpacity
                onPress={() => setPdfViewerVisible(false)}
                style={styles.pdfToolbarButton}>
                <MaterialCommunityIcons
                  name="close"
                  size={RFPercentage(3)}
                  color={Colors.lightTheme.backgroundColor}
                />
              </TouchableOpacity>
              <Text style={styles.pdfPageText}>{t('Document Viewer')}</Text>
            </View>
            {pdfUrl && (
              <WebView
                source={{
                  uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                    pdfUrl,
                  )}`,
                }}
                style={styles.pdfViewer}
                startInLoadingState={true}
                scalesPageToFit={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                renderLoading={() => (
                  <View style={styles.webViewLoader}>
                    <ActivityIndicator
                      size="large"
                      color={Colors.darkTheme.primaryColor}
                    />
                    <Text style={styles.loadingText}>
                      {t('Loading document...')}
                    </Text>
                  </View>
                )}
                onError={syntheticEvent => {
                  const {nativeEvent} = syntheticEvent;
                  console.error('WebView error: ', nativeEvent);
                  Alert.alert('Error', 'Failed to load document');
                }}
              />
            )}
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

// Wrap Conversation with an ErrorBoundary to prevent a full app crash
class ConversationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }

  componentDidCatch(error, info) {
    console.error('ConversationErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: '#999'}}>
            Something went wrong in Conversation.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ConversationWithBoundary(props) {
  return (
    <ConversationErrorBoundary>
      <Conversation {...props} />
    </ConversationErrorBoundary>
  );
}

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    centerContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: wp(3),
      paddingBottom: hp(1),
      borderBottomWidth: 0.5,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    screenHeading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(2),
      fontWeight: '600',
    },
    avatar: {
      width: wp(12),
      height: wp(12),
      borderRadius: wp(61),
    },
    avatarPlaceholder: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      overflow: 'hidden',
    },
    avatarSmall: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      marginRight: wp(2),
    },
    chatContainer: {
      flex: 1,
    },
    chatList: {
      flex: 1,
      paddingHorizontal: wp(4),
    },
    chatContent: {
      paddingVertical: hp(2),
    },
    messageContainer: {
      marginVertical: hp(0.5),
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    messageBubble: {
      maxWidth: '70%',
      borderRadius: wp(4),
      padding: wp(3),
    },
    senderBubble: {
      backgroundColor: Colors.darkTheme.primaryColor,
      alignSelf: 'flex-end',
      marginLeft: 'auto',
    },
    receiverBubble: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      alignSelf: 'flex-start',
    },
    senderName: {
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
      fontWeight: '600',
    },
    messageText: {
      fontSize: RFPercentage(pxToPercentage(13)),
      lineHeight: RFPercentage(2.8),
    },
    senderText: {
      color: '#fff',
    },
    receiverText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    messageImage: {
      width: wp(60),
      height: wp(60),
      borderRadius: wp(2),
      marginBottom: hp(0.5),
    },
    imageUploadOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: wp(2),
    },
    uploadingText: {
      color: Colors.lightTheme.backgroundColor,
      fontSize: RFPercentage(pxToPercentage(12)),
      marginTop: hp(1),
      fontWeight: '500',
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontWeight: '600',
      marginBottom: hp(0.2),
    },
    fileType: {
      fontSize: RFPercentage(pxToPercentage(10)),
      color: '#666',
      textTransform: 'uppercase',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: hp(0.5),
    },
    timeText: {
      fontSize: RFPercentage(pxToPercentage(11)),
    },
    senderTimeText: {
      color: '#fff',
    },
    receiverTimeText: {
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    senderTimeContainer: {
      alignSelf: 'flex-end',
    },
    receiverTimeContainer: {
      alignSelf: 'flex-start',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(0.6),
      paddingHorizontal: wp(1.5),
      marginHorizontal: wp(3),
      marginBottom: hp(0.8),
      borderRadius: wp(100),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.secondryColor
      //   : Colors.lightTheme.secondryColor,
    },
    iconWrapper: {
      padding: wp(1.9),
      marginHorizontal: wp(0.3),
      borderRadius: wp(100),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    input: {
      flex: 1,
      marginHorizontal: wp(1.4),
      maxHeight: hp(10),
    },
    uploadStatusContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#F8F9FA',
    },
    uploadStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(2),
      borderRadius: wp(2),
      backgroundColor: isDarkMode ? Colors.darkTheme.input : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E8F4FD',
    },
    uploadStatusText: {
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#666',
      marginLeft: wp(2),
      flex: 1,
    },
    imagePreview: {
      width: wp(40),
      height: wp(40),
      borderRadius: wp(2),
      marginTop: hp(1),
      alignSelf: 'center',
    },
    errorText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: Colors.error,
      marginBottom: hp(2),
    },
    retryButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: wp(2),
    },
    retryText: {
      color: '#fff',
    },
    errorIcon: {
      marginLeft: wp(1),
    },
    // Document Message Styles
    documentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      borderRadius: wp(3),
      padding: wp(3),
      marginVertical: hp(0.5),
      minWidth: wp(60),
      maxWidth: wp(70),
    },
    senderDocument: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    receiverDocument: {
      backgroundColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    documentInfoContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    documentDetails: {
      flex: 1,
      marginLeft: wp(2),
    },
    documentName: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    senderDocumentText: {
      color: Colors.lightTheme.backgroundColor,
    },
    documentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: hp(0.2),
    },
    documentSize: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.3),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    senderDocumentMeta: {
      color: 'rgba(255,255,255,0.7)',
    },
    documentType: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.3),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginLeft: wp(1),
    },
    downloadIndicator: {
      marginLeft: wp(2),
    },
    pdfModalContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? Colors.darkTheme.backgroundColor : '#fff',
    },
    pdfToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      backgroundColor: Colors.darkTheme.primaryColor,
      justifyContent: 'space-between',
    },
    pdfToolbarButton: {
      padding: wp(2),
    },
    pdfPageText: {
      flex: 1,
      textAlign: 'center',
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: Colors.lightTheme.backgroundColor,
    },
    pdfViewer: {
      flex: 1,
      width: '100%',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    webViewLoader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    loadingText: {
      marginTop: hp(2),
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    // Audio Message Styles
    audioBubble: {
      maxWidth: '80%',
      borderRadius: wp(4),
      padding: wp(3),
      paddingVertical: wp(2.5),
      minWidth: wp(60),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    audioContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
    },
    audioPlayButton: {
      width: wp(11),
      height: wp(11),
      borderRadius: wp(5.5),
      backgroundColor: Colors.darkTheme.primaryColor,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    audioPlayButtonSender: {
      backgroundColor: '#fff',
    },
    audioPlayButtonActive: {
      transform: [{scale: 0.95}],
    },
    audioInfoContainer: {
      flex: 1,
      gap: wp(1.5),
    },
    audioProgressLineContainer: {
      width: '100%',
      marginTop: hp(0.3),
    },
    audioProgressLineBackground: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
    },
    audioProgressLineFill: {
      height: '100%',
      borderRadius: 2,
      minWidth: 4,
    },
    audioTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
      alignSelf: 'flex-end',
    },
    audioDurationText: {
      fontSize: RFPercentage(1.5),
      opacity: 0.8,
      fontFamily: Fonts.PoppinsRegular,
    },
    audioTimeStampContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: hp(0.5),
    },
    recordingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderTopWidth: 0.5,
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    recordingCancelButton: {
      padding: wp(2),
    },
    recordingContent: {
      flex: 1,
      marginHorizontal: wp(3),
    },
    recordingWaveform: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
      marginBottom: hp(0.5),
    },
    recordingText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      color: '#FF3B30',
    },
    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      height: 30,
    },
    recordingBar: {
      width: 1,
      backgroundColor: '#ff3030ff',
      borderRadius: 2,
      flex: 1,
    },
    recordingSendButton: {
      padding: wp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor + '20'
        : Colors.lightTheme.primaryColor + '20',
      borderRadius: wp(8),
      width: wp(12),
      height: wp(12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    microphoneButton: {
      marginTop: 6,
      padding: wp(2),
    },
    // Image Viewer Modal Styles
    imageViewerCloseButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? hp(6) : hp(3),
      right: wp(5),
      zIndex: 999,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: wp(10),
      padding: wp(3),
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    onlineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#4CD964',
      marginLeft: wp(2),
      marginTop: hp(0.3),
    },
    // Load more indicator styles
    loadMoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: wp(3),
      gap: wp(2),
    },
    loadMoreText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    loadMoreButton: {
      padding: wp(3),
      margin: wp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    loadMoreButtonText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(13)),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
  });
