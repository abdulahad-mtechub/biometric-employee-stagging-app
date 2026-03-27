import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
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
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {
  createThread,
  getEligibleUsers,
  getMessageList,
  sendMessage,
} from '../../Constants/api';
import {useButtonColors} from '../../Constants/colorHelper';
import {Colors} from '../../Constants/themeColors';
import {Images} from '../../assets/Images/Images';
import {Svgs} from '../../assets/Svgs/Svgs';
import NavigateAbleBtmSheet from '../../components/BottomSheets/NavigateAbleBtmSheet';
import ReusableBottomSheet from '../../components/BottomSheets/ReusableBottomSheet';
import Icon from 'react-native-vector-icons/Feather';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import {fetchButtonColors} from '../../utils/LocationHelpers';
import {pxToPercentage} from '../../utils/responsive';

const Messages = ({navigation}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const [selectedTab, setSelectedTab] = useState(t('inbox'));
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newChatRole, setNewChatRole] = useState('company_admin');
  const [roleUsers, setRoleUsers] = useState([]);
  const [roleUsersLoading, setRoleUsersLoading] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const {totalUnreadCount, threadCounts} = useSelector(
    state => state.messageCount,
  );
  const RoleSheetRef = useRef();
  const NavigateBtmSheet = useRef();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkSendProgress, setBulkSendProgress] = useState({
    current: 0,
    total: 0,
    visible: false,
  });

  const {isOnline} = useNetworkStatus();
  const MESSAGES_CACHE_KEY = '@cached_message_threads';

  // Role mapping with translation keys
  const ROLE_MAPPING = {
    company_admin: {
      displayName: t('Company Admin'),
      apiValue: 'company_admin',
    },
    superadmin: {
      displayName: t('Super Admin'),
      apiValue: 'superadmin',
    },
    superadmin: {
      displayName: t('Super Admin'),
      apiValue: 'superadmin',
    },
    worker: {
      displayName: t('Employee'),
      apiValue: 'worker',
    },
    other_workers: {
      displayName: t('Other Employees'),
      apiValue: 'worker',
    },
    account_executive: {
      displayName: t('Account Executive'),
      apiValue: 'account_executive',
    },
  };

  // Debug: Log count changes
  useEffect(() => {
    console.log('🔔 Messages.js - threadCounts changed:', threadCounts);
    console.log('🔔 Messages.js - totalUnreadCount changed:', totalUnreadCount);
  }, [threadCounts, totalUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
      fetchButtonColors();
    }, [isOnline]),
  );

  // Load cached messages from AsyncStorage
  const loadCachedMessages = async () => {
    try {
      console.log('📦 Loading cached messages from AsyncStorage...');
      const cachedData = await AsyncStorage.getItem(MESSAGES_CACHE_KEY);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setMessages(cached.messages);
        setIsOfflineData(true);
        console.log('✅ Loaded cached messages:', cached.messages.length);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error loading cached messages:', error);
      return false;
    }
  };

  // Save messages to AsyncStorage cache
  const cacheMessages = async messages => {
    try {
      const cacheData = {
        messages,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(cacheData));
      console.log('✅ Messages cached successfully');
    } catch (error) {
      console.error('❌ Error caching messages:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // If offline, load from cache
      if (!isOnline) {
        console.log('📶 Offline - loading cached messages');
        const hasCached = await loadCachedMessages();
        if (hasCached) {
          setLoading(false);
          return;
        } else {
          // No cached data and offline
          setError(t('No internet connection and no cached data'));
          setMessages([]);
          setIsOfflineData(false);
          setLoading(false);
          return;
        }
      }

      setIsOfflineData(false);
      const response = await getMessageList(token);

      if (response.error || !response.data || !response.data.threads) {
        console.log('Invalid API response:', response);
        throw new Error(response.message || 'Invalid response from server');
      }
      console.log(
        'Online - fetch from API',
        JSON.stringify(response.data.threads, null, 3),
      );
      const transformedMessages = response.data.threads.map(thread => ({
        id: thread.id.toString(),
        name: thread.other_user_name,
        message: thread.last_message_content
          ? thread.last_message_content
          : thread.last_message_type === 'system'
          ? t('PDF file')
          : thread.last_message_type === 'image'
          ? t('Image')
          : t('No messages yet'),
        time: formatTime(thread.last_message_at || thread.updated_at),
        pinned: false,
        avatar: thread.other_user_avatar,
        other_user_id: thread.other_user_id,
        unread_count: thread.unread_count || 0, // ✅ ADD UNREAD COUNT
        role: thread.other_user_role || '',
        email: thread.other_user_email || '',
      }));

      setMessages(transformedMessages);
      setError(null);

      // Cache the messages for offline use
      await cacheMessages(transformedMessages);
    } catch (err) {
      console.error('❌ Error fetching messages:', err);

      // Try to load cached data on error
      const hasCached = await loadCachedMessages();
      if (hasCached) {
        setError(t("Using cached data - couldn't refresh"));
      } else {
        setError(err.message);
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    } else if (diffInHours < 48) {
      return t('Yesterday');
    } else {
      return date.toLocaleDateString([], {day: 'numeric', month: 'short'});
    }
  };

  const handleMessagePress = item => {
    navigation.navigate(SCREENS.CONVERSATION, {
      thread_id: item.id,
      userName: item.name,
      userAvatar: item.avatar,
      other_user_id: item.other_user_id, // ✅ ADD THIS
    });
  };

  const handleRoleSelection = async role => {
    console.log('Role selected:', role);
    setNewChatRole(role);
    setRoleUsersLoading(true);
    setRoleUsers([]);
    RoleSheetRef.current?.close();

    try {
      console.log('Fetching users for role:', role);

      const res = await getEligibleUsers(role, token);
      console.log('API Response:', res);

      const allUsers = res?.data?.users || [];
      console.log('All users fetched:', allUsers.length);

      // Filter users based on selected role using ROLE_MAPPING
      let filteredUsers = [];
      const roleMapping = ROLE_MAPPING[role];
      console.log(roleMapping);

      if (roleMapping) {
        filteredUsers = allUsers.filter(
          user => user.role === roleMapping.apiValue,
        );
      }

      console.log('Filtered users:', filteredUsers.length);
      setRoleUsers(filteredUsers);

      // Open user selection sheet after a small delay
      setTimeout(() => {
        NavigateBtmSheet.current?.open();
      }, 300);
    } catch (e) {
      console.error(`Error fetching ${role} users:`, e);
      setRoleUsers([]);
    }
  };

  const handleNewChatPress = () => {
    RoleSheetRef.current?.open(); // Open the role selection bottom sheet
  };

  // Handle bulk message sending with progress
  const handleSendBulkMessage = async (selectedUsers, message) => {
    if (!selectedUsers.length || !message.trim()) return;

    setIsSendingBulk(true);
    setBulkSendProgress({
      current: 0,
      total: selectedUsers.length,
      visible: true,
    });

    // Start spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ).start();

    try {
      for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i];
        setBulkSendProgress(prev => ({...prev, current: i + 1}));

        try {
          // Map UI role to API role using ROLE_MAPPING
          const roleMapping = ROLE_MAPPING[newChatRole];
          const receiverRole = roleMapping ? roleMapping.apiValue : newChatRole;

          // Create or get thread
          const thread = await createThread(user.id, receiverRole, token);

          if (thread?.data?.thread?.id) {
            // Send message
            await sendMessage(token, thread.data.thread.id, {content: message});
          }
        } catch (err) {
          // Continue with next user even if one fails
          console.log('Failed to send to user:', user.id);
        }
      }

      // Refresh data after sending
      await fetchMessages();

      // Close bottom sheet
      NavigateBtmSheet.current?.close();
    } catch (error) {
      console.error('Bulk send error:', error);
    } finally {
      setIsSendingBulk(false);
      setBulkSendProgress({current: 0, total: 0, visible: false});
      spinAnim.setValue(0);
    }
  };

  // Handle single chat from multi-select
  const handleStartSingleChat = async user => {
    try {
      NavigateBtmSheet.current?.close();
      // Map UI role to API role using ROLE_MAPPING
      const roleMapping = ROLE_MAPPING[newChatRole];
      const receiverRole = roleMapping ? roleMapping.apiValue : newChatRole;

      // Call API to create/get thread
      const response = await createThread(user.id, receiverRole, token);
      let threadId = null;
      if (response && response.data && response.data.thread) {
        threadId = response.data.thread.id;
      } else if (response && response.threadId) {
        threadId = response.threadId;
      }
      if (!threadId) {
        throw new Error('Could not create or get thread');
      }
      navigation.navigate(SCREENS.CONVERSATION, {
        thread_id: threadId,
        userName: user.name,
        userAvatar: user.avatar,
        other_user_id: user.id, // ✅ FIXED: Use snake_case
        role: newChatRole,
      });
    } catch (err) {
      console.error('Error starting new chat:', err);
      // Optionally show an error alert here
    }
  };

  const handleImageError = itemId => {
    setImageErrors(prev => ({...prev, [itemId]: true}));
  };

  const renderItem = data => {
    const item = data.item;
    const hasImageError = imageErrors[item.id];

    // Resolve per-thread unread count strictly from Redux threadCounts (socket-driven).
    // Do NOT fall back to API-provided `item.unreadCount` to avoid showing stale values.
    const perThreadUnread =
      (threadCounts &&
        (threadCounts[item.id] || threadCounts[Number(item.id)])) ||
      0;

    // Get badge color based on role
    const getBadgeColor = role => {
      if (!role) return null;
      const roleLower = role.toLowerCase();
      if (roleLower === 'worker') {
        return '#4CAF50'; // Green for workers
      } else if (roleLower === 'company_admin') {
        return '#FFC107'; // Yellow for company admin
      } else if (roleLower === 'superadmin') {
        return '#F44336'; // Red for super admin
      }
      return null;
    };

    // Format role text for display using translations
    const formatRoleText = role => {
      if (!role) return '';
      // Try to find role in ROLE_MAPPING first
      const roleMapping = Object.values(ROLE_MAPPING).find(
        mapping => mapping.apiValue === role,
      );
      if (roleMapping) {
        return roleMapping.displayName;
      }
      // Fallback to original formatting
      return role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const badgeColor = getBadgeColor(item.role);
    const formattedRole = formatRoleText(item.role);

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handleMessagePress(item)}
        style={[styles.messageCard]}>
        <View style={styles.messageLeft}>
          {!hasImageError && item.avatar ? (
            <Image
              source={{uri: item.avatar}}
              style={styles.avatar}
              onError={() => handleImageError(item.id)}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons
                name="account-circle"
                size={wp(10)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : Colors.lightTheme.secondryTextColor
                }
              />
            </View>
          )}
          <View
            style={[
              styles.messageContent,
              !item.pinned && styles.UnPinnedMessage,
            ]}>
            <View style={styles.nameRow}>
              <Text style={styles.messageName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.role && badgeColor && (
                <View style={[styles.roleBadge, {backgroundColor: badgeColor}]}>
                  <Text style={styles.roleText} numberOfLines={1}>
                    {formattedRole}
                  </Text>
                </View>
              )}
            </View>
            {item.email ? (
              <Text style={styles.emailText} numberOfLines={1}>
                {item.email}
              </Text>
            ) : null}
            <Text style={styles.messageText} numberOfLines={1}>
              {item.message === 'Audio message'
                ? t('Audio message')
                : item.message === 'PDF file'
                ? t('PDF file')
                : item.message}
            </Text>
          </View>
        </View>
        <View style={styles.rightContainer}>
          <Text style={styles.timeText}>{item.time}</Text>
          {perThreadUnread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {perThreadUnread > 99 ? '99+' : perThreadUnread}
              </Text>
            </View>
          )}
          {item.pinned && <Svgs.PinnedL height={hp(2)} width={hp(2)} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator
          size="large"
          color={primaryButtonColors.backgroundColor}
        />
      </View>
    );
  }

  // if (error) {
  //   return (
  //     <View style={[styles.container, styles.centerContainer]}>
  //       <Text style={styles.errorText}>
  //         {t('error')}: {error}
  //       </Text>
  //       <TouchableOpacity onPress={fetchMessages} style={styles.retryButton}>
  //         <Text style={styles.retryText}>{t('retry')}</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

  return (
    <SafeAreaView style={styles.container}>
      {/* Network Status Bar */}
      {/* <NetworkStatusBar
        isOnline={isOnline}
        queuedCount={0}
        onRetryPress={fetchMessages}
        isDarkMode={isDarkMode}
        customMessage={isOfflineData ? t('Viewing cached messages') : null}
      /> */}

      <View style={styles.headerView}>
        <View style={styles.headerContainer}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={RFPercentage(4)}
            color={isDarkMode ? '#FFF' : '#000'}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.screenHeading}>{t('Messages')}</Text>
          <View style={styles.iconContainer}>
            {/* {isDarkMode ? <Svgs.searchD /> : <Svgs.SearchL />} */}
            <TouchableOpacity
              onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}>
              {isDarkMode ? (
                <Svgs.BellD height={hp(4)} />
              ) : (
                <Svgs.BellL height={hp(4)} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* <TabSelector
          tabs={[t('inbox')]}
          selectedTab={selectedTab}
          onTabPress={setSelectedTab}
        /> */}
        <Text style={styles.tabText}>{t('Inbox')}</Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('No messages found')}</Text>
        </View>
      ) : (
        <View style={styles.messagesContainer}>
          {/* Pinned Messages Section */}
          {(messages.filter(m => m.pinned).length > 0 ||
            selectedTab === 'Support Messages') && (
            <View
              style={[
                styles.listWrapper,
                {
                  backgroundColor: isDarkMode
                    ? Colors.darkTheme.backgroundColor
                    : Colors.lightTheme.secondryColor,
                },
              ]}>
              {selectedTab === 'Support Messages' &&
                renderItem({
                  item: {
                    id: '1',
                    name: t('adminsBroadcast'),
                    message: t('supportMessageExample'),
                    time: '12:23',
                    unreadCount: 0,
                    pinned: true,
                    avatar: Images.artist1,
                  },
                })}

              {messages.filter(m => m.pinned).length > 0 && (
                <FlatList
                  data={messages.filter(m => m.pinned)}
                  renderItem={renderItem}
                  keyExtractor={item => item.id + '_pinned'}
                />
              )}
            </View>
          )}

          {/* Regular Messages Section */}
          <View style={styles.listWrapper}>
            <FlatList
              data={messages.filter(m => !m.pinned)}
              renderItem={renderItem}
              keyExtractor={item => item.id + '_all'}
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: primaryButtonColors.backgroundColor,
          },
        ]}
        onPress={handleNewChatPress}>
        <Svgs.whitePlus />
      </TouchableOpacity>

      <ReusableBottomSheet
        refRBSheet={RoleSheetRef}
        sheetTitle={t('Select Role')}
        options={[
          {
            title: t('Company Admin'),
            onPress: () => handleRoleSelection('company_admin'),
            icon: (
              <Icon
                name="briefcase"
                size={25}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryColor
                    : Colors.lightTheme.primaryColor
                }
                style={{
                  backgroundColor: isDarkMode ? '#23272F' : '#E6F0FF',
                  borderRadius: 24,
                  padding: wp(3),
                  height: wp(13),
                  width: wp(13),
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}
              />
            ),
          },
          {
            title: t('Super Admin'),
            onPress: () => handleRoleSelection('superadmin'),
            icon: (
              <Icon
                name="shield"
                size={25}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryColor
                    : Colors.lightTheme.primaryColor
                }
                style={{
                  backgroundColor: isDarkMode ? '#23272F' : '#FFF3E6',
                  borderRadius: 24,
                  padding: wp(3),
                  height: wp(13),
                  width: wp(13),
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}
              />
            ),
          },
          {
            title: t('Other Employees'),
            onPress: () => handleRoleSelection('other_workers'),
            icon: (
              <Icon
                name="users"
                size={25}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryColor
                    : Colors.lightTheme.primaryColor
                }
                style={{
                  backgroundColor: isDarkMode ? '#23272F' : '#E6FFFA',
                  borderRadius: 24,
                  padding: wp(3),
                  height: wp(13),
                  width: wp(13),
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}
              />
            ),
          },
        ]}
        iconContainerStyle={{
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        height={'40%'}
      />

      <NavigateAbleBtmSheet
        refRBSheet={NavigateBtmSheet}
        data={roleUsers.map(user => ({
          id: user.id,
          name: user.name,
          avatar: user.profile_image,
          reason: user.email,
          email: user.email,
          date: '',
          time: '',
        }))}
        sheetTitle={t('Start New Chat')}
        multiSelect={
          newChatRole === 'other_workers' || newChatRole === 'Other Employees'
        }
        onSendBulkMessage={handleSendBulkMessage}
        isSendingBulk={isSendingBulk}
        onStartSingleChat={handleStartSingleChat}
        onItemPress={async item => {
          try {
            NavigateBtmSheet.current?.close();
            // Map UI role to API role using ROLE_MAPPING
            const roleMapping = ROLE_MAPPING[newChatRole];
            const receiverRole = roleMapping
              ? roleMapping.apiValue
              : newChatRole;

            // Call API to create/get thread
            const response = await createThread(item.id, receiverRole, token);
            let threadId = null;
            if (response && response.data && response.data.thread) {
              threadId = response.data.thread.id;
            } else if (response && response.threadId) {
              threadId = response.threadId;
            }
            if (!threadId) {
              throw new Error('Could not create or get thread');
            }
            navigation.navigate(SCREENS.CONVERSATION, {
              thread_id: threadId,
              userName: item.name,
              userAvatar: item.avatar,
              other_user_id: item.id, // ✅ FIXED: Use snake_case
              role: newChatRole,
            });
          } catch (err) {
            console.error('Error starting new chat:', err);
            // Optionally show an error alert here
          }
        }}
        onLoadMore={() => {}}
        hasMore={false}
        isLoading={roleUsersLoading}
      />

      {/* Bulk Send Progress Modal */}
      <Modal
        transparent
        visible={bulkSendProgress.visible}
        animationType="fade">
        <View style={styles.sendingModalOverlay}>
          <View style={styles.sendingModalContainer}>
            {/* Spinning Icon */}
            <Animated.View
              style={[
                styles.sendingIconContainer,
                {
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}>
              <Icon name="send" size={30} color="#fff" />
            </Animated.View>

            {/* Title */}
            <Text style={styles.sendingModalTitle}>
              {t('Sending Messages')}
            </Text>

            {/* Progress Counter */}
            <Text style={styles.sendingModalProgress}>
              {bulkSendProgress.current} / {bulkSendProgress.total}
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      bulkSendProgress.total > 0
                        ? (bulkSendProgress.current / bulkSendProgress.total) *
                          100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>

            {/* Status Text */}
            <Text style={styles.sendingModalSubtext}>
              {t('Please wait while we send your message...')}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Messages;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    centerContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerView: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.08)',
      shadowColor: isDarkMode ? '#000' : '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      justifyContent: 'space-between',
      marginBottom: hp(2.5),
      paddingBottom: hp(1),
    },
    screenHeading: {
      paddingTop: hp(1.5),
      fontFamily: Fonts.PoppinsBold,
      fontSize: RFPercentage(pxToPercentage(24)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
      paddingRight: wp(2),
    },
    listContainer: {
      paddingBottom: hp(15),
    },
    floatingButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      width: wp(14),
      height: wp(14),
      borderRadius: wp(100),
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: hp(6),
      right: wp(5),
      elevation: 8,
      shadowColor: isDarkMode ? '#000' : '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 6,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    messageCard: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingVertical: hp(1.8),
      paddingHorizontal: wp(4),
      marginVertical: hp(0.4),
      marginHorizontal: wp(3),
      borderRadius: wp(3),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',

      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    messageLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingVertical: hp(0.2),
    },
    avatar: {
      width: wp(11),
      height: wp(11),
      borderRadius: wp(5.5),
      marginRight: wp(3),
      borderWidth: 2,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    avatarPlaceholder: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    messageContent: {
      flex: 1,
    },
    messageName: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(17)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.3),
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: wp(55),
    },
    roleBadge: {
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.4),
      borderRadius: wp(1.5),
      marginLeft: wp(2),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
      maxWidth: wp(25),
    },
    roleText: {
      color: '#fff',
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(9)),
      fontWeight: '600',
    },
    emailText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      marginBottom: hp(0.3),
    },
    messageText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(13)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      width: wp(55),
    },
    rightContainer: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: wp(11),
    },
    timeText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      marginBottom: hp(0.5),
    },
    unreadBadge: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      minWidth: wp(6),
      height: wp(6),
      borderRadius: wp(3),
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadText: {
      color: '#fff',
      fontSize: RFPercentage(1.3),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    listWrapper: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingHorizontal: wp(1),
    },
    UnPinnedMessage: {
      paddingBottom: hp(1.2),
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp(8),
    },
    emptyText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      textAlign: 'center',
      marginTop: hp(2),
    },
    errorText: {
      fontFamily: Fonts.PoppinsMedium,
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
      fontFamily: Fonts.PoppinsMedium,
    },
    tabText: {
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      marginHorizontal: wp(5),
      marginBottom: hp(1.5),
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    messagesContainer: {
      flex: 1,
      paddingTop: hp(0.5),
    },
    swipeListView: {
      flex: 1,
    },
    sendingModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendingModalContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      width: '80%',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    sendingIconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    sendingModalTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: 12,
    },
    sendingModalProgress: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      marginBottom: 12,
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#E0E0E0',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressBar: {
      height: '100%',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderRadius: 4,
    },
    sendingModalSubtext: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
  });
