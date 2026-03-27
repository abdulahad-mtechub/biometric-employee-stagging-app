import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';

import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import CustomButton from '../../components/Buttons/customButton';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import {SCREENS} from '../../Constants/Screens';
import {useTranslation} from 'react-i18next';
import {pxToPercentage} from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SelectRole = ({navigation}) => {
  // Track which role is selected
  const [selectedRole, setSelectedRole] = useState('contractor');
  const {isDarkMode} = useSelector(store => store.theme);

  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  // Role data
  const roles = [
    {id: 1, role: 'worker', label: t("I'm a Account Executives")},
    {id: 2, role: 'companyAdmin', label: t('I’m a Company Admin')},
    {id: 3, role: 'company', label: t('I’m a Worker')},
    {id: 4, role: 'Coming', label: t('I’m  Lender (Coming Soon)')},
    {id: 5, role: 'Coming', label: t('I’m Supplier  (Coming Soon)')},
    {id: 6, role: 'Coming', label: t('I’m Applicant  (Coming Soon)')},
  ];

  // Handler for Save, Continue
  const handleContinue = async () => {
    try {
      // Get existing user data
      const userDataString = await AsyncStorage.getItem('localuserData');
      const userData = JSON.parse(userDataString);

      // Update user data with designation
      const updatedUserData = {
        ...userData,
        designation: selectedRole,
      };

      // Save updated user data
      await AsyncStorage.setItem(
        'localuserData',
        JSON.stringify(updatedUserData),
      );

      navigation.navigate(SCREENS.CREATEWORKERPROFILE);
    } catch (error) {
      console.log('Error saving designation:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("What's your role?")}</Text>
      <Text style={styles.subtitle}>
        {t("Pick the one that most that's applies to you.")}
      </Text>

      <View style={styles.radioGroup}>
        {roles.map(role => (
          <TouchableOpacity
            key={role.id}
            activeOpacity={role.role === 'Coming' ? 1 : 0.4}
            onPress={() => {
              role.role !== 'Coming' && setSelectedRole(role.role);
            }}
            style={[
              styles.radioButtonContainer,
              selectedRole === role.role && {
                borderColor: isDarkMode
                  ? Colors.darkTheme.primaryColor
                  : Colors.lightTheme.primaryColor,
                borderWidth: 1,
              },
            ]}>
            <Text
              style={[
                styles.radioLabel,
                role.role === 'Coming' && {
                  color: isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : '#8B8D97',
                },
              ]}>
              {role.label}
            </Text>

            {selectedRole === role.role ? (
              <Svgs.radioChecked />
            ) : (
              <View style={styles.radioCircleOuter} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Button */}
      <View
        style={{
          marginTop: hp(5),
          flex: 1,
          justifyContent: 'flex-end',
          marginBottom: hp(3),
        }}>
        <CustomButton
          text={t('Save, Continue')}
          onPress={handleContinue}
          containerStyle={styles.buttonContainer}
          textStyle={styles.buttonText}
        />
      </View>
    </View>
  );
};

export default SelectRole;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor, // or your chosen background color
      paddingHorizontal: wp(5),
      paddingTop: hp(5),
    },
    title: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(24)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
    },
    subtitle: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0),
    },
    radioGroup: {
      marginVertical: hp(1),
    },
    radioButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: hp(1.5),

      borderRadius: wp(3),
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(3),
    },
    radioCircleOuter: {
      width: wp(5),
      height: wp(5),
      borderRadius: wp(2.5),
      borderWidth: 2,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioCircleInner: {
      width: wp(3),
      height: wp(3),
      borderRadius: wp(1.5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    radioLabel: {
      marginLeft: wp(3),
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    buttonContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingVertical: hp(1.7),
      borderRadius: wp(2),
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
    },
  });
