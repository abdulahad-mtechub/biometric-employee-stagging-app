import React, {useState, useEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Feather';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import TxtInput from '../TextInput/Txtinput';

const Avatar = ({uri, isDarkMode}) => {
  const [error, setError] = useState(false);
  console.log('Displaying fallback avatar', uri);

  if (!uri || error) {
    return (
      <View
        style={[
          stylesStatic.avatarFallback,
          {
            backgroundColor: isDarkMode
              ? Colors.darkTheme.input
              : Colors.lightTheme.input,
          },
        ]}>
        <Icon name="user" size={RFPercentage(3.5)} color={'#2E2929'} />
      </View>
    );
  }

  return (
    <Image
      source={{uri}}
      style={stylesStatic.avatar}
      onError={() => setError(true)}
    />
  );
};

const NavigateAbleBtmSheet = ({
  refRBSheet,
  sheetTitle = 'Select Manual Punches',
  data = [],
  onItemPress,
  multiSelect = false,
  onSendBulkMessage,
  isSendingBulk = false,
  onStartSingleChat,
  onLoadMore,
  hasMore = true,
  isLoading = false,
}) => {
  const {isDarkMode} = useSelector(state => state.theme);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);

  // Handle keyboard events for Android - more robust
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', e => {
      // Use a smaller value to avoid too much space
      const keyboardHeightVal = e.endCoordinates.height;
      setKeyboardHeight(Math.min(keyboardHeightVal, 200)); // Cap at 200
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Filter data based on search
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(
        item =>
          item.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.reason?.toLowerCase().includes(search.toLowerCase()) ||
          item.email?.toLowerCase().includes(search.toLowerCase()),
      );
      setFilteredData(filtered);
    }
  }, [search, data]);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedItems([]);
    setBulkMessage('');
  }, [data]);

  const isItemSelected = itemId => {
    return selectedItems.some(item => item.id === itemId);
  };

  const toggleItemSelection = item => {
    if (isItemSelected(item.id)) {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredData]);
    }
  };

  const handleSendBulkMessage = () => {
    if (selectedItems.length > 0 && bulkMessage.trim() && onSendBulkMessage) {
      onSendBulkMessage(selectedItems, bulkMessage.trim());
    }
  };

  const handleStartSingleChat = () => {
    if (selectedItems.length === 1 && onStartSingleChat) {
      onStartSingleChat(selectedItems[0]);
    }
  };

  const renderItem = ({item}) => {
    const isSelected = multiSelect && isItemSelected(item.id);

    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => {
          if (multiSelect) {
            toggleItemSelection(item);
          } else {
            onItemPress(item);
          }
        }}>
        {multiSelect && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleItemSelection(item)}>
            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Icon name="check" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        )}
        <View style={{flexDirection: 'row', flex: 1}}>
          <Avatar uri={item.avatar} isDarkMode={isDarkMode} />

          <Text style={styles.name}>
            {item.name}
            {'\n'}
            <Text style={styles.subText}>{item.email || t(item.reason)}</Text>
          </Text>
        </View>
        {!multiSelect && (
          <Icon
            name="chevron-right"
            size={RFPercentage(2.6)}
            color={
              isDarkMode
                ? Colors.darkTheme.iconColor
                : Colors.lightTheme.iconColor
            }
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <RBSheet
      ref={refRBSheet}
      height={hp(multiSelect ? '70%' : '60%')}
      openDuration={300}
      closeOnPressMask={true}
      draggable={true}
      keyboardShouldPersistTaps="handled"
      customStyles={{
        container: {
          borderTopLeftRadius: wp('6%'),
          borderTopRightRadius: wp('6%'),
          backgroundColor: isDarkMode
            ? Colors.darkTheme.backgroundColor
            : Colors.lightTheme.backgroundColor,
          paddingBottom: hp('2%'),
        },
      }}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t(sheetTitle)}</Text>
            <TouchableOpacity onPress={() => refRBSheet.current?.close()}>
              <Icon
                name="x"
                size={RFPercentage(3)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.iconColor
                    : Colors.lightTheme.iconColor
                }
              />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <TxtInput
            placeholder={t('Search')}
            svg={
              isDarkMode ? (
                <Svgs.searchD height={hp(2.5)} width={hp(2.5)} />
              ) : (
                <Svgs.SearchL height={hp(2.5)} width={hp(2.5)} />
              )
            }
            onChangeText={setSearch}
            rightIcon={search.length > 0 && 'close-circle-outline'}
            rightIconSize={wp(6)}
            rightBtnStyle={{width: wp(8), backgroundColor: 'transparent'}}
            rightIconPress={() => setSearch('')}
            value={search}
            containerStyle={{
              backgroundColor: isDarkMode
                ? Colors.darkTheme.input
                : Colors.lightTheme.input,
            }}
          />

          {/* Select All Row (when multiSelect=true) */}
          {multiSelect && filteredData.length > 0 && (
            <TouchableOpacity
              style={styles.selectAllRow}
              onPress={handleSelectAll}>
              <View
                style={[
                  styles.checkbox,
                  selectedItems.length === filteredData.length &&
                    filteredData.length > 0 &&
                    styles.checkboxSelected,
                ]}>
                {selectedItems.length === filteredData.length &&
                  filteredData.length > 0 && (
                    <Icon name="check" size={14} color="#fff" />
                  )}
              </View>
              <Text style={styles.selectAllText}>
                {selectedItems.length === filteredData.length &&
                filteredData.length > 0
                  ? t('Unselect All')
                  : t('Select All')}
              </Text>
              {selectedItems.length > 0 && (
                <Text style={styles.selectedCountText}>
                  ({selectedItems.length} {t('selected')})
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* List */}
          <ScrollView
            style={{flex: 1}}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: hp('2%'),
                paddingBottom: hp('2%'),
              }}
              onEndReached={onLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                hasMore && isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      isDarkMode
                        ? Colors.darkTheme.primaryColor
                        : Colors.lightTheme.primaryColor
                    }
                    style={{paddingVertical: hp(2)}}
                  />
                ) : null
              }
            />
          </ScrollView>

          {/* Single user selected - Show Start Chat button */}
          {multiSelect && selectedItems.length === 1 && (
            <View style={styles.singleChatContainer}>
              <TouchableOpacity
                style={styles.startChatButton}
                onPress={handleStartSingleChat}>
                <Icon name="message-circle" size={20} color="#fff" />
                <Text style={styles.startChatButtonText}>
                  {t('Start Chat')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Multiple users selected - Show message input */}
          {multiSelect && selectedItems.length > 1 && (
            <View
              style={[
                styles.bulkMessageContainer,
                {marginBottom: keyboardHeight > 0 ? hp(6) : 0},
              ]}>
              <TextInput
                style={styles.bulkMessageInput}
                placeholder={t('Type your message...')}
                value={bulkMessage}
                onChangeText={setBulkMessage}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!bulkMessage.trim() || isSendingBulk) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSendBulkMessage}
                disabled={!bulkMessage.trim() || isSendingBulk}>
                {isSendingBulk ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </RBSheet>
  );
};

const stylesStatic = StyleSheet.create({
  avatar: {
    height: wp(11),
    width: wp(11),
    borderRadius: wp('30%'),
    marginRight: wp('3%'),
    resizeMode: 'cover',
  },
  avatarFallback: {
    height: wp(11),
    width: wp(11),
    borderRadius: wp('30%'),
    marginRight: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      paddingHorizontal: wp('5%'),
      paddingTop: hp('2%'),
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp('1.5%'),
    },
    title: {
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp('1.5%'),
      borderBottomWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E0E0E0',
    },
    checkboxContainer: {
      marginRight: wp('3%'),
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E0E0E0',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    checkboxSelected: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    selectAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp('1.5%'),
      borderBottomWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E0E0E0',
      marginTop: hp('1%'),
    },
    selectAllText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp('3%'),
    },
    selectedCountText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.6),
      color: isDarkMode ? Colors.darkTheme.secondryTextColor : '#888',
      marginLeft: wp('2%'),
    },
    singleChatContainer: {
      paddingVertical: hp('1.5%'),
      borderTopWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E0E0E0',
      marginTop: hp('1%'),
    },
    startChatButton: {
      flexDirection: 'row',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingVertical: hp('1.5%'),
      paddingHorizontal: wp('5%'),
      borderRadius: wp('2%'),
      justifyContent: 'center',
      alignItems: 'center',
      gap: wp('2%'),
    },
    startChatButtonText: {
      color: '#fff',
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
    },
    bulkMessageContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingTop: hp('1.5%'),
      borderTopWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E0E0E0',
      marginTop: hp('1%'),
      gap: wp('2%'),
      marginBottom: hp('3.5%'),
    },
    bulkMessageInput: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.input,
      borderRadius: wp('2%'),
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsRegular,
      color: '#696969ff',
      borderWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E0E0E0',
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    name: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    subText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? Colors.darkTheme.secondryTextColor : '#888',
      marginTop: hp('0.3%'),
    },
  });

export default NavigateAbleBtmSheet;
