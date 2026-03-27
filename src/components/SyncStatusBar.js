/**
 * SyncStatusBar.js
 *
 * Status bar component to display syncing status of offline requests
 * Shows syncing progress, success, and failure states
 */

import React, {useEffect, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Fonts} from '../Constants/Fonts';
import {pxToPercentage} from '../utils/responsive';

const SyncStatusBar = ({
  status = 'idle', // 'idle', 'syncing', 'success', 'error'
  count = 0,
  successCount = 0,
  failedCount = 0,
  isDarkMode = false,
}) => {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [visible, setVisible] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  useEffect(() => {
    // Clear any existing timer
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }

    // Show bar when syncing or when there's a result
    if (status !== 'idle') {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto-hide success/error messages after 5 seconds
      if (status === 'success' || status === 'error') {
        const timer = setTimeout(() => {
          hideBar();
        }, 5000);
        setAutoHideTimer(timer);
      }
    } else {
      hideBar();
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [status, count, successCount, failedCount]);

  const hideBar = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible && status === 'idle') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: 'cloud-sync',
          text: `Syncing ${count} offline request${count > 1 ? 's' : ''}...`,
          subText: 'Please wait',
          backgroundColor: '#4A90E2', // Blue
          textColor: '#FFFFFF',
          showSpinner: true,
        };

      case 'success':
        const hasFailures = failedCount > 0;
        return {
          icon: hasFailures ? 'alert-circle' : 'check-circle',
          text: hasFailures
            ? `${successCount} synced, ${failedCount} failed`
            : `${successCount} request${
                successCount > 1 ? 's' : ''
              } synced successfully!`,
          subText: hasFailures ? 'Failed requests will retry later' : '',
          backgroundColor: hasFailures ? '#FFA500' : '#4CAF50', // Orange or Green
          textColor: '#FFFFFF',
          showSpinner: false,
        };

      case 'error':
        return {
          icon: 'alert-circle',
          text: 'Sync failed',
          subText: 'Will retry when connection improves',
          backgroundColor: '#FF6B6B', // Red
          textColor: '#FFFFFF',
          showSpinner: false,
        };

      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <View style={styles.content}>
        {config.showSpinner ? (
          <Animated.View style={styles.spinnerContainer}>
            <MaterialCommunityIcons
              name={config.icon}
              size={20}
              color={config.textColor}
            />
          </Animated.View>
        ) : (
          <MaterialCommunityIcons
            name={config.icon}
            size={20}
            color={config.textColor}
          />
        )}
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
      </View>
    </Animated.View>
  );
};

export default SyncStatusBar;

const styles = StyleSheet.create({
  container: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  textContainer: {
    marginLeft: wp(3),
    flex: 1,
  },
  text: {
    fontFamily: Fonts.PoppinsMedium,
    fontSize: RFPercentage(pxToPercentage(13)),
    color: '#FFFFFF',
  },
  subText: {
    fontFamily: Fonts.PoppinsRegular,
    fontSize: RFPercentage(pxToPercentage(11)),
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: hp(0.2),
  },
  spinnerContainer: {
    // Add rotation animation if needed
  },
});
