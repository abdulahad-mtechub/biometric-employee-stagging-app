import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Animated,
  Easing,
  Image,
  Linking,
  ScrollView,
  Share,
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
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useDispatch, useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import ConfirmationBottomSheet from '../../components/BottomSheets/ConfirmationBottomSheet';
import {deleteMyAccountApi} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {logout} from '../../redux/Slices/authSlice';
import {toggleTheme} from '../../redux/Slices/Theme';

const APP_URL = 'https://play.google.com/store/apps/details?id=com.yourapp';
const Profile = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.auth?.user?.worker);
  const {t} = useTranslation();
  const token = useSelector(state => state?.auth?.user?.token);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const {logo} = useSelector(state => state.theme);
  const {language} = useSelector(store => store?.auth);
  const CustomSwitch = ({value, onValueChange}) => {
    const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

    const toggleSwitch = () => {
      const newValue = !value;
      onValueChange(newValue);

      Animated.timing(animatedValue, {
        toValue: newValue ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.circle),
        useNativeDriver: false,
      }).start();
    };

    const switchTranslate = animatedValue?.interpolate({
      inputRange: [0, 1],
      outputRange: [0, wp(5.5)],
    });

    const bgColor = animatedValue?.interpolate({
      inputRange: [0, 1],
      outputRange: [
        isDarkMode ? '#FFFFFF' : '#E9E9EA',
        isDarkMode ? '#E9E9EA' : '#34C759',
      ],
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggleSwitch}
        style={{marginLeft: 'auto'}}>
        <Animated.View
          style={[styles.switchContainer, {backgroundColor: bgColor}]}>
          <Animated.View
            style={[
              styles.switchCircle,
              {transform: [{translateX: switchTranslate}]},
            ]}></Animated.View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: `Check out this amazing app: ${APP_URL}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        } else {
        }
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {
      console.log('Error sharing app:', error.message);
    }
  };

  const handleRateApp = () => {
    Linking.openURL(APP_URL).catch(err =>
      console.error('Error opening app store:', err),
    );
  };

  const darkModeToggle = () => {
    dispatch(toggleTheme());
  };

  const menuItems = [
    {
      title: t('Edit Profile'),
      icon: isDarkMode ? (
        <Svgs.EditProfile fill={'#FFF'} />
      ) : (
        <Svgs.EditProfile />
      ),
      screen: SCREENS.EDITPROFILE,
    },
    {
      title: t('Change Password'),
      icon: isDarkMode ? (
        <Svgs.inActiveWhite fill={'#FFFFFF'} />
      ) : (
        <Svgs.changePassword />
      ),
      screen: SCREENS.CHANGEPASSWORD,
    },
    // {
    //   title: t('Face ID'),
    //   icon: isDarkMode ? (
    //     <Svgs.fcWhite width={wp(6)} height={wp(6)} />
    //   ) : (
    //     <Svgs.faceScan />
    //   ),
    //   screen: SCREENS.FACEIDOPTION,
    // },
    {
      title: t('Change Language'),
      icon: isDarkMode ? (
        <Svgs.GeneralSetting fill={'#FFF'} />
      ) : (
        <Svgs.GeneralSetting />
      ),
      screen: SCREENS.GENERALSETTINGS,
    },
    {
      title: t('Terms & Conditions'),
      icon: isDarkMode ? <Svgs.inActiveWhite fill={'#FFF'} /> : <Svgs.terms />,
      screen: SCREENS.TERMSANDCONDITIONS,
    },
    {
      title: t('Privacy Policy'),
      icon: isDarkMode ? (
        <Svgs.inActiveWhite fill={'#FFF'} />
      ) : (
        <Svgs.privacy />
      ),
      screen: SCREENS.PRIVACYPOLICY,
    },
    // {
    //   title: t('Dark Mode'),
    //   icon: isDarkMode ? (
    //     <Svgs.darkModeWhite width={wp(6)} height={wp(6)} />
    //   ) : (
    //     <Svgs.darkMode width={wp(6)} height={wp(6)} />
    //   ),
    //   isToggle: true,
    // },
    {
      title: t('Share App'),
      icon: isDarkMode ? <Svgs.share fill={'#FFF'} /> : <Svgs.share />,
      screen: 'ShareAppScreen',
    },
    {
      title: t('Rate App'),
      icon: isDarkMode ? <Svgs.Rate fill={'#FFF'} /> : <Svgs.Rate />,
      screen: 'RateAppScreen',
    },

    {
      title: t('Delete Account'),
      icon: isDarkMode ? (
        <Svgs.deleteOutline fill={'#FFF'} />
      ) : (
        <Svgs.deleteOutline />
      ),
      isDanger: true,
      isDelete: true,
    },
    {
      title: t('Logout'),
      icon: isDarkMode ? <Svgs.logOutOutline /> : <Svgs.logOutOutline />,
      isDanger: true,
      isLogout: true,
    },
  ];

  const logoutSheetRef = useRef();
  const deleteSheetRef = useRef();
  const {showAlert} = useAlert();

  const handleLogout = async () => {
    logoutSheetRef.current?.close();
    await Promise.all([
      AsyncStorage.removeItem('localuserData'),
      AsyncStorage.removeItem('isLoggedIn'),
      AsyncStorage.removeItem('SinupUserData'),
    ]);
    dispatch(logout());
    if (language === 'English') {
      showAlert(t('Logged out successfully'), 'success');
    } else {
      showAlert(t('Cierre de sesión exitoso'), 'success');
    }
  };

  const handleDelete = async password => {
    try {
      setLoading(true);
      const body = {password: password};
      const response = await deleteMyAccountApi(body, token);
      if (response?.error === false) {
        dispatch(logout());
        if (language === 'English') {
          showAlert(t('Logged out successfully'), 'success');
        } else {
          showAlert(t('Cierre de sesión exitoso'), 'success');
        }
        deleteSheetRef.current?.close();
      } else {
        deleteSheetRef.current?.close();
        showAlert(t('Failed to delete account. Please try again.'), 'error');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      showAlert(t('Something went wrong. Please try again later.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.rowView}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            onPress={() => navigation.goBack()}
            name={'chevron-left'}
            size={RFPercentage(4)}
            color={
              isDarkMode
                ? Colors.darkTheme.primaryTextColor
                : Colors.lightTheme.primaryTextColor
            }
          />
          <Text style={styles.title}>{t('Profile')}</Text>
        </View>
        {!imageError ? (
          <Image
            source={{uri: logo}}
            style={{
              height: hp(6),
              width: hp(6),
            }}
            onError={() => {
              setImageError(true);
            }}
          />
        ) : (
          <Svgs.Logo height={hp(6)} width={hp(6)} />
        )}
      </View>
      <View style={styles.headerContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {userData?.profile_image ? (
            <Image
              source={{uri: userData?.profile_image}}
              style={styles.ImageStyle}
            />
          ) : (
            <MaterialIcons name="account-circle" size={wp(17)} color="#999" />
          )}
          <View style={{width: wp(55)}}>
            <Text style={styles.ScreenHeading} adjustsFontSizeToFit>
              {`${
                userData?.first_name
                  ? userData.first_name.charAt(0).toUpperCase() +
                    userData.first_name.slice(1)
                  : ''
              } ${
                userData?.middle_name
                  ? userData.middle_name.charAt(0).toUpperCase() +
                    userData.middle_name.slice(1)
                  : ''
              } ${
                userData?.last_name
                  ? userData.last_name.charAt(0).toUpperCase() +
                    userData.last_name.slice(1)
                  : ''
              }`.trim()}
            </Text>
            <Text style={styles.Email} numberOfLines={1}>
              {userData?.email}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate(SCREENS.PROFILEDETAILS)}>
          <Icon
            name="chevron-forward"
            size={wp(6)}
            color={isDarkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <ScrollView contentContainerStyle={styles.content}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => {
              if (item.isLogout) {
                logoutSheetRef.current?.open();
              } else if (item.isDelete) {
                deleteSheetRef.current?.open();
              } else if (item.isToggle) {
                darkModeToggle();
              } else if (item.title === t('Share App')) {
                handleShareApp();
              } else if (item.title === t('Rate App')) {
                handleRateApp();
              } else {
                navigation.navigate(item.screen);
              }
            }}>
            <View style={styles.menuIconContainer}>{item.icon}</View>
            <Text
              style={[
                styles.menuText,
                {color: item.isDanger ? 'red' : isDarkMode ? '#fff' : '#000'},
              ]}>
              {item.title}
            </Text>
            {item.isToggle && (
              <CustomSwitch value={isDarkMode} onValueChange={darkModeToggle} />
            )}
          </TouchableOpacity>
        ))}

        <ConfirmationBottomSheet
          ref={logoutSheetRef}
          icon={<Svgs.logout height={hp(10)} />}
          title={t('Are you sure?')}
          description={t(
            'Are you sure you want to log out? You will need to sign in again to access your account.',
          )}
          onConfirm={handleLogout}
          onCancel={() => logoutSheetRef.current?.close()}
          confirmText={t('Logout Confirm')}
          cancelText={t('Cancel')}
        />
        <ConfirmationBottomSheet
          ref={deleteSheetRef}
          icon={<Svgs.deleteAcc height={hp(10)} />}
          title={t('Are you sure?')}
          description={t(
            'Are you sure you want to delete your account? Please note that this action is permanent and cannot be undone.',
          )}
          onConfirm={handleDelete}
          onCancel={() => deleteSheetRef.current?.close()}
          confirmText={t('Delete Confirm')}
          cancelText={t('Cancel')}
          requirePassword={true}
        />
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
    content: {
      marginHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 10,
      paddingHorizontal: 5,
      marginBottom: hp(2),
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingBottom: hp(2),
      paddingTop: hp(2),
      justifyContent: 'space-between',
      margin: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      shadowColor: isDarkMode ? '#000' : '#ddd',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    ImageStyle: {
      width: wp(15),
      height: wp(15),
      borderRadius: wp(7.5),
      marginRight: wp(3),
    },
    ScreenHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    Email: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1.5),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#eee',
    },
    menuIconContainer: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(3),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: wp(4),
      backgroundColor: isDarkMode ? '#333' : '#f5f5f5',
    },
    menuText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(2),
      flex: 1,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(2),
    },
    rowView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hp(2),
      paddingHorizontal: wp(6),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#eee',
    },
    title: {
      fontSize: RFPercentage(3),
      fontFamily: Fonts.NunitoBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(3),
    },
    // Custom switch styles
    switchContainer: {
      width: wp(11),
      height: wp(6),
      borderRadius: wp(3),
      justifyContent: 'center',
      paddingHorizontal: wp(0.5),
    },
    switchCircle: {
      width: wp(5),
      height: wp(5),
      borderRadius: wp(2.5),
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  });

export default Profile;
