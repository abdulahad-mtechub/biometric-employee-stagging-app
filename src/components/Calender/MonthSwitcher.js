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

const MonthSwitcher = () => {
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  const handlePreviousMonth = () => {
    setSelectedMonth(prevMonth => moment(prevMonth).subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prevMonth => moment(prevMonth).add(1, 'month'));
  };

  const renderMonthText = () => {
    const currentMonth = moment().format('MMMM');
    const selectedMonthName = selectedMonth.format('MMMM');
    return currentMonth === selectedMonthName ? 'Current Month' : selectedMonthName;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePreviousMonth}>
        <Icon name="chevron-left" size={RFPercentage(3)} color={isDarkMode? Colors.darkTheme.primaryTextColor : Colors.lightTheme.primaryTextColor} />
      </TouchableOpacity>

      <Text style={styles.dateText}>{renderMonthText()}</Text>

      <TouchableOpacity onPress={handleNextMonth}>
        <Icon name="chevron-right" size={RFPercentage(3)} color={isDarkMode? Colors.darkTheme.primaryTextColor : Colors.lightTheme.primaryTextColor} />
      </TouchableOpacity>
    </View>
  );
};

export default MonthSwitcher;

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
    },
    dateText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode? Colors.darkTheme.primaryTextColor : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
  }); 