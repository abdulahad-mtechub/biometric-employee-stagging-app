import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';

import {Fonts} from '../../Constants/Fonts';
import CustomButton from '../../components/Buttons/customButton';
import TxtInput from '../../components/TextInput/Txtinput';
import {Colors} from '../../Constants/themeColors';
import StackHeader from '../../components/Header/StackHeader';
import CustomLoader from '../../components/Loaders/CustomLoader';
import {useAlert} from '../../Providers/AlertContext';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {changePassword} from '../../Constants/api';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';

const ChangePassword = ({navigation}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const localizedAlert = useLocalizedAlert();
  const {isDarkMode} = useSelector(store => store.theme);
  const {user} = useSelector(store => store?.auth);
  const token = user?.token;

  const styles = dynamicStyles(isDarkMode);
  const {showAlert} = useAlert();
  const {t} = useTranslation();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert(t('Please fill all the fields.'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('Passwords do not match.'));
      return;
    } else {
      setConfirmPasswordError('');
    }

    const rules = validatePasswordRules(newPassword, confirmPassword);
    const allValid = Object.values(rules).every(Boolean);

    if (!allValid) {
      showAlert(t('Please meet all password requirements.'), 'error');
      return;
    }

    const body = {
      oldPassword: currentPassword,
      newPassword: newPassword,
    };

    try {
      setLoading(true);
      const response = await changePassword(body, token);
      if (response?.error === false) {
        localizedAlert(response, 'success');
        navigation.goBack();
      } else {
        localizedAlert(response, 'error');
      }
    } catch (error) {
      localizedAlert(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordRules = (password, confirmPassword) => {
    return {
      lengthMin: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~]/.test(password),
      match: password && confirmPassword && password === confirmPassword,
    };
  };

  const rules = validatePasswordRules(newPassword, confirmPassword);
  const allValid = Object.values(rules).every(Boolean);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{paddingBottom: hp(12)}}>
        <StackHeader
          title={t('Change Password')}
          headerTxtStyle={{
            textAlign: 'left',
            fontSize: RFPercentage(2.2),
            fontFamily: Fonts.PoppinsSemiBold,
          }}
          headerStyle={{
            paddingVertical: hp(2),
            backgroundColor: isDarkMode
              ? Colors.darkTheme.secondryColor
              : Colors.lightTheme.backgroundColor,
          }}
          onBackPress={() => navigation.goBack()}
        />

        <CustomLoader size="large" visible={loading} />

        <View style={styles.content}>
          {/* Current Password */}
          <Text style={styles.label}>{t('Current Password')}</Text>
          <TxtInput
            value={currentPassword}
            containerStyle={{
              marginBottom: hp(1),
              backgroundColor: isDarkMode
                ? Colors.darkTheme.backgroundColor
                : 'transparent',
            }}
            placeholder={t('Enter current password')}
            onChangeText={setCurrentPassword}
            secureTextEntry={true}
            inputStyle={{fontSize: RFPercentage(1.6)}}
          />

          {/* New Password */}
          <Text style={styles.label}>{t('New Password')}</Text>
          <TxtInput
            value={newPassword}
            containerStyle={{
              marginBottom: hp(1),
              backgroundColor: isDarkMode
                ? Colors.darkTheme.backgroundColor
                : 'transparent',
            }}
            placeholder={t('Enter new password')}
            onChangeText={setNewPassword}
            secureTextEntry={true}
            inputStyle={{fontSize: RFPercentage(1.6)}}
          />

          <Text style={styles.label}>{t('Re-Enter Password')}</Text>
          <TxtInput
            value={confirmPassword}
            containerStyle={{
              marginBottom: hp(1),
              backgroundColor: isDarkMode
                ? Colors.darkTheme.backgroundColor
                : 'transparent',
            }}
            placeholder={t('Re-Enter Password')}
            onChangeText={text => {
              setConfirmPassword(text);
              if (newPassword === text) {
                setConfirmPasswordError('');
              }
            }}
            secureTextEntry={true}
            inputStyle={{fontSize: RFPercentage(1.6)}}
          />

          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}

          {newPassword?.length > 0 && (
            <View style={styles.passwordRulesContainer}>
              {[
                {key: 'lengthMin', text: t('At least 8 characters')},
                {key: 'uppercase', text: t('Contains an uppercase letter')},
                {key: 'lowercase', text: t('Contains a lowercase letter')},
                {key: 'number', text: t('Contains a number')},
                {key: 'specialChar', text: t('Contains a special character')},
                {key: 'match', text: t('Passwords match')},
              ].map((item, idx) => (
                <View key={idx} style={styles.passwordRuleItem}>
                  <Icon
                    name={rules[item.key] ? 'check-circle' : 'times-circle'}
                    size={15}
                    color={rules[item.key] ? '#0A9B4C' : '#a0a0a0'}
                  />
                  <Text
                    style={[
                      styles.passwordRuleText,
                      {
                        color: rules[item.key]
                          ? '#0A9B4C'
                          : isDarkMode
                          ? Colors.darkTheme.primaryTextColor
                          : Colors.lightTheme.secondryTextColor,
                      },
                    ]}>
                    {' '}
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.btnContainer}>
        <CustomButton
          text={t('Update')}
          onPress={handleChangePassword}
          textStyle={styles.continueButtonText}
          containerStyle={[
            styles.continueButton,
            {opacity: allValid ? 1 : 0.5},
          ]}
          disabled={!allValid || loading}
        />
      </View>
    </View>
  );
};

export default ChangePassword;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    content: {
      paddingVertical: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(5),
      marginTop: hp(2),
      borderRadius: wp(3),
      paddingHorizontal: wp(5),
    },
    inputField: {
      marginBottom: hp(1),
    },
    primaryButton: {
      backgroundColor: Colors.primary,
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
      alignItems: 'center',
      marginTop: hp(2),
    },
    primaryButtonText: {
      color: Colors.white,
      fontSize: wp(4.5),
      fontWeight: 'bold',
    },
    label: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
      marginTop: hp(1),
    },
    btnContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: hp(1.5),
      paddingBottom: hp(2),
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(5),
    },
    continueButtonText: {
      fontSize: RFPercentage(1.8),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    errorText: {
      fontSize: RFPercentage(1.5),
      color: '#D32F2F',
      marginBottom: hp(1),
      fontFamily: Fonts.PoppinsMedium,
      marginLeft: 10,
    },
    passwordRulesContainer: {
      marginLeft: 5,
      marginTop: hp(1),
    },
    passwordRuleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 2,
    },
    passwordRuleText: {
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsMedium,
    },
  });
