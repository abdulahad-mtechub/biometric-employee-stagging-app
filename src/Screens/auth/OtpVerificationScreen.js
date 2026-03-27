import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import CustomButton from '../../components/Buttons/customButton';
import StackHeader from '../../components/Header/StackHeader';
import CustomLoader from '../../components/Loaders/CustomLoader';
import {Fonts} from '../../Constants/Fonts';
import {FontsSize} from '../../Constants/FontsSize';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {verifyEmail, resendVerifyEmail} from '../../Constants/api';
import {SCREENS} from '../../Constants/Screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';

const CELL_COUNT = 6;

const OtpVerificationScreen = ({navigation, route}) => {
  const {
    email,
    flowType = 'forgotPassword',
    onVerifySuccess,
    onResendCode,
    title,
    description,
    resendButtonText = 'Resend Code',
    verifyButtonText = 'Verify Code',
    autoSend = false,
    dataSignUp = {},
    apiConfig = {},
  } = route.params || {};

  // State to store the current otpToken (initially from dataSignUp)
  const [otpToken, setOtpToken] = useState(dataSignUp?.otpToken || '');

  const {isDarkMode} = useSelector(store => store.theme);
  const {showAlert} = useAlert();
  const localizedAlert = useLocalizedAlert();
  const {t} = useTranslation();
  const [value, setValue] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [invalidOtp, setInvalidOtp] = useState(false);
  const [receiveOTP, setReceiveOTP] = useState('');

  const ref = useBlurOnFulfill({value, cellCount: CELL_COUNT});
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  // Default titles based on flow type
  const getDefaultTitles = () => {
    switch (flowType) {
      case 'register':
        return {
          title: t('Verify Email'),
          description: t(
            'Enter the 6-digit code sent to your email to verify your account.',
          ),
        };
      case 'changeEmail':
        return {
          title: t('Verify New Email'),
          description: t(
            'Enter the 6-digit code sent to your new email address.',
          ),
        };
      case 'changePhone':
        return {
          title: t('Verify Phone Number'),
          description: t('Enter the 6-digit code sent to your phone number.'),
        };
      default: // forgotPassword
        return {
          title: t('Enter Verification Code'),
          description: t(
            'Enter the 6-digit code sent to your email to reset your password.',
          ),
        };
    }
  };

  const defaultTitles = getDefaultTitles();
  const screenTitle = title || defaultTitles.title;
  const screenDescription = description || defaultTitles.description;

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    // Auto-send OTP if configured
    if (autoSend && onResendCode) {
      handleResendCode();
    }
  }, [autoSend]);

  const handleVerifyCode = async () => {
    if (!value || value.length !== CELL_COUNT) {
      // showAlert(
      //   t(`Please enter ${CELL_COUNT} digit verification code`),
      //   'error',
      // );
      return;
    }

    setLoading(true);
    setInvalidOtp(false);

    try {
      let success = false;

      // If custom verification function is provided, use it
      if (onVerifySuccess) {
        success = await onVerifySuccess(value);
      } else {
        const data = {
          otp_token: otpToken,
          verification_code: value,
        };
        console.log('OTP Verification Data:', JSON.stringify(data, null, 3));

        const response = await verifyEmail(data);
        console.log(
          'OTP Verification Response:',
          JSON.stringify(response, null, 3),
        );

        // Store profile token
        await AsyncStorage.setItem(
          'profile_token',
          response.data.profile_token,
        );

        // Store complete user data for face scanning
        await AsyncStorage.setItem(
          'profile_user_data',
          JSON.stringify(response.data),
        );
        console.log('✅ Stored complete user data for profile');

        // Also try to extract and store userId separately
        if (response.data?.user_id) {
          await AsyncStorage.setItem(
            'profile_user_id',
            JSON.stringify(response.data.user_id),
          );
          console.log('✅ Stored user_id:', response.data.user_id);
        } else if (response.data?.id) {
          await AsyncStorage.setItem(
            'profile_user_id',
            JSON.stringify(response.data.id),
          );
          console.log('✅ Stored user id:', response.data.id);
        }

        if (response?.error === false) {
          localizedAlert(response, 'success');
          // Navigate back with success result
          navigation.navigate(SCREENS.CREATEWORKERPROFILE, {
            userData: response.data,
          });
        } else {
          // Handle invalid OTP
          setInvalidOtp(true);
          localizedAlert(response, 'error');
        }
      }
    } catch (error) {
      setInvalidOtp(true);
      // localizedAlert(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setTimer(60);
    setValue('');
    setInvalidOtp(false);

    try {
      if (onResendCode) {
        const otp = await onResendCode();
        if (otp) {
          // If your custom resend returns a new otpToken, update it here
          if (otp.otpToken) setOtpToken(otp.otpToken);
          setReceiveOTP(otp);
          localizedAlert(otp, 'success');
        }
      } else {
        // Default resend logic
        const response = await resendVerifyEmail({email});
        if (response?.error === false) {
          // Update otpToken from response
          if (response?.data?.otpToken) setOtpToken(response.data.otpToken);
          setReceiveOTP(response?.data?.otp || '123456');
          localizedAlert(response, 'success');
        } else {
          localizedAlert(response, 'error');
        }
      }
    } catch (error) {
      // localizedAlert(error, 'error');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        <StackHeader
          title={screenTitle}
          headerTxtStyle={styles.headerText}
          headerStyle={styles.headerStyle}
          onBackPress={handleBack}
        />

        <View style={styles.screenContainer}>
          <CustomLoader size="large" visible={loading} />

          <View style={styles.screenTitleContainer}>
            <Text style={styles.screenDesc}>{screenDescription}</Text>

            {/* {email && (
              <Text style={styles.emailText}>
                {t('Sent to')}: {email}
              </Text>
            )} */}
          </View>

          <CodeField
            ref={ref}
            {...props}
            value={value}
            onChangeText={setValue}
            cellCount={CELL_COUNT}
            rootStyle={styles.codeFieldRoot}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            renderCell={({index, symbol, isFocused}) => (
              <Text
                key={index}
                style={[
                  styles.cell,
                  isFocused && styles.focusCell,
                  invalidOtp && styles.errorOtp,
                ]}
                onLayout={getCellOnLayoutHandler(index)}>
                {symbol || (isFocused ? <Cursor /> : null)}
              </Text>
            )}
          />

          {invalidOtp && (
            <Text style={styles.invalidOtpText}>
              {t('Invalid verification code. Please try again.')}
            </Text>
          )}

          <View style={styles.resendContainer}>
            <Text style={styles.resendCode}>{t("Didn't receive code?")}</Text>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                {t('Resend Code')} in {timer < 10 ? `0${timer}` : timer}s
              </Text>
            ) : (
              <Text style={styles.resendLink} onPress={handleResendCode}>
                {t('Resend Code')}
              </Text>
            )}
          </View>

          <CustomButton
            containerStyle={styles.btn}
            text={verifyButtonText}
            textStyle={styles.btnText}
            onPress={handleVerifyCode}
            disabled={loading || value.length !== CELL_COUNT}
          />
        </View>
      </ScrollView>
    </View>
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
    headerText: {
      textAlign: 'left',
      fontSize: RFPercentage(2.6),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    headerStyle: {
      marginTop: hp(2),
    },
    screenContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
      paddingTop: hp(4),
    },
    screenTitleContainer: {
      marginBottom: hp(4),
      alignItems: 'center',
    },
    screenTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(3.5),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      marginBottom: hp(2),
    },
    screenDesc: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      lineHeight: RFPercentage(3.2),
      marginBottom: hp(1),
    },
    emailText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      textAlign: 'center',
      marginTop: hp(1),
    },
    testOtpText: {
      fontFamily: Fonts.PoppinsBold,
      fontSize: RFPercentage(2),
      color: '#0A9B4C',
      textAlign: 'center',
      marginTop: hp(1),
    },
    codeFieldRoot: {
      marginTop: hp(2),
      width: '100%',
      alignSelf: 'center',
    },
    cell: {
      width: wp(12),
      height: hp(6),
      lineHeight: hp(5.5),
      fontSize: FontsSize.size20,
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#FAFAFA',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      borderWidth: 1,
      textAlign: 'center',
      borderRadius: wp(3),
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E0E0E0',
      fontFamily: Fonts.PoppinsSemiBold,
    },
    focusCell: {
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderWidth: 2,
    },
    errorOtp: {
      backgroundColor: '#FEE2E2',
      borderColor: '#DC2626',
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: hp(3),
      marginBottom: hp(4),
    },
    resendCode: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    timerText: {
      fontFamily: Fonts.NunitoBold,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      marginTop: hp(0.5),
    },
    resendLink: {
      fontFamily: Fonts.NunitoBold,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      marginTop: hp(0.5),
      textDecorationLine: 'underline',
    },
    invalidOtpText: {
      color: '#DC2626',
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.NunitoSemiBold,
      textAlign: 'center',
      marginTop: hp(1),
    },
    btn: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.6),
      borderRadius: wp(3),
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      bottom: hp(4),
      left: wp(5),
      right: wp(5),
    },
    btnText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
    },
  });

export default OtpVerificationScreen;
