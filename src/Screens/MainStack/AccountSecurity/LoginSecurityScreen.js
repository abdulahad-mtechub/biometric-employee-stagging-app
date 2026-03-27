import React, {useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Fonts} from '../../../Constants/Fonts';
import {Colors} from '../../../Constants/themeColors';
import StackHeader from '../../../components/Header/StackHeader';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Image} from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAlert} from '../../../Providers/AlertContext';
import ConfirmationBottomSheet from '../../../components/BottomSheets/ConfirmationBottomSheet';
import {Svgs} from '../../../assets/Svgs/Svgs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {logout} from '../../../redux/Slices/authSlice';
import {deleteMyAccountApi} from '../../../Constants/api';

const LoginSecurityScreen = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const userData = useSelector(state => state?.auth?.user?.worker);
  const logoutSheetRef = useRef();
  const deleteSheetRef = useRef();
  const dispatch = useDispatch();
  const {showAlert} = useAlert();
  const token = useSelector(state => state?.auth?.user?.token);
  const [loading, setLoading] = useState(false);
  const {language} = useSelector(store => store?.auth);

  const handleLogout = async () => {
    try {
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
    } catch (error) {
      console.error('Logout failed:', error);
      showAlert(t('Something went wrong while logging out'), 'error');
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
      console.error(t('Delete account error:'), error);
      showAlert(t('Something went wrong. Please try again later.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Login & Security')}
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

      <View style={styles.card}>
        <View style={styles.avatar}>
          {userData?.profile_image ? (
            <Image
              source={{uri: userData?.profile_image}}
              style={styles.avatar}
            />
          ) : (
            <MaterialIcons name="account-circle" size={hp(5)} color="#999" />
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userData.first_name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => logoutSheetRef.current?.open()}>
          <Icon name="logout" size={16} color="#fff" style={{marginRight: 6}} />
          <Text style={styles.logoutText}>{t('Logout')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteSheetRef.current?.open()}>
        <Icon name="delete" size={18} color="#fff" style={{marginRight: 6}} />
        <Text style={styles.delText}>{t('Delete Account')}</Text>
      </TouchableOpacity>
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
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#fff',
      borderRadius: 10,
      padding: wp(4),
      margin: wp(5),
    },
    avatar: {
      width: hp(5),
      height: hp(5),
      borderRadius: 25,
    },
    userInfo: {
      flex: 1,
      marginLeft: wp(1),
    },
    userName: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    userEmail: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.3),
      color: 'gray',
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#007bff',
      paddingVertical: hp(1),
      paddingHorizontal: wp(3),
      borderRadius: 6,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#CC0000',
      paddingVertical: hp(1),
      paddingHorizontal: wp(3),
      borderRadius: 15,
      height: hp(6),
      marginHorizontal: wp(5),
      justifyContent: 'center',
      position: 'absolute',
      bottom: hp(3),
      width: wp(90),
    },
    logoutText: {
      color: '#fff',
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsMedium,
    },
    delText: {
      color: '#fff',
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
      fontWeight: 'bold',
    },
  });

export default LoginSecurityScreen;
