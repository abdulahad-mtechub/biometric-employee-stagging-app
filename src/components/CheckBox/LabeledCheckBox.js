import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {pxToPercentage} from '../../utils/responsive';
import {Colors} from './../../Constants/themeColors';

const LabeledCheckbox = ({title, value, onToggle, containerStyle}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        style={[styles.checkbox, value && styles.checkedBox]}
        onPress={onToggle}>
        {value && <Icon name="check" size={wp(3.5)} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
};

export default LabeledCheckbox;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1),
    },
    title: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      // flex: 1,
      flexWrap: 'wrap',
      width: '90%',
    },
    checkbox: {
      width: wp(5),
      height: wp(5),
      borderRadius: 3,
      borderWidth: 2,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkedBox: {
      backgroundColor: Colors.darkTheme.primaryColor,
      borderColor: Colors.darkTheme.primaryColor,
    },
  });
