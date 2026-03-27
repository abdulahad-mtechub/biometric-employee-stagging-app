import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import CustomButton from '../../components/Buttons/customButton';
import {SCREENS} from '../../Constants/Screens';
import {useTranslation} from 'react-i18next';

const Subscription = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);

  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  return (
    <ScrollView style={styles.container}>
      {/* <View style={styles.card}> */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={styles.title}>{t('Pricing Plan')}</Text>
        <Svgs.Cross
          onPress={() => navigation.navigate(SCREENS.LOGIN)}
          style={{marginRight: hp(2)}}
          height={hp(2)}
        />
      </View>
      <Text style={styles.subTitle}>
        {t('Find the plan that fits your team’s size and needs.')}
      </Text>

      <Svgs.subcription />

      <Text style={styles.planName}>{t('Basic')}</Text>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>$12</Text>
        <View style={{marginLeft: wp(2)}}>
          <Text style={styles.priceMain}>$18 </Text>
          <Text style={styles.priceSub}>{t('per user/per month')}</Text>
        </View>
      </View>

      <Text style={styles.planDesc}>
        {t('For Freelancers, Small Teams, or Startups')}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.includesTitle}>{t('Includes:')}</Text>

      {[
        t('Free Administrator Users'),
        t('Mobile Apps'),
        t('Time Tracking'),
        t('Time Off Tracking'),
        t('Alerts & Reminders'),
      ].map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          {/* Replace below with <Svgs.checkIcon /> */}
          <Svgs.radioChecked />
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}

      <TouchableOpacity>
        <Text style={styles.linkText}>{t('View all features')}</Text>
      </TouchableOpacity>

      {/* Dots pagination */}
      <View style={styles.paginationContainer}>
        <View style={styles.activeDot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <CustomButton
        text={t('Subscribe Now')}
        textStyle={styles.subscribeText}
        containerStyle={styles.subscribeButton}
      />

      <View style={styles.footerLinks}>
        <TouchableOpacity>
          <Text style={styles.footerText}>{t('Terms of Conditions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerText}>{t('Privacy Policy')}</Text>
        </TouchableOpacity>
      </View>
      {/* </View> */}
    </ScrollView>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      paddingVertical: hp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(7),
    },

    title: {
      fontSize: RFPercentage(3),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    subTitle: {
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(0.5),
      marginBottom: hp(2),
      width: wp(76),
      fontFamily: Fonts.NunitoMedium,
    },

    planName: {
      fontSize: RFPercentage(2.5),
      marginTop: hp(1),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    price: {
      fontSize: RFPercentage(5),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    priceMain: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoBold,
      textDecorationLine: 'line-through',
    },
    priceSub: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginLeft: wp(2),
      marginBottom: hp(0.5),
    },
    planDesc: {
      textAlign: 'left',
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontSize: RFPercentage(1.9),
      marginTop: hp(0.5),
      fontFamily: Fonts.NunitoRegular,
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginVertical: hp(3),
    },
    includesTitle: {
      fontSize: RFPercentage(2),
      marginBottom: hp(1),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1),
    },

    featureText: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      marginLeft: wp(3),
    },
    linkText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontSize: RFPercentage(1.9),
      marginTop: hp(1),
      textDecorationLine: 'underline',
      fontFamily: Fonts.PoppinsRegular,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: hp(4),
      marginBottom: hp(4),
    },
    activeDot: {
      width: wp(4),
      height: wp(1.5),
      borderRadius: wp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      marginHorizontal: wp(1),
    },
    dot: {
      width: wp(1.5),
      height: wp(1.5),
      borderRadius: wp(1),
      backgroundColor: '#5E5F60',
      marginHorizontal: wp(1),
    },
    subscribeButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryColor
      //   : Colors.lightTheme.primaryColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginTop: hp(1),
    },
    subscribeText: {
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsMedium,
    },
    footerLinks: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: hp(2),
    },
    footerText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontSize: RFPercentage(1.9),
      textDecorationLine: 'underline',
      fontFamily: Fonts.PoppinsSemiBold,
    },
  });

export default Subscription;
