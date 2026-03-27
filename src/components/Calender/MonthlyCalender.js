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
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import { pxToPercentage } from '../../utils/responsive';

const MonthlyCalender = ({containerStyle}) => {
  const [startDate, setStartDate] = useState(moment().startOf('month'));
  const [endDate, setEndDate] = useState(moment().endOf('month').add(6, 'months'));
  const {isDarkMode} = useSelector(state => state.theme);
  const styles = dynamicStyles(isDarkMode);

  const handlePrevious = () => {
    setStartDate(prev => moment(prev).subtract(1, 'month'));
    setEndDate(prev => moment(prev).subtract(1, 'month'));
  };

  const handleNext = () => {
    setStartDate(prev => moment(prev).add(1, 'month'));
    setEndDate(prev => moment(prev).add(1, 'month'));
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity onPress={handlePrevious}>
        <Icon
          name="chevron-left"
          size={RFPercentage(2.8)}
          color={
            isDarkMode
              ? Colors.darkTheme.primaryTextColor
              : Colors.lightTheme.primaryTextColor
          }
        />
      </TouchableOpacity>

      <Text style={styles.dateText}>
        {`${startDate.format('MMM YYYY')} - ${endDate.format('MMM YYYY')}`}
      </Text>

      <TouchableOpacity onPress={handleNext}>
        <Icon
          name="chevron-right"
          size={RFPercentage(2.8)}
          color={
            isDarkMode
              ? Colors.darkTheme.primaryTextColor
              : Colors.lightTheme.primaryTextColor
          }
        />
      </TouchableOpacity>
    </View>
  );
};

export default MonthlyCalender;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: wp(3),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.3),
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      // alignSelf: 'center',
      justifyContent: 'center'
    },
    dateText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      marginHorizontal: wp(2),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });
