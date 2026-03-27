import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useSelector} from 'react-redux';
import { Colors } from '../../Constants/themeColors';
import { Fonts } from '../../Constants/Fonts';
import { pxToPercentage } from '../../utils/responsive';

const YearSwitcher = ({mode}) => {
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  const handlePreviousYear = () => {
    setSelectedYear(prevYear => prevYear - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prevYear => prevYear + 1);
  };

  return (
    <View style={[styles.container, mode && {backgroundColor: isDarkMode? Colors.darkTheme.secondryColor: Colors.lightTheme.backgroundColor}]}>
      <TouchableOpacity onPress={handlePreviousYear}>
        <Icon name="chevron-left" size={RFPercentage(3)} color={ mode ? isDarkMode? Colors.darkTheme.primaryTextColor :  Colors.lightTheme.primaryTextColor : isDarkMode? Colors.darkTheme.primaryTextColor :  Colors.darkTheme.primaryTextColor} />
      </TouchableOpacity>   

      <Text style={[styles.dateText, mode && {color: isDarkMode? Colors.darkTheme.primaryTextColor :  Colors.lightTheme.primaryTextColor}]}>{selectedYear}</Text>

      <TouchableOpacity onPress={handleNextYear}>
        <Icon name="chevron-right" size={RFPercentage(3)} color={ mode ? isDarkMode? Colors.darkTheme.primaryTextColor :  Colors.lightTheme.primaryTextColor : isDarkMode? Colors.darkTheme.primaryTextColor :  Colors.darkTheme.primaryTextColor} />
      </TouchableOpacity>
    </View>
  );
};

export default YearSwitcher;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1),
      paddingHorizontal: wp(4),
      borderRadius: wp(2),
      borderWidth: 1,
      borderColor: isDarkMode? Colors.darkTheme.BorderGrayColor: Colors.lightTheme.BorderGrayColor,
      alignSelf: 'center',
      backgroundColor: isDarkMode? Colors.darkTheme.backgroundColor: '#003149'
    },
    dateText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode? Colors.darkTheme.primaryTextColor : Colors.darkTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
  }); 