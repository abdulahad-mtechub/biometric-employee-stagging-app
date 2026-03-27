import React, {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import ComingSoonModal from '../../components/ComingSoonModal/ComingSoonModal';

const Menu = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const [isComingSoonVisible, setIsComingSoonVisible] = useState(false);

  const handleComingSoon = () => {
    setIsComingSoonVisible(true);
  };

  const MenuCards = [
    {
      title: 'Request Management',
      icon: <Svgs.request />,
      backgroundColor: '#579DFF',
      onPress: () => {
        navigation.navigate(SCREENS.REQUESTMANAGEMENT);
      },
    },
    {
      title: 'Documents',
      icon: <Svgs.document />,
      backgroundColor: '#F5CD47',
      onPress: () => {
        navigation.navigate(SCREENS.MYDOCUMENTS);
      },
    },
    {
      title: 'Automated Documents',
      icon: <Svgs.document />,
      backgroundColor: '#f95f5fff',
      onPress: () => {
        navigation.navigate(SCREENS.AUTOMATEDDOCUMENTS);
      },
    },
    {
      title: 'Payments',
      icon: <Svgs.Payment />,
      backgroundColor: '#4BCE97',
      onPress: () => {
        navigation.navigate(SCREENS.PAYMENTS);
      },
    },

    // {
    //   title: 'Work Schedule',
    //   icon: <Svgs.task />,
    //   backgroundColor: '#00C7BE',
    //   onPress: () => {
    //     navigation.navigate(SCREENS.WORKSCHEDULE);
    //   },
    // },
    // {
    //   title: 'Reports & Statistics',
    //   icon: <Svgs.report />,
    //   backgroundColor: '#FEA362',
    //   onPress: () => {
    //     navigation.navigate(SCREENS.REPORTSSTATISTICS);
    //   },
    // },
    // {
    //   title: 'Reports',
    //   icon: <Svgs.loans />,
    //   backgroundColor: '#9F8FEF',
    //   onPress: () => {
    //     navigation.navigate(SCREENS.REPORTS);
    //   },
    // },
    {
      title: 'Reports',
      icon: <Svgs.loans />,
      backgroundColor: '#9F8FEF',
      onPress: () => {
        navigation.navigate(SCREENS.REPORTSCREEN);
      },
    },
    {
      title: 'Absence',
      icon: <Svgs.workerWhite height={hp(3)} width={hp(3)} />,
      backgroundColor: '#ef8feaff',
      onPress: () => {
        navigation.navigate(SCREENS.ABSENCE);
      },
    },
    {
      title: 'Finance',
      icon: <Svgs.Payment height={hp(3)} width={hp(3)} />,
      backgroundColor: '#FF9800',
      onPress: () => handleComingSoon(),
    },
    {
      title: 'Loans',
      icon: <Svgs.loans />,
      backgroundColor: '#9F8FEF',
      onPress: () => handleComingSoon(),
    },
    {
      title: 'Lenders',
      icon: <Svgs.DepartmentWhite height={hp(3)} width={hp(3)} />,
      backgroundColor: '#4BCE97',
      onPress: () => handleComingSoon(),
    },
    {
      title: 'Profile',
      icon: <Svgs.workerWhite />,
      backgroundColor: '#F4769D',
      onPress: () => {
        navigation.navigate(SCREENS.PROFILE);
      },
    },
  ];

  const MenuCard = ({icon, title, backgroundColor, onPress}) => {
    const themeColors = isDarkMode ? Colors.darkTheme : Colors.lightTheme;

    return (
      <TouchableOpacity
        onPress={() => onPress()}
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode
              ? Colors.darkTheme.secondryColor
              : themeColors.backgroundColor,
            borderColor: themeColors.BorderGrayColor,
          },
        ]}>
        <View style={[styles.cardIconContainer, {backgroundColor}]}>
          {icon}
        </View>
        <Text
          style={[styles.title, {color: themeColors.primaryTextColor}]}
          numberOfLines={2}
          adjustsFontSizeToFit>
          {t(title)}
          {title === 'Finance' || title === 'Loans' || title === 'Lenders'}
          {/* &&
            '\n(Coming Soon)' */}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.ScreenHeading]}>{t('More')}</Text>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}>
            {isDarkMode ? (
              <Svgs.BellD height={hp(4)} />
            ) : (
              <Svgs.BellL height={hp(4)} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={MenuCards}
        numColumns={2}
        keyExtractor={item => item.title}
        renderItem={({item}) => (
          <MenuCard
            title={item.title}
            icon={item.icon}
            backgroundColor={item.backgroundColor}
            onPress={item.onPress}
          />
        )}
        contentContainerStyle={{alignSelf: 'center'}}
      />
      <ComingSoonModal
        isVisible={isComingSoonVisible}
        onClose={() => setIsComingSoonVisible(false)}
        onConfirm={() => setIsComingSoonVisible(false)}
      />
    </View>
  );
};

export default Menu;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      justifyContent: 'space-between',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    ScreenHeading: {
      paddingTop: hp(1.5),
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.5),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },

    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(5),
    },

    card: {
      width: wp(42),
      height: hp(16),
      borderWidth: 1,
      borderRadius: wp(3),
      padding: wp(4),
      margin: wp(2),
      // justifyContent: 'space-between',
    },
    cardIconContainer: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(10),
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      marginTop: hp(1),
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
    },
    floatingButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      width: wp(15),
      height: wp(15),
      borderRadius: wp(100),
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: hp(25),
      right: wp(5),
      elevation: 10,
    },
  });
