// AccountSecurityScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Colors} from '../../../Constants/themeColors';
import {Fonts} from '../../../Constants/Fonts';
import StackHeader from '../../../components/Header/StackHeader';
import {Svgs} from '../../../assets/Svgs/Svgs';
import {pxToPercentage} from '../../../utils/responsive';

const AccountSecurityScreen = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const menuItems = [
    {
      id: 1,
      title: t('General Settings'),
      subtitle: t('Language, basic app data and preferences'),
      icon: 'GeneralSetting',
      screen: 'GeneralSettings',
    },
    // {
    //   id: 2,
    //   title: t('Notification Preferences'),
    //   subtitle: t('Manage how you receive notifications'),
    //   icon: 'bellBlack',
    //   screen: 'NotificationPreferences',
    // },
    {
      id: 3,
      title: t('Login & Security'),
      subtitle: t('Manage how you access your account'),
      icon: 'LoginSecurity',
      screen: 'LoginSecurity',
    },
  ];

  const renderMenuItem = item => {
    const SvgIcon = Svgs[item.icon];

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={() => navigation.navigate(item.screen)}>
        <View style={styles.menuIconContainer}>
          {SvgIcon && <SvgIcon width={24} height={24} />}
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{item.title}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>
        <Icon
          name="chevron-right"
          size={30}
          color={styles.chevronColor.color}
        />
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Settings')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.5),
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

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>{menuItems.map(renderMenuItem)}</View>
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
        : Colors.lightTheme.secondryColor,
    },

    scrollContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
      paddingTop: hp(3),
    },
    content: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 12,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(2),
      paddingHorizontal: hp(1),
      marginBottom: hp(1.5),
    },
    menuIconContainer: {
      width: 40,
      height: 40,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(19)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    menuSubtitle: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    iconColor: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    chevronColor: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });

export default AccountSecurityScreen;
