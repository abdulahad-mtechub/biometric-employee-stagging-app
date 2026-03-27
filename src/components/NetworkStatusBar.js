/**
 * NetworkStatusBar.js
 *
 * Component to display network connection status to users
 * Shows online/offline state and syncing status
 */

import React, {useEffect, useState} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Fonts} from '../Constants/Fonts';
import useNetworkStatus from '../hooks/useNetworkStatus';
import {pxToPercentage} from '../utils/responsive';

const NetworkStatusBar = ({
  onRetryPress,
  queuedCount = 0,
  isDarkMode = false,
  customMessage = null,
  syncType = 'message', // 'message' or 'profile'
}) => {
  const {isOnline, connectionType, connectionQuality} = useNetworkStatus();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOnline || queuedCount > 0 || customMessage) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOnline, queuedCount, customMessage]);

  if (!visible && isOnline && queuedCount === 0 && !customMessage) {
    return null;
  }

  const getStatusConfig = () => {
    // Custom message takes precedence
    if (customMessage && !isOnline) {
      return {
        icon: 'database-outline',
        text: customMessage,
        subText: 'Tap to refresh when online',
        backgroundColor: '#4A90E2',
        textColor: '#FFFFFF',
      };
    }

    if (!isOnline) {
      const itemType = syncType === 'profile' ? 'Profile changes' : 'Messages';
      return {
        icon: 'wifi-off',
        text: 'No Internet Connection',
        subText: `${itemType} will sync when online`,
        backgroundColor: '#FF6B6B',
        textColor: '#FFFFFF',
      };
    }

    if (queuedCount > 0) {
      const itemText = syncType === 'profile' ? 'profile update' : 'message';
      const itemsText = syncType === 'profile' ? 'profile updates' : 'messages';
      return {
        icon: 'cloud-upload-outline',
        text: `Syncing ${queuedCount} ${
          queuedCount > 1 ? itemsText : itemText
        }...`,
        subText: 'Tap to retry',
        backgroundColor: '#FFA500',
        textColor: '#FFFFFF',
      };
    }

    if (connectionQuality === 'poor') {
      const itemType = syncType === 'profile' ? 'Profile updates' : 'Messages';
      return {
        icon: 'wifi-strength-1',
        text: 'Weak Connection',
        subText: `${itemType} may be delayed`,
        backgroundColor: '#FFA500',
        textColor: '#FFFFFF',
      };
    }

    return {
      icon: 'wifi',
      text: 'Connected',
      subText: '',
      backgroundColor: '#4CAF50',
      textColor: '#FFFFFF',
    };
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <TouchableOpacity
        style={styles.content}
        onPress={queuedCount > 0 ? onRetryPress : undefined}
        activeOpacity={queuedCount > 0 ? 0.7 : 1}
        disabled={queuedCount === 0}>
        <MaterialCommunityIcons
          name={config.icon}
          size={20}
          color={config.textColor}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.text, {color: config.textColor}]}>
            {config.text}
          </Text>
          {config.subText && (
            <Text style={[styles.subText, {color: config.textColor}]}>
              {config.subText}
            </Text>
          )}
        </View>
        {queuedCount > 0 && (
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={config.textColor}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    gap: wp(3),
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontFamily: Fonts.PoppinsSemiBold,
    fontSize: RFPercentage(pxToPercentage(13)),
    color: '#FFFFFF',
  },
  subText: {
    fontFamily: Fonts.PoppinsRegular,
    fontSize: RFPercentage(pxToPercentage(11)),
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
});

export default NetworkStatusBar;
