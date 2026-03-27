import moment from 'moment';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon, {IconType} from 'react-native-dynamic-vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Text from 'src/Components/Text';
import View from 'src/Components/View';
import {useAppSelector} from 'src/Helper/Hooks/reduxHooks';
import {CHAT_MESSAGES} from 'src/Redux/Reducers/Auth/actions';
import {ENV} from 'src/config/env';
import {fontRef, heightRef, widthRef} from 'src/config/screenSize';
import {useSocket} from 'src/config/socket';
import ChatHeader from '../ChatHeader';
import styles from './style';
import Assets from 'src/Assets';

const ChatDetails = ({route}) => {
  const {value, userData} = route?.params || '';
  const recieverId = value?.item?.userId?._id || userData?._id;
  const recieverPhoto = value?.item?.userId?.photo || userData?.photo;
  const recieverName = value?.item?.userId?.fullName || userData?.fullName;
  const user = useAppSelector(s => s.auth.user);
  const adminID = useAppSelector(s => s?.auth?.user?._id);
  const insets = useSafeAreaInsets();
  const socket = useSocket();
  const [chatId, setChatID] = useState();
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [messages, setMessages] = useState([]);
  const [updateChat, setUpdateChat] = useState(false);
  const [message, setMessage] = useState < string > '';
  const ChatMessages = useCallback(() => {
    setLoadingMessage(true);
    if (!user) return;
    const data = {
      userId: recieverId,
      admin: adminID,
    };
    CHAT_MESSAGES(data, ({success, chat}) => {
      if (success) {
        setMessages(chat?.messages?.reverse());
        setLoadingMessage(false);
        setChatID(chat?._id);
      } else {
        setLoadingMessage(false);
      }
    });
  }, [user, adminID, updateChat]);
  useEffect(ChatMessages, [ChatMessages]);

  const handleSendMessage = () => {
    if (message.trim() === '') {
      return;
    }

    socket?.emit('message', {
      sender: adminID,
      receiver: recieverId,
      chatId: chatId,
      content: message.trim(),
    });
    setMessages(prev => [
      {
        sender: `${adminID}`,
        content: message.trim(),
        timestamp: moment().toISOString(),
      },
      ...prev,
    ]);
    setMessage('');
    setUpdateChat(true);
  };
  useEffect(() => {
    socket?.on(`message${adminID}`, data => {
      if (data.sender && data.sender !== adminID) {
        setMessages(prev => [
          {...data, timestamp: moment().toISOString()},
          ...prev,
        ]);
      }
    });
    // setUpdateChat(p => !p);
    return () => {
      socket?.off(`message${adminID}`);
    };
  }, [socket]);
  const CHAT = React.useMemo(() => {
    let array = [];
    let prevDate = '';
    messages.forEach((item, index) => {
      let itemDate = moment(item.timestamp).calendar(null, {
        sameDay: '[Today]',
        lastDay: '[Yesterday]',
        sameElse: ENV.DATE_FORMAT,
        lastWeek: ENV.DATE_FORMAT,
      });
      if (index !== 0 && itemDate !== prevDate) {
        array.push(prevDate);
      }
      array.push(item);
      prevDate = itemDate;
    });
    if (prevDate !== '') {
      array.push(prevDate);
    }
    return array;
  }, [messages]);
  return (
    <View style={styles.main}>
      <Image source={Assets?.bswp} style={styles.bswp} />
      <ChatHeader title={recieverName} source={recieverPhoto} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1, width: '100%'}}>
        {loadingMessage ? (
          <ActivityIndicator style={{flex: 1}} color="#1C3078" size={40} />
        ) : (
          <FlatList
            inverted
            showsVerticalScrollIndicator={false}
            data={CHAT}
            contentContainerStyle={{paddingHorizontal: 15 * fontRef}}
            renderItem={({item}) => (
              <MessageBox item={item} sender={`${adminID}`} />
            )}
          />
        )}
        {Platform.OS === 'android' ? (
          <View style={[styles.bottom, {marginBottom: insets.bottom + 10}]}>
            <TextInput
              style={[styles.input, {height: 50}]}
              placeholder="Type a message here"
              placeholderTextColor={'gray'}
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity
              style={[styles.send, {marginBottom: 7}]}
              onPress={handleSendMessage}>
              <Icon
                type={IconType.FontAwesome}
                name="send"
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.bottom, {marginBottom: insets.bottom}]}>
            <TextInput
              style={styles.input}
              placeholder="Type a message here"
              placeholderTextColor={'gray'}
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.send} onPress={handleSendMessage}>
              <Icon
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                  shadowOffset: {
                    width: 0,
                    height: 1,
                  },
                  shadowOpacity: 0.2,
                  shadowRadius: 1.4,
                  elevation: 2,
                }}
                type={IconType.FontAwesome}
                name="send"
                size={24}
                color="#1C3078"
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};
export default ChatDetails;
const MessageBox = ({item, sender}) => {
  if (typeof item === 'string') {
    return (
      <Text
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          color: '#a0a0a0',
          fontSize: 14 * fontRef,
          fontWeight: 'bold',
          marginTop: 10 * heightRef,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          maxWidth: 80 * widthRef,
          padding: 15 * heightRef,
          borderRadius: 25,
          textAlign: 'center',
          alignSelf: 'center',
        }}
        adjustsFontSizeToFit
        numberOfLines={1}>
        {item}
      </Text>
    );
  } else {
    const own = sender === item.sender;
    return (
      <View
        width={'100%'}
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          marginVertical: 12 * heightRef,
          alignItems: own ? 'flex-end' : 'flex-start',
        }}>
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            paddingHorizontal: 10 * heightRef,
            paddingVertical: 10 * heightRef,
            borderRadius: 15 * fontRef,
            backgroundColor: own ? '#1C3078' : '#1B1212',
            borderBottomRightRadius: own ? 0 : 15 * fontRef,
            borderBottomLeftRadius: own ? 15 * fontRef : 0,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.2,
            shadowRadius: 1.4,
            elevation: 2,
          }}>
          <Text
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              lineHeight: 18 * heightRef,
              fontSize: 14 * fontRef,
              fontWeight: '500',
              textAlign: 'justify',
            }}
            color={own ? '#fff' : '#fff'}>
            {item.content}
          </Text>
          <Text
            fontSize={10}
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              paddingTop: 10,
              fontWeight: '500',
              alignSelf: own ? 'flex-end' : 'flex-start',
            }}
            color={own ? '#dcdcdc' : '#9F9F9F'}>
            {moment(item.timestamp).format('HH:mm')}
          </Text>
        </View>
      </View>
    );
  }
};
