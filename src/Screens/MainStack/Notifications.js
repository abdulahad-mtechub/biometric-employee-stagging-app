import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {useLocalizedAlert} from '../../../src/Providers/useLocalizedAlert';
import StackHeader from '../../components/Header/StackHeader';
import {
  getNotifications,
  markNotificationsAllAsRead,
} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';

const NotificationScreen = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {showAlert} = useAlert();
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const localizedAlert = useLocalizedAlert();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getNotificationIcon = type => {
    const iconMap = {
      worker_approval: 'check-circle',
      task_assigned: 'assignment',
      task_completed: 'assignment-turned-in',
      check_in: 'login',
      check_out: 'logout',
      schedule_update: 'schedule',
      system: 'notifications',
    };
    return iconMap[type] || 'notifications';
  };

  const getNotificationColor = type => {
    const colorMap = {
      worker_approval: isDarkMode ? '#4CAF50' : '#2E7D32',
      task_assigned: isDarkMode ? '#2196F3' : '#0077ffff',
      task_completed: isDarkMode ? '#4CAF50' : '#2E7D32',
      check_in: isDarkMode ? '#FF9800' : '#EF6C00',
      check_out: isDarkMode ? '#F44336' : '#C62828',
      schedule_update: isDarkMode ? '#9C27B0' : '#7B1FA2',
      system: isDarkMode ? '#607D8B' : '#455A64',
    };
    return colorMap[type] || (isDarkMode ? '#4CAF50' : '#FFC107');
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await getNotifications(token);

      if (response.error === false) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      } else {
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, showAlert]);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setMarkAllLoading(true);
    try {
      const response = await markNotificationsAllAsRead(token);

      if (response.error === false) {
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }));

        localizedAlert(response, 'success');
        setNotifications(updatedNotifications);
        setUnreadCount(0);

        showAlert(
          response.message || t('All notifications marked as read'),
          'success',
        );
      } else {
        showAlert(
          response.message || t('Failed to mark notifications as read'),
          'error',
        );
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      showAlert(t('Failed to mark notifications as read'), 'error');
    } finally {
      setMarkAllLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const renderItem = ({item}) => {
    const isUnread = !item.is_read;
    const handleNotificationPress = () => {
      console.log('Notification pressed:', JSON.stringify(item, null, 2));
      switch (item.type) {
        case 'request_info_requested':
          navigation.navigate(SCREENS.REQUESTMANAGEMENT, {item: item});
          break;
        case 'request_approved':
          navigation.navigate(SCREENS.REQUESTMANAGEMENT, {item: item});
          break;
        case 'task_assigned':
        case 'task_completed':
          navigation.navigate(SCREENS.TASKS, {item: item});
          break;
        case 'check_in':
        case 'check_out':
          navigation.navigate(SCREENS.ATTENDANCE, {item: item});
          break;
        case 'payment_recorded':
          navigation.navigate(SCREENS.PAYMENTS, {item: item});
          break;
        case 'system':
        default:
          break;
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleNotificationPress}
        style={[styles.notificationCard, isUnread && styles.unreadCard]}>
        <View style={styles.row}>
          <View
            style={[
              styles.iconContainer,
              {backgroundColor: getNotificationColor(item.type)},
            ]}>
            <Icon
              name={getNotificationIcon(item.type)}
              size={22}
              color="#ffffffff"
            />
          </View>

          <View style={styles.content}>
            <Text
              numberOfLines={1}
              style={[styles.title, isUnread && styles.unreadTitle]}>
              {item.title}
            </Text>

            <Text numberOfLines={2} style={styles.message}>
              {item.message}
            </Text>

            <Text style={styles.time}>{formatDate(item.sent_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          backgroundColor={
            isDarkMode
              ? Colors.darkTheme.backgroundColor
              : Colors.lightTheme.backgroundColor
          }
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <StackHeader
          title={'Notifications'}
          headerTxtStyle={{
            textAlign: 'left',
            fontSize: RFPercentage(2.4),
            fontFamily: Fonts.PoppinsSemiBold,
          }}
          headerStyle={{paddingVertical: hp(2)}}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={
              isDarkMode
                ? Colors.darkTheme.primaryColor
                : Colors.lightTheme.primaryColor
            }
          />
          <Text style={styles.loadingText}>
            {t('Loading notifications...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          backgroundColor={
            isDarkMode
              ? Colors.darkTheme.backgroundColor
              : Colors.lightTheme.backgroundColor
          }
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <StackHeader
          title={t('Notifications')}
          headerTxtStyle={{
            textAlign: 'left',
            fontSize: RFPercentage(2.4),
            fontFamily: Fonts.PoppinsSemiBold,
          }}
          headerStyle={{paddingVertical: hp(2)}}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <Icon
            name="notifications-off"
            size={RFPercentage(8)}
            color={
              isDarkMode
                ? Colors.darkTheme.secondryTextColor
                : Colors.lightTheme.secondryTextColor
            }
          />
          <Text style={styles.emptyText}>{t('No notifications')}</Text>
          <Text style={styles.emptySubText}>
            {t("You're all caught up! New notifications will appear here.")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <StackHeader
        title={t('Notifications')}
        onBackPress={() => navigation.goBack()}
        headerTxtStyle={{
          fontSize: RFPercentage(2.4),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{paddingVertical: hp(2)}}
      />

      {/* Mark All Read */}
      {unreadCount > 0 && (
        <TouchableOpacity
          disabled={markAllLoading}
          onPress={handleMarkAllAsRead}
          style={styles.markAllBtn}>
          {markAllLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors.lightTheme.primaryColor}
            />
          ) : (
            <Text style={styles.markAllText}>
              {t('Mark All Read')} ({unreadCount})
            </Text>
          )}
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.lightTheme.primaryColor}
          />
        }
      />
    </SafeAreaView>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: hp(2),
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp(8),
    },
    emptyText: {
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      marginTop: hp(2),
      marginBottom: hp(1),
    },
    emptySubText: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
      lineHeight: RFPercentage(2.2),
    },
    markAllButton: {
      paddingHorizontal: wp(3),
      paddingBottom: hp(1),
      marginTop: -hp(3),
      borderRadius: 6,
      alignSelf: 'flex-end',
    },
    markAllText: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    disabledText: {
      opacity: 0.5,
    },
    hiddenItemContainer: {
      flex: 1,
    },
    hiddenItemContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingRight: wp(2),
    },
    actionButton: {
      padding: hp(2),
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: wp(14),
      borderRadius: 8,
    },
    actionButtonText: {
      fontSize: RFPercentage(1.4),
      fontFamily: Fonts.PoppinsMedium,
      marginTop: hp(0.5),
    },
    notificationCard: {
      marginHorizontal: wp(4),
      marginVertical: hp(1),
      padding: wp(4),
      borderRadius: 14,
      backgroundColor: isDarkMode ? '#FFFFFF' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    unreadCard: {
      backgroundColor: Colors.lightTheme.readNotificationBackground,
    },
    row: {
      flexDirection: 'row',
    },
    iconContainer: {
      width: wp(12),
      height: wp(12),
      borderRadius: wp(6),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: wp(4),
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    unreadTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
    },
    message: {
      fontSize: RFPercentage(1.6),
      marginTop: hp(0.5),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      lineHeight: RFPercentage(2.2),
    },
    time: {
      marginTop: hp(0.8),
      fontSize: RFPercentage(1.3),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    markAllBtn: {
      alignSelf: 'flex-end',
      marginRight: wp(4),
      marginBottom: hp(1),
    },
    list: {
      paddingBottom: hp(2),
    },
  });

export default NotificationScreen;
