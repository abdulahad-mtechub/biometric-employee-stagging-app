import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  getInitialNotification,
  onMessage,
  onNotificationOpenedApp,
  requestPermission as requestMessagingPermission,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class NotificationService {
  constructor() {
    this.messaging = getMessaging();
    this.isInitialized = false;
  }

  async requestPermission() {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await requestMessagingPermission(this.messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;
        return enabled;
      }

      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn(
            '⚠️ POST_NOTIFICATIONS not granted (FCM token will still be requested)',
          );
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Permission error:', error);
      return false;
    }
  }

  _isTokenErrorRetryable(error) {
    const msg = String(error?.message || error || '');
    return (
      msg.includes('SERVICE_NOT_AVAILABLE') ||
      msg.includes('java.io.IOException') ||
      msg.includes('FirebaseInstallationsException') ||
      error?.code === 'messaging/unavailable'
    );
  }

  async getFCMToken() {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('⚠️ No notification permission granted');
        return null;
      }

      const maxAttempts = 5;
      let lastError;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const token = await getToken(this.messaging);
          if (token) {
            if (attempt > 1) {
              console.log(`✅ FCM Token retrieved on attempt ${attempt}`);
            } else {
              console.log('✅ FCM Token retrieved successfully');
            }
            await this.storeFCMToken(token);
            return token;
          }
          console.warn('⚠️ No FCM token available');
          return null;
        } catch (error) {
          lastError = error;
          const retry =
            this._isTokenErrorRetryable(error) && attempt < maxAttempts;
          if (retry) {
            const delayMs = Math.min(8000, 1000 * Math.pow(2, attempt - 1));
            console.warn(
              `⏳ FCM getToken failed (attempt ${attempt}/${maxAttempts}), retry in ${delayMs}ms`,
            );
            await sleep(delayMs);
            continue;
          }
          break;
        }
      }

      console.error('❌ FCM Token error:', lastError);
      console.log('Error code:', lastError?.code);
      console.log('Error message:', lastError?.message);
      return null;
    } catch (error) {
      console.error('❌ FCM Token error:', error);
      console.log('Error code:', error?.code);
      console.log('Error message:', error?.message);
      return null;
    }
  }

  async storeFCMToken(token) {
    try {
      await AsyncStorage.setItem('fcm_token', token);
    } catch (error) {
      console.error('Error storing FCM token:', error);
    }
  }

  /** Subscribe to foreground FCM messages (modular onMessage). */
  onMessageReceived(listener) {
    return onMessage(this.messaging, listener);
  }

  setupForegroundHandler() {
    try {
      return onMessage(this.messaging, async remoteMessage => {
        console.log(
          '📱 Foreground message received:',
          JSON.stringify(remoteMessage, null, 2),
        );
        if (remoteMessage?.notification && this.showAlert) {
          const {title, body} = remoteMessage.notification;
          this.showAlert(
            `Notification Received\n${title ? title + '\n' : ''}${body || ''}`,
            remoteMessage?.data?.type || 'info',
          );
        }
        await this.showLocalNotification(remoteMessage);
      });
    } catch (error) {
      console.error('❌ Error setting up foreground handler:', error);
    }
  }

  setupBackgroundHandler() {
    try {
      setBackgroundMessageHandler(this.messaging, async remoteMessage => {
        console.log('📱 Background message received:', remoteMessage);
        await this.showLocalNotification(remoteMessage);
      });
    } catch (error) {
      console.error('❌ Error setting up background handler:', error);
    }
  }

  setupBackgroundHandlerAlt() {
    this.setupBackgroundHandler();
  }

  async handleBackgroundMessage(remoteMessage) {
    console.log(
      '📱 Background message received:',
      JSON.stringify(remoteMessage, null, 2),
    );
    if (remoteMessage?.notification && this.showAlert) {
      const {title, body} = remoteMessage.notification;
      this.showAlert(
        `Notification Received\n${title ? title + '\n' : ''}${body || ''}`,
        remoteMessage?.data?.type || 'info',
      );
    }
    await this.showLocalNotification(remoteMessage);
  }

  setupNotificationClickHandler() {
    try {
      onNotificationOpenedApp(this.messaging, remoteMessage => {
        console.log('👆 Notification opened from background:', remoteMessage);
        this.handleNotificationTap(remoteMessage);
      });

      getInitialNotification(this.messaging).then(remoteMessage => {
        if (remoteMessage) {
          console.log('👆 App opened from notification:', remoteMessage);
          this.handleNotificationTap(remoteMessage);
        }
      });

      console.log('✅ Notification click handlers set up successfully');
    } catch (error) {
      console.error('❌ Error setting up notification click handlers:', error);
    }
  }

  setShowAlertFunction(showAlert) {
    this.showAlert = showAlert;
  }

  async showLocalNotification(remoteMessage) {
    const {notification, data} = remoteMessage;
    console.log('🔔 Show notification:', {
      title: notification?.title,
      body: notification?.body,
      data,
    });

    if (this.showAlert) {
      this.showAlert(
        `${notification?.title}\n${notification?.body}`,
        data?.type || null,
        '',
        data?.request_id || '',
      );
    }
  }

  handleNotificationTap(remoteMessage) {
    console.log('👆 Notification tapped:', remoteMessage);
    const {data} = remoteMessage;
    if (data && data.screen) {
      // navigation.navigate(data.screen, data.params);
    }
  }

  async initialize() {
    if (this.isInitialized) {
      return await this.getFCMToken();
    }

    try {
      await this.requestPermission();
      this.setupForegroundHandler();
      this.setupBackgroundHandlerAlt();
      this.setupNotificationClickHandler();

      const token = await this.getFCMToken();

      this.isInitialized = true;
      return token;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      this.isInitialized = false;
      return null;
    }
  }

  async getCurrentToken() {
    try {
      return await getToken(this.messaging);
    } catch (error) {
      console.error('Error getting current token:', error);
      return null;
    }
  }
}

export default new NotificationService();
