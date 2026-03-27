import io from 'socket.io-client';
import {ImgURL} from '../Constants/Base_URL';

class SimpleSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.listeners = new Map();
    this.token = null;
    this.pendingAuthentication = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectionPromise = null;
  }

  initialize(token) {
    console.log('🔄 Initializing socket with token...');
    this.token = token;

    // Clean up existing connection
    if (this.socket) {
      this.disconnect();
    }

    if (!token) {
      console.error('❌ No token provided for socket connection');
      return null;
    }

    try {
      console.log('🔗 Creating socket connection to:', ImgURL);

      // FIX: Use proper connection options for React Native
      this.socket = io(ImgURL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        auth: {
          token: token,
        },
      });

      this.setupListeners();
      return this.socket;
    } catch (error) {
      console.error('❌ Socket initialization error:', error);
      this.emitLocal('connection_status', {
        connected: false,
        authenticated: false,
        error: error.message,
      });
      return null;
    }
  }

  setupListeners() {
    if (!this.socket) return;

    // Basic connection events
    this.socket.on('connect', () => {
      console.log('🔗 Socket connected with ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      this.emitLocal('connection_status', {
        connected: true,
        authenticated: this.isAuthenticated,
        status: 'connected',
      });
    });

    this.socket.on('disconnect', reason => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;

      this.emitLocal('connection_status', {
        connected: false,
        authenticated: false,
        reason: reason,
      });
    });

    this.socket.on('connect_error', error => {
      console.error('❌ Connection error:', error.message);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.reconnectAttempts++;

      this.emitLocal('connection_status', {
        connected: false,
        authenticated: false,
        error: error.message,
        reconnectAttempts: this.reconnectAttempts,
      });
    });

    // Authentication events
    this.socket.on('authenticated', data => {
      console.log('✅ Socket authenticated successfully!', data);
      this.isAuthenticated = true;

      this.emitLocal('connection_status', {
        connected: true,
        authenticated: true,
        status: 'authenticated',
      });

      if (this.pendingAuthentication) {
        this.pendingAuthentication(true);
        this.pendingAuthentication = null;
      }
    });

    this.socket.on('unauthorized', error => {
      console.error('❌ Socket unauthorized:', error);
      this.isAuthenticated = false;

      this.emitLocal('connection_status', {
        connected: this.isConnected,
        authenticated: false,
        error: error?.message || 'Authentication failed',
      });
    });

    // Message events - SIMPLIFIED VERSION
    this.socket.on('new_message', data => {
      console.log('📨 NEW_MESSAGE received:', data);
      this.emitLocal('new_message', data);
    });

    this.socket.on('receive_message', data => {
      console.log('📨 RECEIVE_MESSAGE received:', data);
      this.emitLocal('new_message', data);
    });

    this.socket.on('message_sent', data => {
      console.log('✅ MESSAGE_SENT confirmation:', data);
      this.emitLocal('message_sent', data);
    });

    // Thread events
    this.socket.on('join_thread_success', data => {
      console.log('🎯 Joined thread successfully:', data);
      this.emitLocal('join_thread_success', data);
    });

    this.socket.on('join_thread_error', error => {
      console.error('❌ Join thread error:', error);
      this.emitLocal('join_thread_error', error);
    });

    // Reconnection events
    this.socket.on('reconnecting', attempt => {
      console.log('🔄 Reconnecting attempt:', attempt);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      this.emitLocal('connection_status', {
        connected: false,
        authenticated: false,
        error: 'Reconnection failed',
      });
    });

    // Debug all events
    this.socket.onAny((event, ...args) => {
      console.log(
        `🔍 [SOCKET] Event: ${event}`,
        args.length > 0 ? args[0] : 'No data',
      );
    });
  }

  // Wait for connection to be established
  waitForConnection() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        this.socket.off('connect', connectHandler);
        reject(new Error('Connection timeout'));
      }, 10000);

      const connectHandler = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      this.socket.once('connect', connectHandler);
    });
  }

  // Enhanced emit method
  async emit(event, data, options = {}) {
    const {retries = 3, timeout = 5000} = options;

    try {
      // Wait for connection
      if (!this.isConnected) {
        console.log(`⏳ Waiting for connection before emitting ${event}...`);
        await this.waitForConnection();
      }

      console.log(`🚀 Emitting ${event}:`, data);

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.warn(`⚠️ Timeout emitting ${event}`);
          resolve(false); // Don't reject on timeout, just return false
        }, timeout);

        // Emit with callback for confirmation
        this.socket.emit(event, data, response => {
          clearTimeout(timeoutId);

          if (response && response.error) {
            console.error(`❌ Error response for ${event}:`, response.error);
            resolve(false);
          } else {
            console.log(`✅ ${event} emitted successfully`);
            resolve(true);
          }
        });

        // For events that don't expect a response
        if (event === 'send_message') {
          clearTimeout(timeoutId);
          resolve(true);
        }
      });
    } catch (error) {
      console.error(`❌ Error emitting ${event}:`, error);

      if (retries > 0) {
        console.log(`🔄 Retrying ${event} (${retries} attempts left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.emit(event, data, {...options, retries: retries - 1});
      }

      return false;
    }
  }

  // Join thread with proper error handling
  async joinThread(threadId) {
    if (!threadId) {
      console.error('❌ Thread ID is required');
      return false;
    }

    const threadData = {
      threadId: parseInt(threadId),
    };

    console.log('🎯 Joining thread:', threadData);

    // Try different event names that the server might expect
    const events = ['join_thread_room', 'join_thread', 'join_room'];

    for (const event of events) {
      const success = await this.emit(event, threadData);
      if (success) {
        console.log(`✅ Successfully joined thread via ${event}`);
        return true;
      }
    }

    console.warn('⚠️ All join attempts failed, but continuing anyway');
    return true; // Continue even if join fails
  }

  // Send message with proper formatting
  async sendMessage(messageData) {
    const {
      threadId,
      content,
      messageType = 'text',
      fileUrl,
      fileName,
    } = messageData;

    if (!threadId || (!content && !fileUrl)) {
      console.error('❌ Invalid message data');
      return false;
    }

    const data = {
      threadId: parseInt(threadId),
      content: content || (fileUrl ? 'File shared' : ''),
      messageType: messageType,
      ...(fileUrl && {fileUrl}),
      ...(fileName && {fileName}),
    };

    console.log('📤 Sending message:', data);
    return await this.emit('send_message', data);
  }

  // Mark messages as read
  async markAsRead(threadId) {
    if (!threadId) return false;

    const data = {
      threadId: parseInt(threadId),
    };

    console.log('📖 Marking messages as read:', data);
    return await this.emit('mark_read', data);
  }

  // Mark all messages as read
  async markAllMessagesAsRead() {
    console.log('📖 Marking all messages as read');
    return await this.emit('mark_all_messages_read', {});
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    console.log(`🎧 Added listener for: ${event}`);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, callbacks);
      console.log(`🎧 Removed listener for: ${event}`);
    }
  }

  emitLocal(event, data) {
    if (this.listeners.has(event)) {
      console.log(`📢 Emitting local event: ${event}`, data);
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} listener:`, error);
        }
      });
    } else {
      console.log(`📢 No listeners for event: ${event}`);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.isAuthenticated = false;
    this.token = null;
    this.reconnectAttempts = 0;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      socketId: this.socket?.id,
      hasToken: !!this.token,
    };
  }

  // Manual connection for testing
  manualConnect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }
}

export default new SimpleSocketService();
