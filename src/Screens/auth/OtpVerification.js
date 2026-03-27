import React, {useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import CustomButton from '../../components/Buttons/customButton';
import StackHeader from '../../components/Header/StackHeader';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';

const OtpVerification = ({navigation, route}) => {
  const {email} = route.params || {};
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const successBtmSheetRef = useRef();

  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        <StackHeader
          title={t('Email Verification')}
          headerTxtStyle={styles.headerText}
          headerStyle={{marginTop: hp(2)}}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.screenContainer}>
          <View style={styles.contentContainer}>
            {/* Email Icon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="email-check"
                size={80}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryColor
                    : Colors.lightTheme.primaryColor
                }
              />
            </View>

            <View style={styles.screenTitleContainer}>
              <Text style={styles.screenTitle}>{t('Verify Your Email')}</Text>
              <Text style={styles.screenDesc}>
                {t('We have sent a verification email to')}
                {'\n'}
                <Text style={styles.emailText}>{email}</Text>
                {'\n\n'}
                {t(
                  'Please click the verification link in the email and wait for admin approval.',
                )}
              </Text>
            </View>

            <View style={styles.stepsContainer}>
              <Text style={styles.stepsTitle}>{t('Next Steps')}:</Text>
              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>1.</Text>
                <Text style={styles.stepText}>
                  {t('Click the verification link in your email')}
                </Text>
              </View>
              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>2.</Text>
                <Text style={styles.stepText}>
                  {t('Wait for admin approval')}
                </Text>
              </View>
              <View style={styles.stepItem}>
                <Text style={styles.stepNumber}>3.</Text>
                <Text style={styles.stepText}>
                  {t('You will be notified once your account is approved')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.btnContainer}>
            <CustomButton
              containerStyle={styles.btn}
              text={t('Back to Login')}
              textStyle={styles.btnText}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{name: SCREENS.LOGIN}],
                });
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default OtpVerification;

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
        ? Colors.darkTheme.secondaryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      marginBottom: hp(4),
      lineHeight: RFPercentage(3.2),
    },
    btn: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
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
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
    },
    contentContainer: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingTop: hp(4),
    },
    iconContainer: {
      marginBottom: hp(4),
    },
    emailText: {
      fontFamily: Fonts.NunitoBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    stepsContainer: {
      width: '100%',
      marginTop: hp(4),
      padding: wp(5),
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#f5f5f5',
      borderRadius: wp(3),
    },
    stepsTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(2),
    },
    stepItem: {
      flexDirection: 'row',
      marginBottom: hp(1.5),
    },
    stepNumber: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      marginRight: wp(2),
    },
    stepText: {
      flex: 1,
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.secondaryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    btnContainer: {
      paddingBottom: hp(5),
      justifyContent: 'space-between',
      paddingHorizontal: wp(5),
    },
  });
