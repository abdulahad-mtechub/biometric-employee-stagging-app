import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import React, {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import {useDispatch, useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import AccountSelectionBottomSheet from '../../components/BottomSheets/AccountSelectionBottomSheet';
import CustomButton from '../../components/Buttons/customButton';
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import CustomLoader from '../../components/Loaders/CustomLoader';
import TxtInput from '../../components/TextInput/Txtinput';
import {loginWorker, onlyVerifyEmail} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {FontsSize} from '../../Constants/FontsSize';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';
import {
  setLanguage,
  setLoggedIn,
  setUserData,
} from '../../redux/Slices/authSlice';
import {saveAccount} from '../../redux/Slices/rememberMeSlice';
import i18n from '../../Translations/i18n';
import NotificationService from '../../utils/NotificationService';
import {pxToPercentage} from '../../utils/responsive';

const Login = ({navigation}) => {
  const [email, setEmail] = useState(__DEV__ ? 'gym@mailinator.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'Mtechub@123' : '');
  const [isRemember, setIsRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const {isDarkMode} = useSelector(store => store?.theme);
  const {language} = useSelector(store => store?.auth);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const localizedAlert = useLocalizedAlert();
  const savedAccounts = useSelector(
    state => state.rememberMeSlice.savedAccounts,
  );
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const {showAlert} = useAlert();
  const accountSelectSheetRef = useRef();
  const styles = dynamicStyles(isDarkMode);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const token = await NotificationService.initialize();
        if (token) {
          setFcmToken(token);
          console.log('✅ Notifications login - Token:', token);
        }

        const unsubscribe = NotificationService.onMessageReceived(
          notification => {
            console.log('📩 Notification received:', notification);
            showAlert(
              notification?.notification?.title || 'New Notification',
              'info',
            );
          },
        );

        return () => unsubscribe();
      } catch (error) {
        // console.error('❌ Notification initialization failed:', error);
      }
    };

    const fetchDeviceId = async () => {
      try {
        const id = await DeviceInfo.getUniqueId();
        setDeviceId(id);
        console.log('📱 Device ID:', id);
      } catch (error) {
        console.error('Error fetching device ID:', error);
      }
    };

    initNotifications();
    fetchDeviceId();
    checkSavedAccounts();
  }, []);

  const checkSavedAccounts = async () => {
    try {
      const rememberedAccount = await AsyncStorage.getItem('rememberedAccount');
      if (rememberedAccount) {
        const account = JSON.parse(rememberedAccount);
        setEmail(account.email);
        setPassword(account.password);
        setIsRemember(true);
      }
    } catch (error) {
      console.error('Error checking saved accounts:', error);
    }
  };
  const validateEmail = value => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!value.trim()) {
      return t('Email is required');
    } else if (!emailRegex.test(value.trim())) {
      return t('Enter a valid email address');
    }
    return '';
  };

  // validate password
  const validatePassword = value => {
    if (!value.trim()) {
      return t('Password is required');
    } else if (value.trim().length < 6) {
      return t('Password must be at least 6 characters');
    }
    return '';
  };

  const handleVerify = async () => {
    try {
      const response = await onlyVerifyEmail({email});
      console.log('response Response:', JSON.stringify(response, null, 2));

      if (response?.error === false) {
        setShowVerifyModal(false);

        setTimeout(() => {
          navigation.navigate(SCREENS.OTPVERIFICATIONSCREEN, {
            email: email,
            flowType: 'register',
            title: t('Verify Your Email'),
            description: t(
              'Enter the 6-digit code sent to your email to reset your password.',
            ),
            dataSignUp: response.data,
            autoSend: true,
          });
        }, 100);
      } else {
        showAlert(
          response?.message || 'Failed to resend OTP. Please try again.',
          'error',
        );
      }
    } catch (error) {
      console.error('Verification error:', error);
      showAlert('Something went wrong. Please try again later.', 'error');
    } finally {
    }
  };

  const handleSignIn = async () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;
    if (!deviceId) {
      showAlert(t('Device ID not available. Please try again.'), 'error');
      return;
    }
    try {
      setLoading(true);
      const body = {
        email: email.trim(),
        password: password.trim(),
        device_id: fcmToken,
        // fcm_token: fcmToken,
      };
      console.log('Login Request Body:', JSON.stringify(body, null, 2));
      const response = await loginWorker(body);
      console.log('Login Response:', JSON.stringify(response, null, 2));
      if (!response) {
        showAlert(
          t('No response from server. Check your internet connection.'),
          'error',
        );
        return;
      }

      if (response.error === false && response.success !== false) {
        if (isRemember) {
          dispatch(
            saveAccount({
              email: email,
              password: password.trim(),
            }),
          );
          await AsyncStorage.setItem(
            'rememberedAccount',
            JSON.stringify({email: email, password: password.trim()}),
          );
        } else {
          await AsyncStorage.removeItem('rememberedAccount');
        }
        const data = response?.data;
        dispatch(setUserData(data));
        dispatch(setLoggedIn(true));
        await AsyncStorage.setItem('localuserData', JSON.stringify(data));
        await AsyncStorage.setItem('isLoggedIn', 'true');

        // Debug: Log the full response to see token structure
        console.log('🔍 Login Response:', JSON.stringify(response, null, 2));
        console.log('🔍 Data:', JSON.stringify(data, null, 2));
        console.log('🔍 profile_token:', data?.profile_token);
        console.log('🔍 token:', data?.token);

        // Try both profile_token and token
        const tokenToSave = data?.profile_token || data?.token || '';
        console.log('💾 Saving token:', tokenToSave);

        await AsyncStorage.setItem('jwt_token', tokenToSave);

        // Verify token was saved
        const savedToken = await AsyncStorage.getItem('jwt_token');
        console.log('✅ Saved token:', savedToken);

        localizedAlert(response, 'success');
      } else {
        if (response?.data?.status === 'pending_approval') {
          navigation.navigate(SCREENS.ADMINAPPROVALSCREEN);
          return;
        }
        if (response?.data?.status === 'profile_incomplete') {
          // Save profile_token and worker data before navigating
          const profileData = {
            worker: {
              id: response?.data?.worker_id || null,
              email: email,
              status: 'pending',
              profile_completed: false,
            },
            profile_token: response?.data?.token,
            profile_token_expiry: response?.data?.profile_token_expiry,
            status: 'profile_completion_required',
            message:
              response?.data?.message || 'Complete your profile information.',
            next_step: 'complete_profile',
            api_endpoint:
              response?.data?.actions?.complete_profile ||
              '/public/register-worker',
            instructions:
              response?.data?.instructions ||
              'Use the profile_token to complete your profile',
          };

          // Save to AsyncStorage
          await AsyncStorage.setItem(
            'signupData',
            JSON.stringify({
              email: email,
              password: password.trim(),
            }),
          );
          await AsyncStorage.setItem(
          'profile_token',
          response.data.profile_token,
        );
          // Save the JWT token (not profile_token) for Authorization header
          await AsyncStorage.setItem('jwt_token', response?.data?.token || '');
          await AsyncStorage.setItem(
            'workerProfileData',
            JSON.stringify(profileData),
          );

          console.log(
            '✅ Profile data saved for incomplete profile:',
            profileData,
          );

          navigation.navigate(SCREENS.CREATEWORKERPROFILE);
          return;
        }
        if (response?.data?.status) {
          setShowVerifyModal(true);
          return;
        }
        localizedAlert(response, 'error');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const onLanguageChange = value => {
    // Handle translated language names
    const englishLabel = t('English');
    const spanishLabel = t('Español');

    let langToSet = value;
    if (value === englishLabel) {
      langToSet = 'English';
      i18n.changeLanguage('en');
    } else if (value === spanishLabel) {
      langToSet = 'Español';
      i18n.changeLanguage('es');
    }

    dispatch(setLanguage(langToSet));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
        style={styles.container}>
        <CustomLoader size="large" visible={loading} />

        <CustomDropDown
          data={[t('English'), t('Español')]}
          selectedValue={language}
          onValueChange={onLanguageChange}
          placeholder={t('Select Language')}
          containerStyle={styles.dropdownContainer}
          width={hp(17)}
          dropdownContainerStyle={{
            position: 'absolute',
            zIndex: 10000,
            top: Platform.OS === 'ios' ? hp(4) : hp(6),
          }}
        />

        <View style={styles.logoContainer}>
          <Svgs.Logo />
          <Text style={styles.heading}>{t('Sign In')}</Text>
          <Text style={styles.subheading}>
            {t('Sign in to manage companies, track earnings.')}
          </Text>
        </View>

        <View style={styles.inputsContainer}>
          <Text style={styles.label}>{t('Email')}</Text>

          <TxtInput
            value={email}
            placeholder="yourmail@mail.com"
            onChangeText={text => {
              setEmail(text);
              setEmailError(validateEmail(text));
            }}
            keyboardType="email-address"
            style={{marginBottom: hp(2)}}
            autoCapitalize="none"
            onFocus={() => {
              if (savedAccounts && savedAccounts.length > 0) {
                accountSelectSheetRef.current?.open();
              }
            }}
            error={emailError}
          />

          <Text style={styles.label}>{t('Password')}</Text>
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

          <View style={styles.forgetContainer}>
            <TouchableOpacity
              style={styles.agreeContainer}
              onPress={() => setIsRemember(!isRemember)}>
              <TouchableOpacity onPress={() => setIsRemember(!isRemember)}>
                {isRemember ? (
                  <Svgs.checked
                    height={hp(2.5)}
                    width={hp(2.5)}
                    style={styles.checkIcon}
                  />
                ) : (
                  <Svgs.check
                    height={hp(2.5)}
                    width={hp(2.5)}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
              <Text style={styles.agreeText}>{t('Remember me')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate(SCREENS.FORGET)}>
              <Text style={styles.forgetText}>{t('Forget Password?')}</Text>
            </TouchableOpacity>
          </View>

          <CustomButton
            text={t('Sign In')}
            onPress={handleSignIn}
            textStyle={styles.SignupBtnText}
            containerStyle={styles.SignupBtn}
            disabled={loading}
          />

          {/* <View style={styles.lineContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>{t('OR')}</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              navigation.navigate(SCREENS.FACESCANLOGIN);
            }}
            activeOpacity={0.7}>
            {isDarkMode ? (
              <Svgs.fcWhite width={wp(10)} height={wp(10)} />
            ) : (
              <Svgs.faceScan width={wp(10)} height={wp(10)} />
            )}
          </TouchableOpacity> */}

          <Text style={[styles.agreeText, styles.signupText]}>
            {t("Don't have an account?")}{' '}
            <Text
              onPress={() => navigation.navigate(SCREENS.SIGNUP)}
              style={styles.TermsText}>
              {t('Sign Up')}
            </Text>
          </Text>
        </View>
        <Modal
          animationType="fade"
          transparent={true}
          visible={showVerifyModal}
          onRequestClose={() => setShowVerifyModal(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowVerifyModal(false)}>
            <Pressable style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {/* Close button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowVerifyModal(false)}>
                  <Svgs.EmailExpired width={wp(5)} height={wp(5)} />
                </TouchableOpacity>

                {/* Icon */}
                <View style={styles.modalIconContainer}>
                  <Svgs.EmailVerification width={wp(20)} height={wp(20)} />
                </View>

                {/* Title */}
                <Text style={styles.modalTitle}>{t('Verify Your Email')}</Text>

                {/* Message */}
                <Text style={styles.modalMessage}>
                  {t(
                    'Your account has not been verified.\nPlease check your email for the verification link.\nDidn’t receive it?',
                  )}
                </Text>
                <View style={styles.modalButtonsContainer}>
                  <CustomButton
                    text={t('Resend Verification Email')}
                    onPress={handleVerify}
                    textStyle={styles.verifyButtonText}
                    containerStyle={styles.verifyButton}
                  />
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        <AccountSelectionBottomSheet
          refRBSheet={accountSelectSheetRef}
          accounts={savedAccounts}
          selectedEmail={email}
          onSelectAccount={item => {
            setEmail(item.email);
            setPassword(item.password);
            accountSelectSheetRef.current?.close();
          }}
          onAddAccount={() => {
            setEmail('');
            setPassword('');
            accountSelectSheetRef.current?.close();
          }}
          onAddSelected={() => {
            setEmail('');
            setPassword('');
            accountSelectSheetRef.current?.close();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    logoContainer: {
      alignItems: 'center',
      paddingTop: hp(5),
      paddingBottom: hp(3),
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(28)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginVertical: hp(1.5),
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
    },
    subheading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      width: wp(80),
      marginBottom: hp(4),
    },
    label: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      textAlign: 'left',
      width: wp(80),
      marginBottom: hp(0.5),
    },
    inputsContainer: {
      paddingHorizontal: wp(10),
      paddingBottom: hp(5),
    },
    agreeText: {
      textAlign: 'left',
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      marginLeft: wp(2),
    },
    TermsText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      textDecorationLine: 'underline',
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
    },
    agreeContainer: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    checkIcon: {
      // marginTop: hp(0.6),
    },
    forgetContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    forgetText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      textDecorationLine: 'underline',
    },
    SignupBtn: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginTop: hp(3),
    },
    SignupBtnText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    continueBtn: {
      backgroundColor: 'transparent',
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginTop: hp(3),
      // borderWidth: 2,
      // borderColor: isDarkMode
      //   ? Colors.darkTheme.BorderGrayColor
      //   : Colors.lightTheme.BorderGrayColor,
    },
    continueBtnText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.NunitoSemiBold,
    },
    lineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: hp(3),
    },
    line: {
      flex: 1,
      height: hp(0.1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    orText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsMedium,
      marginHorizontal: wp(2.5),
    },
    signupText: {
      textAlign: 'center',
      marginTop: hp(4),
    },
    dropdownContainer: {
      alignSelf: 'flex-end',
      zIndex: 1000,
      marginRight: wp(5),
      marginTop: hp(2),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(5),
    },
    modalContainer: {
      width: '100%',
      maxWidth: wp(90),
      borderRadius: wp(4),
      overflow: 'hidden',
    },
    modalContent: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      borderRadius: wp(4),
      padding: wp(6),
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: wp(4),
      right: wp(4),
      zIndex: 1,
    },
    modalIconContainer: {
      marginBottom: hp(2),
    },
    modalTitle: {
      fontSize: FontsSize.size24,
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      marginBottom: hp(1.5),
    },
    modalMessage: {
      fontSize: FontsSize.size16,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      lineHeight: hp(2.5),
      marginBottom: hp(3),
    },
    modalButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      gap: wp(3),
    },
    resendButton: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
      alignItems: 'center',
    },
    resendButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontSize: FontsSize.size16,
      fontFamily: Fonts.PoppinsMedium,
    },
    verifyButton: {
      alignItems: 'center',
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
    },
    verifyButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontSize: FontsSize.size16,
      fontFamily: Fonts.PoppinsMedium,
    },
  });
