// components/StatusBox.js

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useSelector} from 'react-redux';
import {widthPercentageToDP as wp} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {useTranslation} from 'react-i18next';
import {heightPercentageToDP as hp} from 'react-native-responsive-screen';
const StatusBox = ({status, backgroundColor, color, icon, showIcon}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  const showChevron =
    status === 'Invited' || status === 'Request' || status === 'Ongoing';
  const dynamicPadding = !showChevron ? {paddingVertical: wp(1)} : null;

  return (
    <View style={[styles.statusBox, {backgroundColor}, dynamicPadding]}>
      {icon}
      <Text style={[styles.statusText, {color}]} adjustsFontSizeToFit>
        {t(status)}afsd
      </Text>
      {showChevron && showIcon && (
        <MaterialCommunityIcons
          name="chevron-down"
          size={RFPercentage(3)}
          color={
            status === 'Invited' || status === 'Ongoing'
              ? Colors.darkTheme.primaryTextColor
              : Colors.lightTheme.primaryTextColor
          }
        />
      )}
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    statusBox: {
      borderRadius: wp(1),
      paddingHorizontal: wp(2),
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: wp(40),
      minWidth: wp(30),
      flexDirection: 'row',
      paddingVertical: wp(0.5),
    },
    statusText: {
      fontSize: RFPercentage(1.6),
      textAlign: 'center',
      marginLeft: wp(1),
      color: Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
  });

export default StatusBox;
