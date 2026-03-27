// screens/LoginActivityScreen.js
import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';

import {Colors} from '../../../Constants/themeColors';
import {Fonts} from '../../../Constants/Fonts';
import StackHeader from '../../../components/Header/StackHeader';
import DeviceCard from '../../../components/Cards/DeviceCard';
import {Svgs} from '../../../assets/Svgs/Svgs';

const LoginActivityScreen = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  // Mock device data (can be replaced with API response)
  const nowDevices = [
    {title: 'Galaxy S21', location: 'Location XYZ, abc'},
  ];

  const pastDevices = [
    {title: 'Macbook', location: 'Location XYZ, abc'},
    {title: 'Macbook', location: 'Location XYZ, abc'},
    {title: 'Macbook', location: 'Location XYZ, abc'},
    {title: 'Macbook', location: 'Location XYZ, abc'},
    {title: 'Macbook', location: 'Location XYZ, abc'},
  ];

  const DeviceSection = ({title, devices, showLogout = false}) => (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t(title)}</Text>
        {showLogout && (
          <TouchableOpacity>
            <Text style={[styles.sectionTitle, styles.logoutText]}>
              {t('Logout All')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.cardWrapper}>
        {devices.map((device, index) => (
          <DeviceCard
            key={index}
            title={t(device.title)}
            description={t(device.location)}
            Icon={<Svgs.DeviceLogout />}
            onPress={() => console.log(`Pressed ${device.title}`)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Login Activity')}
        headerTxtStyle={styles.headerText}
        headerStyle={styles.headerStyle(isDarkMode)}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: hp(5)}}
      >
        <DeviceSection title="Now" devices={nowDevices} />
        <DeviceSection title="26 Sep,2024" devices={pastDevices} showLogout />
      </ScrollView>
    </View>
  );
};

export default LoginActivityScreen;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerText: {
      textAlign: 'left',
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    headerStyle: (dark) => ({
      paddingVertical: hp(2),
      backgroundColor: dark
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    }),
    scrollContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
      marginTop: hp(1),
    },
    sectionWrapper: {
      marginBottom: hp(2),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    logoutText: {
      color: Colors.error,
    },
    cardWrapper: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
    },
  });
