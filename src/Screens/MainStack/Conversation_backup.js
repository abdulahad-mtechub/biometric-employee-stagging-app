import {pick, types} from '@react-native-documents/picker';
import {useFocusEffect} from '@react-navigation/native';
import moment from 'moment';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch, useSelector} from 'react-redux';
import {io} from 'socket.io-client';
import {Images} from '../../assets/Images/Images';
import {Svgs} from '../../assets/Svgs/Svgs';
import CameraBottomSheet from '../../components/BottomSheets/CameraBottomSheet';
import TxtInput from '../../components/TextInput/Txtinput';
import {
  getMessagebyThread,
  markAllAsRead,
  uploadImage,
  uploadPdf,
} from '../../Constants/api';
import {ImgURL} from '../../Constants/Base_URL';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {
  clearThreadCount,
  incrementThreadCount,
} from '../../redux/Slices/MessageCountSlice';
import {pxToPercentage} from '../../utils/responsive';

const Conversation = ({navigation, route}) => {
  const {thread_id, userName, userAvatar, other_user_id} = route?.params || {};
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const dispatch = useDispatch();
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
  const [document, setDocument] = useState(null);
  const [documentUploadProgress, setDocumentUploadProgress] = useState({});
  const [downloadingDocuments, setDownloadingDocuments] = useState({});
  const userId = useSelector(state => state?.auth?.user?.worker?.id);
  const token = useSelector(state => state?.auth?.user?.token);
  const CameraBottomSheetRef = useRef(null);
  const flatListRef = useRef();
  const threadIdRef = useRef(thread_id);
  const userIdRef = useRef(userId);
  const socketRef = useRef(null);

  useEffect(() => {
    threadIdRef.current = thread_id;
    userIdRef.current = userId;
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
      return {
        id: data.id?.toString() || `temp_${Date.now()}`,
        message: data.content,
        time: formatTime(data.created_at || new Date().toISOString()),
        isSender: data.sender_id === (socketUserId || userIdRef.current),
        isDelivered: true,
        senderName: data.sender_name || 'Unknown',
        senderAvatar: data.sender_avatar,
        messageType: data.message_type || 'text',
        createdAt: data.created_at || new Date().toISOString(),
        file_url: data.file_url,
        file_name: data.file_name,
        file_type: data.file_type,
        sender_id: data.sender_id,
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

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Use documented socket config
    const socket = io(ImgURL, {
      auth: {token},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    // On connect, authenticate
    const handleConnect = () => {
      console.log('🔌 Socket connected successfully');
      setIsConnected(true);
      socket.emit('authenticate', {token});
    };

    // On authenticated, join user room and thread room
    const handleAuthenticated = data => {
      console.log('✅ Socket authentication successful:', data);
      if (data.success && data.user) {
        setSocketUserId(data.user.id);
        console.log('🔑 Socket user ID set:', data.user.id);

        // Join thread room after authentication
        if (thread_id && socket.connected) {
          console.log('🚀 Joining thread room after auth:', thread_id);
          socket.emit('join_thread_room', thread_id);
        }
      }
    };

    // Listen for documented message events
    const handleIncomingMessage = (data, eventName) => {
      console.log(`📩 [${eventName}] Socket message received:`, data);
      const incomingThreadId = data.threadId || data.thread_id;
      const message = data.message || data;
      const currentThreadId = parseInt(threadIdRef.current);

      if (parseInt(incomingThreadId) !== currentThreadId) {
        console.log(
          '🚫 Ignoring message from different thread:',
          incomingThreadId,
        );
        dispatch(
          incrementThreadCount({
            threadId: incomingThreadId,
            timestamp: message.created_at || new Date().toISOString(),
          }),
        );
        return;
      }

      try {
        const newMessage = transformMessage(message);
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
          return updatedMessages;
        });

        // Clear count for current thread
        dispatch(clearThreadCount({threadId: currentThreadId}));
      } catch (error) {
        console.error('❌ Error processing socket message:', error);
      }
    };

    // Message sent confirmation (optimistic UI)
    const handleMessageSent = data => {
      console.log('✅ Message sent confirmation:', data);
      if (data.message && data.tempId) {
        setChatData(prev =>
          prev.map(msg =>
            msg.id === data.tempId
              ? {...transformMessage(data.message), isDelivered: true}
              : msg,
          ),
        );
      }
    };

    const handleDisconnect = reason => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    };

    const handleConnectError = error => {
      console.log('❌ Socket connection error:', error);
      setIsConnected(false);
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('authenticated', handleAuthenticated);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('message_sent', handleMessageSent);

    // Listen to all message events
    ['new_message', 'receive_message', 'new_image_message'].forEach(event => {
      socket.on(event, data => handleIncomingMessage(data, event));
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
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

  // Join thread room when connected and thread_id is available
  useEffect(() => {
    if (isConnected && thread_id && socketRef.current) {
      console.log('🚀 Joining thread room:', thread_id);
      socketRef.current.emit('join_thread_room', thread_id);
    }
  }, [isConnected, thread_id]);

  // --- FETCH MESSAGES (per docs) ---
  const fetchChatMessages = useCallback(async () => {
    try {
      setLoading(true);
      // Use documented API endpoint/structure
      const response = await getMessagebyThread(thread_id, token);
      if (response.error) throw new Error(response.message);
      const transformedMessages = response.data.messages.map(message => ({
        id: message.id.toString(),
        message: message.content,
        time: formatTime(message.created_at),
        isSender: message.sender_id === userId,
        isDelivered: true,
        senderName: message.sender_name,
        senderAvatar: message.sender_avatar,
        messageType: message.message_type || 'text',
        createdAt: message.created_at,
        file_url: message.file_url,
        file_name: message.file_name,
        file_type: message.file_type,
        sender_id: message.sender_id,
      }));
      setChatData(transformedMessages);
      setError(null);
      setTimeout(scrollToBottom, 200);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to load messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- MARK AS READ (per docs) ---
  const markMessagesAsRead = async () => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('mark_read', {threadId: thread_id});
      }
      await markAllAsRead(thread_id, token);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Document Picker Function
  const handleDocumentPick = async () => {
    try {
      const results = await pick({type: [types.pdf, types.allFiles]});
      if (results && results.length > 0) {
        const selectedDoc = results[0];
        console.log('Picked doc:', selectedDoc);

        // selectedDoc has fields like uri, name, size, type
        setDocument(selectedDoc);
        handleSendDocumentMessage(selectedDoc);
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

  // --- SEND MESSAGE (per docs) ---
  const handleSendMessage = async () => {
    if ((!chat.trim() && !uploadedImageUrl && !uploadedFileUrl) || !thread_id)
      return;

    let messageContent = chat.trim() || 'File shared';
    let messageType = 'text';
    let fileUrl = null,
      fileName = null,
      fileType = null;

    if (uploadedFileUrl) {
      messageType = 'pdf';
      fileUrl = uploadedFileUrl;
      fileName = selectedFile?.name;
      fileType = selectedFile?.type;
    } else if (uploadedImageUrl) {
      messageType = 'image';
      fileUrl = uploadedImageUrl;
      fileName = selectedImageFile?.name;
      fileType = selectedImageFile?.type;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      Alert.alert(
        'Connection Error',
        'Please check your connection and try again.',
      );
      return;
    }

    const tempId = `temp_${Date.now()}`;
    setChat('');

    // Optimistic UI
    const optimisticMessage = {
      id: tempId,
      message: messageContent,
      time: formatTime(new Date().toISOString()),
      isSender: true,
      isDelivered: false,
      senderName: 'You',
      createdAt: new Date().toISOString(),
      messageType,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      sender_id: userId,
    };
    dispatch(clearThreadCount({threadId: thread_id}));
    setChatData(prev => [...prev, optimisticMessage]);
    clearUploadedFiles();

    try {
      // Use documented socket event and structure
      const messageData = {
        threadId: parseInt(thread_id),
        content: messageContent,
        messageType,
        tempId,
        ...(fileUrl && {fileUrl}),
        ...(fileName && {fileName}),
        ...(fileType && {fileType}),
      };
      socketRef.current.emit('send_message', messageData);
      setIsUploadingImage(false);
    } catch (err) {
      setChatData(prev =>
        prev.map(msg =>
          msg.id === tempId ? {...msg, error: true, isDelivered: false} : msg,
        ),
      );
      Alert.alert('Error', 'Failed to send message: ' + err.message);
    }
  };

  // --- SEND DOCUMENT MESSAGE (per docs) ---
  const handleSendDocumentMessage = async (doc = null) => {
    const documentToSend = doc || document;
    if (!documentToSend || !thread_id) return;

    const tempId = `temp_doc_${Date.now()}`;
    const timestamp = moment().format();

    // Optimistic UI
    const tempMessage = {
      id: tempId,
      thread_id: thread_id,
      sender_id: userId,
      message_type: 'pdf',
      content: chat || '',
      file_url: documentToSend.uri,
      file_name: documentToSend.name || 'document.pdf',
      file_size: documentToSend.size || null,
      mime_type: documentToSend.type || 'application/pdf',
      is_edited: false,
      edited_at: null,
      is_deleted: false,
      deleted_at: null,
      created_at: timestamp,
      updated_at: timestamp,
      sender_name: 'You',
      sender_avatar: null,
      read_by_user: [],
    };

    setChatData(prev => [...prev, tempMessage]);
    setDocumentUploadProgress(prev => ({...prev, [tempId]: 0}));

    try {
      // Upload document (API should return file URL)
      const uploaded = await uploadPdf(documentToSend, token);
      const uploadedUrl = uploaded?.data?.url;
      if (!uploadedUrl) throw new Error('Document upload failed');

      // Send message via socket (per docs)
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          threadId: thread_id,
          content: chat || '',
          messageType: 'pdf',
          tempId,
          fileUrl: uploadedUrl,
          fileName: documentToSend.name,
          fileType: documentToSend.type,
        });
      }

      setChatData(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? {
                ...msg,
                uploading: false,
                file_url: uploadedUrl,
              }
            : msg,
        ),
      );
      setDocumentUploadProgress(prev => {
        const newProgress = {...prev};
        delete newProgress[tempId];
        return newProgress;
      });
      setDocument(null);
      setChat('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send document');
      setChatData(prev => prev.filter(msg => msg.id !== tempId));
      setDocumentUploadProgress(prev => {
        const newProgress = {...prev};
        delete newProgress[tempId];
        return newProgress;
      });
    }
  };

  // --- MESSAGE TRANSFORM (per docs) ---
  const transformMessage = useCallback(
    data => {
      // Accepts message object from socket or API
      return {
        id: data.id?.toString() || `temp_${Date.now()}`,
        message: data.content,
        time: formatTime(data.created_at || new Date().toISOString()),
        isSender: data.sender_id === (socketUserId || userIdRef.current),
        isDelivered: true,
        senderName: data.sender_name || 'Unknown',
        senderAvatar: data.sender_avatar,
        messageType: data.message_type || 'text',
        createdAt: data.created_at || new Date().toISOString(),
        file_url: data.file_url,
        file_name: data.file_name,
        file_type: data.file_type,
        sender_id: data.sender_id,
      };
    },
    [formatTime, socketUserId],
  );

  // Handle Document Download/Open
  const handleDocumentOpen = async (documentUrl, documentName) => {
    try {
      setDownloadingDocuments(prev => ({...prev, [documentUrl]: true}));

      // Check if we can open the URL directly
      const supported = await Linking.canOpenURL(documentUrl);

      if (supported) {
        await Linking.openURL(documentUrl);
      } else {
        Alert.alert(
          'Cannot Open Document',
          `Unable to open ${documentName}. Please make sure you have a PDF reader app installed.`,
          [{text: 'OK'}],
        );
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    } finally {
      setDownloadingDocuments(prev => ({...prev, [documentUrl]: false}));
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
  // Initialize socket connection - FIXED VERSION
  const initializeSocket = useCallback(() => {
    if (!token) {
      console.log('❌ No token available for socket connection');
      return;
    }

    console.log('🔄 Initializing socket connection...');

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Initialize new socket with same config as web
    const socket = io(ImgURL, {
      auth: {token},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    // Socket event handlers - ADD ALL MESSAGE TYPES LIKE WEB VERSION
    const handleConnect = () => {
      console.log('🔌 Socket connected successfully');
      setIsConnected(true);

      // Authenticate socket
      console.log('🔐 Authenticating socket with token...');
      socket.emit('authenticate', {token});
    };

    const handleAuthenticated = data => {
      console.log('✅ Socket authentication successful:', data);
      if (data.success && data.user) {
        setSocketUserId(data.user.id);
        console.log('🔑 Socket user ID set:', data.user.id);

        // Join thread room after authentication
        if (thread_id && socket.connected) {
          console.log('🚀 Joining thread room after auth:', thread_id);
          socket.emit('join_thread_room', thread_id);
        }
      }
    };

    // Handle incoming messages - LISTEN TO ALL EVENTS LIKE WEB VERSION
    const handleIncomingMessage = (data, eventName) => {
      console.log(`📩 [${eventName}] Socket message received:`, data);

      const incomingThreadId = data.threadId || data.thread_id;
      const currentThreadId = parseInt(threadIdRef.current);

      if (parseInt(incomingThreadId) !== currentThreadId) {
        console.log(
          '🚫 Ignoring message from different thread:',
          incomingThreadId,
        );

        // INCREMENT COUNT FOR OTHER THREADS
        dispatch(
          incrementThreadCount({
            threadId: incomingThreadId,
            timestamp: data.created_at || new Date().toISOString(),
          }),
        );

        return;
      }

      try {
        const newMessage = transformMessage(data);
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
          return updatedMessages;
        });

        // FIXED: Proper count handling
        const isOwnMessage =
          newMessage.sender_id === (socketUserId || userIdRef.current);

        if (isOwnMessage) {
          // For own messages, clear count in current thread
          dispatch(clearThreadCount({threadId: currentThreadId}));
        } else {
          // For received messages, clear count since we're reading them
          dispatch(clearThreadCount({threadId: currentThreadId}));
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
          prev.map(msg =>
            msg.id === data.tempId
              ? {...transformMessage(data.message), isDelivered: true}
              : msg,
          ),
        );
      }
    };

    const handleDisconnect = reason => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    };

    const handleConnectError = error => {
      console.log('❌ Socket connection error:', error);
      setIsConnected(false);
    };

    // Register event listeners - SAME AS WEB VERSION
    socket.on('connect', handleConnect);
    socket.on('authenticated', handleAuthenticated);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('message_sent', handleMessageSent);

    // Listen to all message events like web version
    ['new_message', 'receive_message', 'new_image_message'].forEach(event => {
      socket.on(event, data => handleIncomingMessage(data, event));
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, thread_id, transformMessage, dispatch]);

  // Join thread room when connected and thread_id is available
  useEffect(() => {
    if (isConnected && thread_id && socketRef.current) {
      console.log('🚀 Joining thread room:', thread_id);
      socketRef.current.emit('join_thread_room', thread_id);
    }
  }, [isConnected, thread_id]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (flatListRef?.current && chatData?.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [chatData]);

  useEffect(() => {
    scrollToBottom();
  }, [chatData, scrollToBottom]);

  // Fetch chat messages on focus
  useFocusEffect(
    useCallback(() => {
      if (thread_id) {
        fetchChatMessages();
        markMessagesAsRead();
      }
    }, [thread_id, token, userId]),
  );

  const fetchChatMessages = async () => {
    try {
      setLoading(true);
      // Use documented API endpoint/structure
      const response = await getMessagebyThread(thread_id, token);
      if (response.error) throw new Error(response.message);
      const transformedMessages = response.data.messages.map(message => ({
        id: message.id.toString(),
        message: message.content,
        time: formatTime(message.created_at),
        isSender: message.sender_id === userId,
        isDelivered: true,
        senderName: message.sender_name,
        senderAvatar: message.sender_avatar,
        messageType: message.message_type || 'text',
        createdAt: message.created_at,
        file_url: message.file_url,
        file_name: message.file_name,
        file_type: message.file_type,
        sender_id: message.sender_id,
      }));
      setChatData(transformedMessages);
      setError(null);
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching chat messages:', err);
      Alert.alert('Error', 'Failed to load messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        console.log('📤 Emitting mark_read for thread:', thread_id);
        socketRef.current.emit('mark_read', {
          threadId: thread_id,
        });
      }

      // Also call API mark as read
      await markAllAsRead(thread_id, token);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // File upload functions
  const handleImageUpload = async file => {
    try {
      setIsUploadingImage(true);
      const imageUrl = await uploadImage(file, token);
      setUploadedImageUrl(imageUrl.data.url);
      console.log('✅ Image uploaded successfully:', imageUrl.data.url);
      return imageUrl;
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw error;
    }
  };

  const handleFileUpload = async file => {
    console.log('🚀 ~ handleFileUpload ~ file:', JSON.stringify(file, null, 3));
    try {
      setIsUploadingFile(true);
      const fileUrl = await uploadPdf(file);
      setUploadedFileUrl(fileUrl);
      console.log('✅ File uploaded successfully:', fileUrl);
      return fileUrl;
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw error;
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Handle file selection from camera bottom sheet
  const handleFileSelect = async file => {
    if (!file) return;

    const isImage = file.type?.startsWith('image/');
    const isDocument = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ].includes(file.type);

    try {
      if (isImage) {
        setSelectedImageFile(file);
        // Create preview for image
        setImagePreview(file.uri);
        await handleImageUpload(file);
      } else {
        setSelectedFile(file);
        await handleFileUpload(file);
      }
    } catch (error) {
      Alert.alert('Upload Failed', 'Please try again.');
      clearUploadedFiles();
    }
  };

  const clearUploadedFiles = () => {
    setUploadedImageUrl(null);
    setUploadedFileUrl(null);
    setImagePreview(null);
    setSelectedImageFile(null);
    setSelectedFile(null);
    setIsUploadingImage(false);
  };

  const renderMessage = ({item}) => {
    const isImageMessage = item.messageType === 'image';
    const isFileMessage =
      item.messageType === 'file' || item.messageType === 'document';
    const isDocumentMessage = item.messageType === 'system';

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
            handleDocumentOpen(messageItem.file_url, messageItem.file_name)
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

          {/* {isUploading && (
            <View style={styles.documentProgressBar}>
              <View
                style={[
                  styles.documentProgressFill,
                  {width: `${uploadProgress}%`},
                  isSender && styles.senderProgressFill,
                ]}
              />
            </View>
          )} */}

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
                if (item.file_url) {
                  Linking.openURL(item.file_url);
                }
              }}>
              <Image
                source={{uri: item.file_url}}
                style={styles.messageImage}
                resizeMode="cover"
              />
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

            {/* {item.isSender && (
              <MaterialCommunityIcons
                name={item.isDelivered ? 'check-all' : 'check'}
                size={RFPercentage(1.8)}
                style={styles.tickIcon}
                color={item.isDelivered ? '#4CAF50' : '#999'}
              />
            )} */}

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
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <MaterialCommunityIcons
            name={'chevron-left'}
            onPress={() => navigation.goBack()}
            size={RFPercentage(4)}
            color={
              isDarkMode
                ? Colors.darkTheme.primaryTextColor
                : Colors.lightTheme.primaryTextColor
            }
          />
          <TouchableOpacity
            style={{flexDirection: 'row', alignItems: 'center'}}
            onPress={() =>
              navigation.navigate(SCREENS.CHATPROFILESCREEN, {
                user: {name: userName, avatar: userAvatar},
              })
            }>
            <Image
              source={userAvatar ? {uri: userAvatar} : Images.artist1}
              style={styles.avatar}
              defaultSource={Images.artist1}
            />
            <Text style={styles.screenHeading}>
              {userName || t('Unknown User')}
            </Text>
          </TouchableOpacity>

          {/* Socket status indicator */}
          {/* <TouchableOpacity
            onPress={checkSocketStatus}
            style={styles.socketStatusContainer}>
            <View
              style={[
                styles.socketStatus,
                isConnected
                  ? styles.socketConnected
                  : styles.socketDisconnected,
              ]}>
              <Text style={styles.socketStatusText}>
                {isConnected ? '🟢' : '🔴'}
              </Text>
            </View>
          </TouchableOpacity> */}
        </View>

        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={chatData}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />
        </View>

        {/* Upload Status Indicators */}
        {(imagePreview || isUploadingImage) && (
          <View style={styles.uploadStatusContainer}>
            <View style={styles.uploadStatus}>
              {uploadedImageUrl && (
                <TouchableOpacity
                  onPress={clearUploadedFiles}
                  style={{
                    position: 'absolute',
                    top: 5,
                    left: 2,
                    backgroundColor: isDarkMode
                      ? Colors.darkTheme.deadlineMissedColor
                      : Colors.lightTheme.deadlineMissedColor,
                    padding: 4,
                    borderRadius: 100,
                    zIndex: 1000,
                  }}>
                  <MaterialCommunityIcons
                    name="close"
                    size={RFPercentage(2.5)}
                    color={
                      isDarkMode
                        ? Colors.darkTheme.primaryTextColor
                        : Colors.lightTheme.backgroundColor
                    }
                  />
                </TouchableOpacity>
              )}
              <Image
                source={{uri: uploadedImageUrl}}
                style={styles.imagePreview}
              />
            </View>
          </View>
        )}

        {(uploadedFileUrl || isUploadingFile) && (
          <View style={styles.uploadStatusContainer}>
            <View style={styles.uploadStatus}>
              {isUploadingFile ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.darkTheme.primaryColor}
                />
              ) : (
                <MaterialCommunityIcons
                  name="file-document"
                  size={RFPercentage(2.5)}
                  color={Colors.darkTheme.primaryColor}
                />
              )}
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>
                  {isUploadingFile ? 'Uploading file...' : selectedFile?.name}
                </Text>
                <Text style={styles.fileType}>
                  {isUploadingFile
                    ? 'Please wait...'
                    : `${selectedFile?.name
                        ?.split('.')
                        .pop()
                        ?.toUpperCase()} Document`}
                </Text>
              </View>
              {uploadedFileUrl && (
                <TouchableOpacity onPress={clearUploadedFiles}>
                  <MaterialCommunityIcons
                    name="close"
                    size={RFPercentage(2.5)}
                    color="#666"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

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
              backgroundColor: isDarkMode
                ? Colors.darkTheme.input
                : Colors.lightTheme.backgroundColor,
            }}
            multiline
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.iconWrapper,
              {
                backgroundColor:
                  chat.trim() || uploadedImageUrl || uploadedFileUrl || document
                    ? Colors.darkTheme.primaryColor
                    : Colors.lightTheme.primaryColor,
              },
            ]}
            onPress={handleSendMessage}
            disabled={
              !chat.trim() && !uploadedImageUrl && !uploadedFileUrl && !document
            }>
            <Svgs.sendWhite />
          </TouchableOpacity>
        </View>

        <CameraBottomSheet
          refRBSheet={CameraBottomSheetRef}
          onPick={handleImageUpload}
          includeDocuments={true}
          cameraType={'back'}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default Conversation;

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
      paddingHorizontal: wp(5),
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
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      marginHorizontal: wp(3),
    },
    avatarSmall: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      marginRight: wp(2),
    },
    socketStatusContainer: {
      marginLeft: 'auto',
      alignItems: 'center',
    },
    socketStatus: {
      padding: wp(1),
      borderRadius: wp(2),
      marginBottom: hp(0.5),
    },
    socketConnected: {
      // backgroundColor: '#4CAF50',
    },
    socketDisconnected: {
      // backgroundColor: Colors.error,
    },
    socketStatusText: {
      fontSize: RFPercentage(1.5),
    },
    // Debug panel styles
    debugPanel: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(0.5),
      backgroundColor: isDarkMode ? '#2D3748' : '#E2E8F0',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#4A5568' : '#CBD5E0',
    },
    debugText: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#90CDF4' : '#2B6CB0',
      flex: 1,
    },
    debugButton: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#68D391' : '#38A169',
      fontWeight: '600',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      backgroundColor: isDarkMode ? '#22543D' : '#C6F6D5',
      borderRadius: wp(1),
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
    fileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(2),
      borderRadius: wp(2),
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginBottom: hp(0.5),
    },
    fileIconContainer: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(1),
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: wp(2),
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
    fileMessageText: {
      marginTop: hp(0.5),
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
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1),
      paddingHorizontal: wp(2),
      marginHorizontal: wp(2),
      marginBottom: hp(1),
    },
    iconWrapper: {
      padding: wp(2.5),
      borderRadius: wp(100),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    input: {
      flex: 1,
      marginHorizontal: wp(3),
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
    tickIcon: {
      marginLeft: wp(1),
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
    documentProgressBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: hp(0.3),
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
      borderBottomLeftRadius: wp(3),
      borderBottomRightRadius: wp(3),
      overflow: 'hidden',
    },
    documentProgressFill: {
      height: '100%',
      backgroundColor: Colors.darkTheme.primaryColor,
    },
    senderProgressFill: {
      backgroundColor: Colors.lightTheme.backgroundColor,
    },
    downloadIndicator: {
      marginLeft: wp(2),
    },
  });
