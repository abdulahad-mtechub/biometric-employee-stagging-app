import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Svgs} from '../../../../assets/Svgs/Svgs';
import CalendarBtn from '../../../../components/Buttons/CalenderBtn';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../../../Constants/themeColors';
import {Fonts} from '../../../../Constants/Fonts';
import {SCREENS} from '../../../../Constants/Screens';
import SymbolCard from '../../../../components/Cards/SymbolCard';
import {
  attendanceData,
  AttendancePunchData,
  AttendanceSymbols,
} from '../../../../Constants/DummyData';
import {useTranslation} from 'react-i18next';
import StatusCardItem from '../../../../components/Cards/StatusCardItem';
import { pxToPercentage } from '../../../../utils/responsive';

const MonthlySummary = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  const handleYearChange = newYear => {
    console.log('Selected year:', newYear);
    // You can update your calendar data based on newYear here
  };
  return (
    <View style={styles.contentContainerStyle}>
      <View
        style={[
          styles.rowSb,
          {
            paddingHorizontal: wp(3),
            paddingVertical: hp(2),
            borderRadius: wp(2),
          },
        ]}>
        <Text style={[styles.SubHeading, {fontSize: RFPercentage(pxToPercentage(16))}]}>
          140+ {t('Punches')}
        </Text>
        <Svgs.filter />
      </View>
      <SymbolCard
        heading={'Attendence Symbols'}
        array={AttendanceSymbols}
        contianerStyle={{
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : Colors.lightTheme.backgroundColor,
        }}
      />
      <View style={styles.listContainer}>
        <CalendarBtn onYearChange={handleYearChange} mode={true} />

        <View
          style={[
            styles.rowSb,
            {
              borderBottomColor: isDarkMode
                ? Colors.darkTheme.BorderGrayColor
                : Colors.lightTheme.BorderGrayColor,
              borderBottomWidth: 1,
              paddingBottom: hp(1),
            },
          ]}>
          <Text style={[styles.SubHeading]}>{t('Monthly Punch')}</Text>
          <Text style={[styles.SubHeading, {fontFamily: Fonts.PoppinsMedium}]}>
            {t('Time')}
          </Text>
        </View>
        {attendanceData.map((item, index) => (
          <StatusCardItem
            item={item}
            key={index}
            type={'Attendance'}
            onPress={() => {
              navigation.navigate(SCREENS.WORKERATTENDENCEDETAILS, {status: item.status, valid: true, item: item});
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default MonthlySummary;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    contentContainerStyle: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
      flex: 1,
      marginTop: -hp(1.4),
    },
    rowSb: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: hp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    listContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      padding: hp(2),
      borderRadius: wp(2),
    },
  });
