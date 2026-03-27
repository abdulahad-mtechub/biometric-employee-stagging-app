import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Colors } from '../../Constants/themeColors';
import { Fonts } from '../../Constants/Fonts';
import { pxToPercentage } from '../../utils/responsive';

const DeviceCard = ({ title, description, Icon, onPress }) => {
  const { isDarkMode } = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {Icon && <View style={styles.iconWrapper}>{Icon}</View>}
    </TouchableOpacity>
  );
};

export default DeviceCard;
const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
    //   marginVertical: hp(1),
    //   shadowColor: '#000',
    //   shadowOpacity: 0.05,
    //   shadowRadius: 3,
    //   elevation: 3,
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    description: {
      // fontSize:FontsSize.size14,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(0.5),
    },
    iconWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
