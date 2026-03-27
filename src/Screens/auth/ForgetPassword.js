import React, {useEffect, useRef, useState} from 'react';
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
import SuccessBottomSheet from '../../components/BottomSheets/SuccessBottomSheet';
import CustomButton from '../../components/Buttons/customButton';
import StackHeader from '../../components/Header/StackHeader';
import CustomLoader from '../../components/Loaders/CustomLoader';
import TxtInput from '../../components/TextInput/Txtinput';
import {
  forgotPassword,
  resendVerifyEmail,
  resetPassword,
  verifyOtp,
} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {FontsSize} from '../../Constants/FontsSize';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {Formik} from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';

const CELL_COUNT = 6;

const ForgetPassword = ({navigation, route}) => {
  const indexx = route.params?.indexx;
  const styles = dynamicStyles(isDarkMode);
  const {isDarkMode} = useSelector(store => store.theme);
  const {showAlert} = useAlert();
  const [ResetToken, setResetToken] = useState('');
  const [index, setIndex] = useState(indexx || 0);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [value, setValue] = useState('');
  const [receiveOTP, setReceiveOTP] = useState('');
  const [timer, setTimer] = useState(60);
  const localizedAlert = useLocalizedAlert();
  const [loading, setLoading] = useState(false);
  const [verifyOtploading, setverifyOtp] = useState(false);
  const [invalidOtp, setInvalidOtp] = useState(false);
  const successBtmSheetRef = useRef();
  const ref = useBlurOnFulfill({value, cellCount: CELL_COUNT});
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  const {t} = useTranslation();

  const checkEmailInline = email => {
    if (!email || email.trim().length === 0) {
      return t('Please enter your email address');
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return t('Please enter a valid email address');
    }
    return '';
  };

  const BackHandler = () => {
    if (index === 1) {
      setIndex(0);
    } else if (index === 2) {
      setIndex(1);
    } else if (index === 0) {
      navigation.goBack();
    }
  };

  useEffect(() => {
    if (index === 1) {
      let interval = null;
      if (timer > 0) {
        interval = setInterval(() => {
          setTimer(prev => prev - 1);
        }, 200);
      }
      return () => clearInterval(interval);
    }
  }, [timer, index]);

  const handleSendCode = async () => {
    const error = checkEmailInline(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setLoading(true);

    try {
      const response = await forgotPassword({email});
      console.log(
        'Forgot Password Response:',
        JSON.stringify(response, null, 2),
      );
      if (response?.error === false) {
        setReceiveOTP(response?.data?.otp);
        localizedAlert(response, 'success');
        setIndex(1);
      } else {
        localizedAlert(response, 'error');
      }
    } catch (error) {
      localizedAlert(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const error = checkEmailInline(email);
    if (error) {
      showAlert(error, 'error');
      return;
    }

    setTimer(60);
    setLoading(true);

    try {
      const response = await forgotPassword({email});

      if (response?.error === false) {
        setReceiveOTP(response?.data?.otp);
        localizedAlert(response, 'success');
      } else {
        localizedAlert(response, 'error');
      }
    } catch (error) {
      localizedAlert(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!value || value?.length === 0) {
      showAlert(t('Please Enter OTP Code'), 'error');
      return;
    }

    setverifyOtp(true);

    try {
      const response = await verifyOtp({
        email,
        code: value,
      });

      if (response?.error === false) {
        localizedAlert(response, 'success');
        setResetToken(response?.data?.resetToken);
        setIndex(2);
      } else {
        localizedAlert(response, 'error');
        setInvalidOtp(true);
      }
    } catch (error) {
      localizedAlert(error, 'error');
      setInvalidOtp(true);
    } finally {
      setverifyOtp(false);
    }
  };

  const ForgetPasswordUI = () => {
    return (
      <View style={styles.screenContainer}>
        <View style={{flex: 1, paddingHorizontal: wp(5)}}>
          <View style={styles.screenTitleContainer}>
            <Text style={styles.screenTitle}>{t('Forget Password')}</Text>
            <Text style={[styles.screenDesc]}>
              {t(
                "Enter your email below, and we'll send you a 6-digit code to reset your password.",
              )}
            </Text>
          </View>

          <Text style={styles.label}>{t('Email')}</Text>
          <TxtInput
            value={email}
            containerStyle={{marginBottom: hp(1)}}
            placeholder={t('yourmail@mail.com')}
            onChangeText={text => {
              setEmail(text);
              setEmailError(checkEmailInline(text));
            }}
            error={emailError !== '' ? emailError : null}
          />
        </View>
        <CustomLoader size="large" visible={loading} />

        <View style={styles.btnContainer}>
          <CustomButton
            containerStyle={styles.btn}
            text={t('Send Code')}
            textStyle={styles.btnText}
            onPress={handleSendCode}
          />
        </View>
      </View>
    );
  };

  const VerifyCodeUI = () => {
    return (
      <View style={styles.screenContainer}>
        <View style={{flex: 0.1, paddingHorizontal: wp(1)}}>
          <CustomLoader size="large" visible={verifyOtploading} />

          <View style={styles.screenTitleContainer}>
            <Text style={styles.screenTitle}>{t('Enter OTP Code')}</Text>
            <Text style={[styles.screenDesc]}>
              {t(
                'Enter the 6-digit code sent to your email to verify and reset your password.',
              )}
            </Text>
            {/* Remove this line in production - it shows the OTP for testing */}
            {/* <Text style={[styles.screenDesc]}>
              {t('Your OTP is')} {receiveOTP}
            </Text> */}
          </View>

          <CodeField
            ref={ref}
            {...props}
            value={value}
            onChangeText={text => {
              setValue(text);
              setInvalidOtp(false);
            }}
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
              {t('Invalid OTP. Please try again.')}
            </Text>
          )}
          <View
            style={{
              alignItems: 'center',
              marginTop: hp(3),
              paddingHorizontal: wp(4),
            }}>
            <Text style={[styles.resendCode]}>{t("Didn't receive code?")}</Text>
            {timer > 0 ? (
              <Text
                style={[
                  styles.resendCode,
                  {
                    color: isDarkMode
                      ? Colors.darkTheme.primaryColor
                      : Colors.lightTheme.primaryColor,
                    fontFamily: Fonts.NunitoBold,
                  },
                ]}>
                {t('Resend Code')} in {timer < 10 ? `0${timer}` : timer}s
              </Text>
            ) : (
              <Text
                onPress={handleResend}
                style={[
                  styles.resendCode,
                  {
                    color: isDarkMode
                      ? Colors.darkTheme.primaryColor
                      : Colors.lightTheme.primaryColor,
                    fontFamily: Fonts.NunitoBold,
                    textDecorationLine: 'underline',
                  },
                ]}>
                {t('Resend Code')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.btnContainer}>
          <CustomButton
            containerStyle={styles.btn}
            text={t('Verify Code')}
            textStyle={styles.btnText}
            onPress={handleVerifyCode}
          />
        </View>
      </View>
    );
  };

  const ResetPasswordUI = () => {
    const {showAlert} = useAlert();
    const {isDarkMode} = useSelector(store => store.theme);
    const [loading, setLoading] = useState(false);

    const ResetPasswordSchema = Yup.object().shape({
      password: Yup.string()
        .required('Password is required')
        .matches(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          'Password must be at least 8 characters with letters, numbers, and special characters',
        ),
      confirmPassword: Yup.string()
        .required('Confirm Password is required')
        .oneOf([Yup.ref('password'), null], 'Passwords must match'),
    });

    const passwordRules = (password, confirmPassword) => ({
      length: (password || '').length >= 8,
      lowercase: /[a-z]/.test(password || ''),
      uppercase: /[A-Z]/.test(password || ''),
      number: /\d/.test(password || ''),
      specialChar: /[!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~]/.test(
        password || '',
      ),
    });

    const handleResetPasswordSubmit = async values => {
      setLoading(true);
      try {
        const response = await resetPassword({
          email: email,
          code: value,
          newPassword: values.password,
        });
        if (response?.error === false) {
          localizedAlert(response, 'success');
          setTimeout(() => {
            successBtmSheetRef.current?.open();
          }, 200);
        } else {
          localizedAlert(response, 'error');
        }
      } catch (error) {
        localizedAlert(error, 'error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Formik
          initialValues={{password: '', confirmPassword: ''}}
          validationSchema={ResetPasswordSchema}
          onSubmit={handleResetPasswordSubmit}
          validateOnChange={true}
          validateOnBlur={true}>
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            touched,
            errors,
            isValid,
            dirty,
          }) => {
            const rules = passwordRules(
              values.password,
              values.confirmPassword,
            );

            return (
              <View style={styles.screenContainer}>
                <Text style={styles.screenTitle}>{t('Update Password')}</Text>
                <Text style={styles.screenDesc}>
                  {t(
                    'Your password must be at least 8 characters long with letters, numbers, and special characters.',
                  )}
                </Text>

                <Text style={styles.label}>{t('New Password')}</Text>
                <TxtInput
                  placeholder={t('Enter new password')}
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={() => handleBlur('password')}
                  secureTextEntry
                  error={touched.password && errors.password}
                />

                <Text style={[styles.label, {marginTop: wp(2)}]}>
                  {t('Confirm Password')}
                </Text>
                <TxtInput
                  placeholder={t('Re-enter password')}
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={() => handleBlur('confrimPassword')}
                  secureTextEntry
                  error={touched.confirmPassword && errors.confirmPassword}
                />

                {values?.password?.length > 0 && (
                  <View style={styles.passwordRulesContainer}>
                    {[
                      {valid: rules.length, text: t('At least 8 characters')},
                      {
                        valid: rules.lowercase,
                        text: t('Contains lowercase letter'),
                      },
                      {
                        valid: rules.uppercase,
                        text: t('Contains uppercase letter'),
                      },
                      {valid: rules.number, text: t('Contains number')},
                      {
                        valid: rules.specialChar,
                        text: t('Contains special character'),
                      },
                    ].map((item, idx) => (
                      <View key={idx} style={styles.passwordRuleItem}>
                        <Icon
                          name={item.valid ? 'check-circle' : 'times-circle'}
                          size={20}
                          color={item.valid ? '#0A9B4C' : '#a0a0a0'}
                        />
                        <Text style={styles.passwordRuleText}>{item.text}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <CustomButton
                  text={
                    loading ? t('Resetting Password...') : t('Reset Password')
                  }
                  onPress={handleSubmit}
                  containerStyle={[
                    styles.btn,
                    {opacity: !isValid || !dirty ? 0.6 : 1},
                  ]}
                  textStyle={styles.btnText}
                  disabled={!isValid || !dirty || loading}
                />
              </View>
            );
          }}
        </Formik>
      </ScrollView>
    );
  };

  const renderView = () => {
    switch (index) {
      case 1:
        return VerifyCodeUI();
      case 2:
        return <ResetPasswordUI />;
      default:
        return ForgetPasswordUI();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
        style={{
          flex: 1,
          backgroundColor: isDarkMode
            ? Colors.darkTheme.backgroundColor
            : Colors.lightTheme.backgroundColor,
        }}>
        <StackHeader
          title={t('Reset Password')}
          headerTxtStyle={{
            textAlign: 'left',
            fontSize: RFPercentage(2.6),
            fontFamily: Fonts.PoppinsSemiBold,
            color: isDarkMode
              ? Colors.darkTheme.primaryTextColor
              : Colors.lightTheme.primaryTextColor,
          }}
          headerStyle={{marginTop: hp(2)}}
          onBackPress={BackHandler}
        />
        {renderView()}
      </ScrollView>

      <SuccessBottomSheet
        refRBSheet={successBtmSheetRef}
        text={t('Password Reset Successfully') + '!'}
        BtnText={t('Go to Login')}
        onBtnPress={() => {
          navigation.replace(SCREENS.LOGIN);
          successBtmSheetRef.current?.close();
        }}
      />
    </View>
  );
};

export default ForgetPassword;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    screenContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
      paddingTop: hp(4),
      justifyContent: 'flex-start',
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
      marginBottom: hp(4),
      lineHeight: RFPercentage(3.2),
    },
    label: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
      marginTop: hp(2),
    },
    txtInputContainer: {
      marginBottom: hp(1.5),
    },
    errorText: {
      color: '#D32F2F',
      fontSize: RFPercentage(1.6),
      marginBottom: hp(1),
      marginTop: hp(0.3),
    },
    btn: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.6),
      borderRadius: wp(3),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: hp(4),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    btnText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
    },
    passwordRulesContainer: {
      marginTop: hp(2),
      paddingHorizontal: wp(1),
    },
    passwordRuleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: hp(0.3),
    },
    passwordRuleText: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginLeft: wp(2),
    },
    codeFieldRoot: {
      marginTop: wp(2),
      width: '100%',
      alignSelf: 'center',
    },
    cell: {
      width: wp(14),
      height: hp(8),
      lineHeight: RFPercentage(4),
      fontSize: FontsSize.size24,
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#FAFAFA',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      borderWidth: 1,
      textAlign: 'center',
      borderRadius: wp(5),
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#FAFAFA',
      fontFamily: Fonts.PoppinsBold,
      textAlignVertical: 'center',
    },
    focusCell: {
      backgroundColor: isDarkMode
        ? `${Colors.darkTheme.primaryColor}20`
        : `${Colors.lightTheme.primaryColor}20`,
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    errorOtp: {
      backgroundColor: '#fee2e2',
      borderWidth: 1,
      borderColor: '#dc2626',
    },
    label: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: FontsSize.size14,
      fontFamily: Fonts.PoppinsMedium,
      marginBottom: hp('1%'),
      textAlign: 'left',
      alignSelf: 'flex-start',
      marginTop: hp(3),
    },
    resendCode: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: FontsSize.size18,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginRight: wp(1),
    },

    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      height: '50%',
    },
    btnContainer: {
      paddingBottom: hp(5),
      justifyContent: 'space-between',
      paddingHorizontal: wp(5),
    },
    invalidOtpText: {
      color: '#dc2626',
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.NunitoBold,
      marginTop: hp(1),
      textAlign: 'center',
    },
  });
