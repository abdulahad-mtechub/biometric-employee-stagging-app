import React, {useEffect} from 'react';
import {navigationRef} from '../utils/navigationRef';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {Fonts} from '../Constants/Fonts';
import {Colors} from '../Constants/themeColors';
import {useAlert} from '../Providers/AlertContext';
const {width} = Dimensions.get('window');

const DynamicAlert = ({onPress}) => {
  const {alert, hideAlert} = useAlert();

  useEffect(() => {
    if (alert.visible) {
      const timer = setTimeout(() => {
        hideAlert();
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, [alert.visible]);

  if (!alert.visible) return null;

  const getShadowStyle = () => {
    switch (alert.type) {
      case 'success':
        return styles.successShadow;
      case 'error':
        return styles.errorShadow;
      default:
        return {};
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 30 : 0,
      left: 0,
      right: 0,
      padding: width * 0.045,
      margin: width * 0.04,
      borderRadius: 10,
      zIndex: 1000,
      backgroundColor: '#ebfaf3',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    text: {
      fontFamily: Fonts.PoppinsMedium,
      color: 'white',
      fontSize: RFPercentage(1.7),
      marginLeft: wp(2),
    },
    descriptionText: {
      fontFamily: Fonts.PoppinsMedium,
      color: Colors.darkTheme.primaryTextColor,
      fontSize: RFPercentage(1.5),
    },
    icon: {
      width: width * 0.06,
      height: width * 0.06,
      top: hp(5),
    },
    success: {
      borderColor: '#4CAF50',
    },
    error: {
      borderColor: Colors.error,
      backgroundColor: '#ffeeed',
    },
    successShadow: {
      shadowColor: Colors.success,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
    },
    errorShadow: {
      shadowColor: Colors.error,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
    },
  });
  const handlePress = () => {
    console.log('DynamicAlert alert pressed.', JSON.stringify(alert, null, 2));
    if (onPress) {
      onPress();
    }
    if (alert.type === 'navigateToScreenX' && navigationRef.isReady()) {
      navigationRef.navigate('ScreenX');
    }
    hideAlert();
  };
  return (
    <Animatable.View
      animation={alert.type === 'success' ? 'slideInDown' : 'bounceInRight'}
      duration={500}
      style={[styles.container, styles[alert.type], getShadowStyle(), {}]}>
      <Pressable style={styles.content} onPress={handlePress}>
        <Text
          style={[
            styles.text,
            {
              color: Colors.white,
            },
            alert.type === 'error' ? {color: Colors.error} : {color: '#0CC25F'},
          ]}>
          {alert.message}
        </Text>
      </Pressable>
      {alert.description && (
        <Text style={styles.descriptionText}>{alert.description}</Text>
      )}
    </Animatable.View>
  );
};

export default DynamicAlert;
