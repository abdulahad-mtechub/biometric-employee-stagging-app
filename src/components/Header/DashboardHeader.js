import React from 'react';
import {useTranslation} from 'react-i18next';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';

const MessageIconWithBadge = ({navigation}) => {
  const messageCount = useSelector(
    state =>
      (state.messageCount?.totalCount ??
        state.messageCount?.totalUnreadCount) ||
      0,
  );

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(SCREENS.MESSAGES)}
      style={{position: 'relative'}}>
      <AntDesign
        name="message1"
        size={hp(3)}
        color={
          useSelector(store => store.theme.isDarkMode) ? '#FFF' : '#4f507dff'
        }
      />
      {messageCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            backgroundColor: '#FF6B6B',
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}>
          <Text
            style={{
              color: '#FFF',
              fontSize: 10,
              fontWeight: 'bold',
            }}>
            {messageCount > 99 ? '99+' : messageCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const DashboardHeader = ({navigation, showSearch = false}) => {
  const {t} = useTranslation();
  const {isDarkMode} = useSelector(store => store.theme);
  const {logo} = useSelector(state => state.theme);
  const userData = useSelector(state => state?.auth?.user?.worker);
  const [imageError, setImageError] = React.useState(false);
  const [profileImageError, setProfileImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [logo]);

  React.useEffect(() => {
    setProfileImageError(false);
  }, [userData?.profile_image]);

  const formatUserName = () => {
    const firstName = userData?.first_name
      ? userData.first_name.charAt(0).toUpperCase() +
        userData.first_name.slice(1)
      : '';
    const middleName = userData?.middle_name
      ? userData.middle_name.charAt(0).toUpperCase() +
        userData.middle_name.slice(1)
      : '';
    const lastName = userData?.last_name
      ? userData.last_name.charAt(0).toUpperCase() + userData.last_name.slice(1)
      : '';

    return `${firstName} ${middleName} ${lastName}`.trim();
  };

  const styles = dynamicStyles(isDarkMode);

  return (
    <View
      style={{
        backgroundColor: isDarkMode
          ? Colors.darkTheme.backgroundColor
          : Colors.lightTheme.backgroundColor,
      }}>
      <View style={styles.headerContainer}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          {logo && !imageError ? (
            <Image
              source={{uri: logo}}
              style={{
                height: hp(5),
                width: hp(5),
                marginTop: hp(1),
                resizeMode: 'contain',
              }}
              onError={e => {
                setImageError(true);
              }}
            />
          ) : (
            <View
              style={{
                height: hp(5),
                width: hp(5),
                marginTop: hp(1),
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Svgs.Logo height={hp(6)} width={hp(6)} />
            </View>
          )}
          <View style={{marginLeft: wp(1.5)}}>
            <Text style={[styles.greetingText]}>{t('Hello!')}</Text>
            <Text style={[styles.nameText]}>{formatUserName()}</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <MessageIconWithBadge navigation={navigation} />
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}>
            {isDarkMode ? (
              <Svgs.BellD height={hp(3)} />
            ) : (
              <Svgs.BellL height={hp(3)} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.PROFILEDETAILS)}>
            {userData?.profile_image && !profileImageError ? (
              <Image
                source={{uri: userData?.profile_image}}
                style={styles.profileImage}
                onError={e => {
                  console.log('Profile image load error:', e.nativeEvent.error);
                  setProfileImageError(true);
                }}
              />
            ) : (
              <MaterialIcons name="account-circle" size={wp(11)} color="#999" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      {/* Uncomment if you need search functionality */}
      {/* {showSearch && (
        <TxtInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{marginHorizontal: wp(8)}}
          containerStyle={{
            backgroundColor: isDarkMode
              ? Colors.darkTheme.input
              : Colors.lightTheme.input,
          }}
          placeholder={t('Search')}
          leftSvg={isDarkMode ? <Svgs.searchD /> : <Svgs.SearchL />}
          rightIconPress={() => {
            setSearchQuery('');
          }}
        />
      )} */}
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      justifyContent: 'space-between',
      marginBottom: hp(1),
    },
    greetingText: {
      paddingTop: hp(1.5),
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    nameText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      width: wp(40),
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    profileImage: {
      width: wp(11),
      height: wp(11),
      borderRadius: wp(10),
    },
  });

export default DashboardHeader;
