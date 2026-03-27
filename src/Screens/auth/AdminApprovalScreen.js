import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {Svgs} from '../../assets/Svgs/Svgs';
import {Fonts} from '../../Constants/Fonts';
import {FontsSize} from '../../Constants/FontsSize';
import {Colors} from '../../Constants/themeColors';
import {useNavigation} from '@react-navigation/native';
import {SCREENS} from '../../Constants/Screens';

const AdminApprovalScreen = ({route}) => {
  const navigation = useNavigation();
  const {signUpscreens} = route?.params || {};
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Svgs.AdminInvitationIcon width={wp(50)} height={wp(50)} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('Awaiting Administrator Approval')}</Text>

        {/* Description */}
        <Text style={styles.description}>
          {t(
            'Your account registration has been received and is currently under review by our administration team. This process typically takes 24-48 hours.',
          )}
        </Text>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Svgs.ClockActive width={wp(6)} height={wp(6)} />
            </View>
            <Text style={styles.infoText}>
              {t('Review process usually takes 24-48 hours')}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Svgs.EmailVerification width={wp(6)} height={wp(6)} />
            </View>
            <Text style={styles.infoText}>
              {t('You will receive an email notification once approved')}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Svgs.subcription width={wp(6)} height={wp(6)} />
            </View>
            <Text style={styles.infoText}>
              {t('Contact support if you have urgent questions')}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {/* <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Support')}>
          <Text style={styles.primaryButtonText}>{t('Contact Support')}</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{name: SCREENS.LOGIN}],
            })
          }>
          <Text style={styles.primaryButtonText}>
            {signUpscreens ? t('Go to Login') : t('Go Back')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('Thank you for your patience')}
        </Text>
      </View>
    </ScrollView>
  );
};

export default AdminApprovalScreen;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    contentContainer: {
      flexGrow: 1,
      padding: wp(5),
      justifyContent: 'space-between',
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: hp(5),
      marginBottom: hp(3),
    },
    content: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    illustrationContainer: {
      marginBottom: hp(4),
      alignItems: 'center',
    },
    title: {
      fontSize: FontsSize.size24,
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      marginBottom: hp(2),
      lineHeight: hp(3.5),
    },
    description: {
      fontSize: FontsSize.size16,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      lineHeight: hp(2.5),
      marginBottom: hp(4),
      paddingHorizontal: wp(5),
    },
    infoContainer: {
      width: '100%',
      marginBottom: hp(4),
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(2),
      paddingHorizontal: wp(2),
    },
    iconContainer: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor + '20'
        : Colors.lightTheme.primaryColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: wp(3),
    },
    infoText: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.NunitoMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
      lineHeight: hp(2.2),
    },
    buttonContainer: {
      width: '100%',
      marginBottom: hp(5),
    },
    primaryButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingVertical: hp(2),
      borderRadius: wp(3),
      alignItems: 'center',
      marginBottom: hp(2),
    },
    primaryButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontSize: FontsSize.size16,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: hp(2),
      borderRadius: wp(3),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    secondaryButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontSize: FontsSize.size16,
      fontFamily: Fonts.PoppinsMedium,
    },
    footer: {
      alignItems: 'center',
      marginBottom: hp(3),
    },
    footerText: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.NunitoItalic,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },
  });
