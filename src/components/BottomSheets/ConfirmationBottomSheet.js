import {DarkTheme} from '@react-navigation/native';
import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import CustomButton from '../Buttons/customButton';
import {useSelector} from 'react-redux';
import TxtInput from '../TextInput/Txtinput';
import {useButtonColors} from '../../Constants/colorHelper';

const ConfirmationBottomSheet = forwardRef(
  (
    {
      icon: Icon,
      title,
      description,
      onConfirm,
      onCancel,
      confirmText = 'Yes',
      cancelText = 'No',
      requirePassword = false,
      isLoading = false,
    },
    ref,
  ) => {
    const bottomSheetRef = useRef(null);
    const {t} = useTranslation();
    const {isDarkMode, getButtonColor} = useButtonColors();
    const primaryButtonColors = getButtonColor('primary');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const styles = dynamicStyles(isDarkMode, primaryButtonColors);

    useImperativeHandle(ref, () => ({
      open: () => {
        setPassword('');
        setPasswordError('');
        bottomSheetRef.current?.open();
      },
      close: () => bottomSheetRef.current?.close(),
    }));

    const handleConfirm = () => {
      if (requirePassword) {
        const error = validatePassword(password);
        setPasswordError(error);

        if (!error && password) {
          onConfirm(password);
          setPassword('');
        }
      } else {
        onConfirm(); // No password parameter for non-password confirmations
      }
    };

    const handleCancel = () => {
      setPassword('');
      setPasswordError('');
      onCancel();
    };

    const validatePassword = text => {
      if (!text) {
        return t('Password is required');
      }
      if (text.length < 6) {
        return t('Password must be at least 6 characters');
      }
      return '';
    };

    return (
      <RBSheet
        ref={bottomSheetRef}
        height={requirePassword ? 400 : 320}
        closeOnDragDown={true}
        closeOnPressMask={true}
        customStyles={{
          container: {
            backgroundColor: isDarkMode
              ? Colors.darkTheme.secondryColor
              : Colors.lightTheme.backgroundColor,
            borderTopLeftRadius: wp(5),
            borderTopRightRadius: wp(5),
          },
        }}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>{Icon}</View>

          <Text
            style={[
              styles.title,
              {
                color: isDarkMode
                  ? Colors.darkTheme.primaryTextColor
                  : Colors.lightTheme.primaryTextColor,
              },
            ]}>
            {t(title)}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: isDarkMode
                  ? Colors.darkTheme.secondryTextColor
                  : Colors.lightTheme.secondryTextColor,
              },
            ]}>
            {t(description)}
          </Text>

          {requirePassword && (
            <View style={styles.passwordContainer}>
              <TxtInput
                value={password}
                placeholder={t('Enter your password')}
                onChangeText={text => {
                  setPassword(text);
                  setPasswordError(validatePassword(text));
                }}
                secureTextEntry={true}
                autoCapitalize="none"
                error={passwordError}
              />
            </View>
          )}

          <View style={styles.buttonRow}>
            <CustomButton
              text={t(cancelText)}
              onPress={onCancel}
              textStyle={[
                styles.continueButtonText,
                {color: primaryButtonColors.backgroundColor},
              ]}
              containerStyle={[styles.continueButton, styles.BackButton]}
              disabled={isLoading} // Disable cancel during loading
            />
            <CustomButton
              text={isLoading ? t('Processing...') : t(confirmText)}
              onPress={handleConfirm}
              textStyle={styles.continueButtonText}
              containerStyle={[styles.continueButton]}
              disabled={
                isLoading || (requirePassword && (!password || !!passwordError))
              }
              loading={isLoading} // If your CustomButton supports loading prop
            />
          </View>
        </View>
      </RBSheet>
    );
  },
);

export default ConfirmationBottomSheet;

const dynamicStyles = (isDarkMode, primaryButtonColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: wp(5),
      justifyContent: 'center',
    },
    iconContainer: {
      alignSelf: 'center',
      marginBottom: hp(2),
    },
    title: {
      textAlign: 'center',
      fontSize: RFPercentage(2.2),
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(1),
    },
    description: {
      textAlign: 'center',
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      marginBottom: hp(3),
      paddingHorizontal: wp(3),
    },
    passwordContainer: {
      marginBottom: hp(3),
      paddingHorizontal: wp(1),
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: wp(0),
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(2),
      flex: 1,
    },
    continueButtonText: {
      fontSize: RFPercentage(1.6),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    BackButton: {
      borderWidth: 1,
      borderColor: primaryButtonColors.backgroundColor,
      backgroundColor: 'transparent',
    },
  });
