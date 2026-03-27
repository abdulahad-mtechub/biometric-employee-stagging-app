import AsyncStorage from '@react-native-async-storage/async-storage';
import {Formik} from 'formik';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch, useSelector} from 'react-redux';
import * as Yup from 'yup';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import CustomLoader from '../../components/Loaders/CustomLoader';
import TxtInput from '../../components/TextInput/Txtinput';
import CustomSwitch from '../../components/Buttons/CustomSwitch';
import {signupWorker} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {setLanguage} from '../../redux/Slices/authSlice';
import i18n from '../../Translations/i18n';
import {pxToPercentage} from '../../utils/responsive';
import NotificationService from '../../utils/NotificationService';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';

const Signup = ({navigation}) => {
  const language = useSelector(store => store?.auth?.language || 'English');
  const isDarkMode = useSelector(store => store?.theme?.isDarkMode || false);
  const {t} = useTranslation();
  const {showAlert} = useAlert();
  const dispatch = useDispatch();
  const [fcmToken, setFcmToken] = useState(null);
  const localizedAlert = useLocalizedAlert();

  const [state, setState] = useState({
    loading: false,
  });

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        email: Yup.string()
          .email(t('Please enter a valid email address'))
          .required(t('Email is required')),
        password: Yup.string()
          .required(t('Password is required'))
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/,
            t(
              'Password: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char',
            ),
          ),
        confirmPassword: Yup.string()
          .required(t('Confirm Password is required'))
          .oneOf([Yup.ref('password')], t('Passwords do not match')),
        acceptedTerms: Yup.boolean().oneOf(
          [true],
          t('You must accept the Terms and Conditions to continue'),
        ),
      }),
    [t],
  );

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const token = await NotificationService.initialize();
        if (token) {
          setFcmToken(token);
        }

        const unsubscribe = NotificationService.onMessageReceived(
          notification => {
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

    initNotifications();
  }, [showAlert]);
  const handleSignup = useCallback(
    async values => {
      setState(prev => ({...prev, loading: true}));
      try {
        const signupData = {
          email: values.email.trim(),
          password: values.password,
          device_id: fcmToken,
        };

        await AsyncStorage.setItem('signupData', JSON.stringify(signupData));
        const response = await signupWorker(signupData);
        if (response.error !== true) {
          localizedAlert(response, 'success');
          console.log('Signup successful:', response);
          setTimeout(() => {
            navigation.navigate(SCREENS.OTPVERIFICATIONSCREEN, {
              email: values.email,
              flowType: 'register',
              title: t('Verify Your Email'),
              description: t(
                'Enter the 6-digit code sent to your email to verify your account.',
              ),
              dataSignUp: response?.data?.verification || null,
              autoSend: true,
            });
          }, 100);
        } else {
          localizedAlert(response, 'error');
        }
      } catch (error) {
        console.error('Signup error:', error);
        localizedAlert(error, 'error');
      } finally {
        setState(prev => ({...prev, loading: false}));
      }
    },
    [navigation, t, fcmToken, localizedAlert],
  );

  const onLanguageChange = useCallback(
    value => {
      try {
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
      } catch (error) {
        console.error('Language change error:', error);
      }
    },
    [dispatch, t],
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const passwordRules = useCallback(
    password => ({
      lengthMin: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~]/.test(password),
    }),
    [],
  );

  const styles = useMemo(() => dynamicStyles(isDarkMode), [isDarkMode]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <CustomLoader size="large" visible={state.loading} />

      {/* Header with Back Button and Language Dropdown */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={RFPercentage(4)}
            color={
              isDarkMode
                ? Colors.darkTheme.secondryTextColor
                : Colors.lightTheme.iconColor
            }
          />
        </TouchableOpacity>

        <CustomDropDown
          data={[t('English'), t('Español')]}
          selectedValue={language}
          onValueChange={onLanguageChange}
          placeholder={t('Select Language')}
          containerStyle={styles.languageDropdownHeader}
          width={hp(17)}
        />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Svgs.Logo />
          </View>

          <Formik
            initialValues={{
              email: '',
              password: '',
              confirmPassword: '',
              acceptedTerms: false,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSignup}
            validateOnChange={true}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
            }) => {
              const rules = passwordRules(values.password);

              return (
                <View style={styles.formContainer}>
                  <View style={styles.stepContainer}>
                    <View style={styles.headerContainer}>
                      <Text style={styles.heading}>{t('Create Account')}</Text>
                      <Text style={styles.subheading}>
                        {t('Sign up to get started')}
                      </Text>
                    </View>

                    <Text style={styles.label}>
                      {t('Email')} <Text style={styles.starick}>*</Text>
                    </Text>
                    <TxtInput
                      value={values.email}
                      placeholder={t('yourmail@mail.com')}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      inputStyle={{fontSize: RFPercentage(1.6)}}
                      style={{marginBottom: hp(1)}}
                      error={touched.email && errors.email}
                    />

                    <Text style={styles.label}>
                      {t('Password')} <Text style={styles.starick}>*</Text>
                    </Text>
                    <TxtInput
                      value={values.password}
                      placeholder={t('8+ chars, 1 letter, 1 number, 1 symbol')}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      secureTextEntry
                      inputStyle={{fontSize: RFPercentage(1.6)}}
                      style={{marginBottom: hp(2)}}
                      error={touched.password && errors.password}
                    />

                    <Text style={styles.label}>
                      {t('Confirm Password')}{' '}
                      <Text style={styles.starick}>*</Text>
                    </Text>
                    <TxtInput
                      value={values.confirmPassword}
                      placeholder={t('Re-enter your password')}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                      secureTextEntry
                      inputStyle={{fontSize: RFPercentage(1.6)}}
                      style={{marginBottom: hp(2)}}
                      error={touched.confirmPassword && errors.confirmPassword}
                    />

                    {/* Terms and Conditions Toggle */}
                    <View style={styles.termsContainer}>
                      <View style={styles.termsToggleContainer}>
                        <CustomSwitch
                          value={!!values.acceptedTerms}
                          onValueChange={value => {
                            setFieldValue('acceptedTerms', value);
                          }}
                        />
                        <View style={styles.termsTextContainer}>
                          <Text style={styles.termsText}>
                            {t('I agree to the')}{' '}
                            <Text
                              style={styles.termsLink}
                              onPress={() => {
                                Linking.openURL(
                                  'https://biometricpro.app/terms',
                                );
                              }}>
                              {t('Terms and Conditions')}
                            </Text>
                          </Text>
                        </View>
                      </View>
                      {touched.acceptedTerms && errors.acceptedTerms && (
                        <Text style={styles.errorText}>
                          {errors.acceptedTerms}
                        </Text>
                      )}
                    </View>

                    {values.password.length > 0 && (
                      <View style={styles.passwordRulesContainer}>
                        {[
                          {
                            valid: rules.lengthMin,
                            text: t('At least 8 characters'),
                          },
                          {
                            valid: rules.lowercase,
                            text: t('Contains a lowercase letter'),
                          },
                          {
                            valid: rules.uppercase,
                            text: t('Contains an uppercase letter'),
                          },
                          {valid: rules.number, text: t('Contains a number')},
                          {
                            valid: rules.specialChar,
                            text: t('Contains a special character'),
                          },
                        ].map((item, idx) => (
                          <View key={idx} style={styles.passwordRule}>
                            <Icon
                              name={
                                item.valid ? 'check-circle' : 'times-circle'
                              }
                              size={16}
                              color={item.valid ? '#0A9B4C' : '#a0a0a0'}
                            />
                            <Text style={styles.passwordRuleText}>
                              {item.text}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Submit Button */}
                  <View style={styles.buttonContainer}>
                    <CustomButton
                      text={t('Create Account')}
                      onPress={handleSubmit}
                      textStyle={styles.submitButtonText}
                      containerStyle={styles.submitButtonStyle}
                    />
                  </View>
                </View>
              );
            }}
          </Formik>

          <Text style={styles.loginText}>
            {t('Already have an account?')}{' '}
            <Text
              onPress={() => navigation.navigate(SCREENS.LOGIN)}
              style={styles.loginLink}>
              {t('Sign In')}
            </Text>
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Signup;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(2),
      paddingVertical: hp(1),
    },
    backButton: {
      padding: wp(2),
    },
    languageDropdownHeader: {
      zIndex: 10000,
      marginRight: wp(3),
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#ddd',
      borderRadius: 10,
      marginBottom: hp(2),
      overflow: 'hidden',
    },
    picker: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: hp(5),
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: hp(2),
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
    },
    stepContainer: {
      flex: 1,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: hp(3),
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(24)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
      marginBottom: hp(1),
    },
    subheading: {
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      width: wp('85%'),
    },
    label: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginBottom: hp(0.5),
    },
    dropdownField: {
      marginBottom: hp(2),
      zIndex: 1000,
    },
    starick: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: 'red',
      fontFamily: Fonts.PoppinsMedium,
      marginBottom: hp(0.5),
    },
    errorText: {
      color: Colors.error,
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsRegular,
      marginTop: hp(1),
      marginBottom: hp(1),
      marginLeft: wp(2),
    },
    passwordRulesContainer: {
      marginTop: hp(1),
      marginBottom: hp(2),
    },
    passwordRule: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 2,
    },
    passwordRuleText: {
      fontSize: 12,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginLeft: 5,
    },
    buttonContainer: {
      marginTop: hp(4),
    },
    submitButtonStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    loginText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      marginTop: hp(3),
    },
    loginLink: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      textDecorationLine: 'underline',
      fontFamily: Fonts.PoppinsSemiBold,
    },
    termsContainer: {
      marginTop: -hp(1.5),
      marginBottom: hp(2),
    },
    termsToggleContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    termsTextContainer: {
      flex: 1,
      marginLeft: wp(1),
      paddingTop: hp(0.3),
    },
    termsText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.Poppins,
      lineHeight: hp(2.5),
    },
    termsLink: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      textDecorationLine: 'underline',
      fontFamily: Fonts.PoppinsSemiBold,
    },
  });
