
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomSwitch from './CustomSwitch';
import { pxToPercentage } from '../../utils/responsive';

const LabeledSwitch = ({
  title,
  subtitle,
  value,
  onValueChange,
  Icon,
  GoRight,
  OnRightPress
}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.toggleContainer}>
      {Icon && <View style={styles.iconContainer}>{Icon}</View>}
      <View style={styles.toggleContent}>
        <Text
          style={[
            styles.toggleTitle,
            Icon && styles.titleWithIcon, // Apply extra style if Icon is passed
          ]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
      </View>
      {GoRight ? (
        <TouchableOpacity onPress={OnRightPress} style={{padding:wp(1.5)}}>
          {isDarkMode? <Svgs.chevronRight/>: <Svgs.chevronRightL />}
        </TouchableOpacity>
      ) : (
        <CustomSwitch value={value} onValueChange={onValueChange}/>
        // <CustomToggleButton
        //   isActive={value}
        //   onToggle={onValueChange}
        //   activeColor={
        //     isDarkMode
        //       ? Colors.darkTheme.primaryColor
        //       : Colors.lightTheme.primaryColor
        //   }
        //   inactiveColor={Colors.lightTheme.BorderGrayColor}
        // />
      )}
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hp(2),
      // borderBottomWidth: 1,
      // borderBottomColor: isDarkMode
      //   ? Colors.darkTheme.borderColor
      //   : Colors.lightTheme.borderColor,
    },
    iconContainer: {
      marginRight: wp(3),
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleContent: {
      flex: 1,
      marginRight: wp(8),
    },
    toggleTitle: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    titleWithIcon: {
      fontSize: RFPercentage(pxToPercentage(17)), // Increased size
      fontFamily: Fonts.PoppinsSemiBold, // Bolder weight
    },
    toggleSubtitle: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.4),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(0.5),
    },
  });

export default LabeledSwitch;

