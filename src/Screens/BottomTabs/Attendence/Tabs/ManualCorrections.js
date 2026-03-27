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
  AttendancePunchData,
  AttendanceSymbols,
} from '../../../../Constants/DummyData';
import AttendancePunchCard from '../../../../components/Cards/AttendancePunchCard';
import { useTranslation } from 'react-i18next';

const ManualCorrections = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  const handleYearChange = newYear => {
    console.log('Selected year:', newYear);
    // You can update your calendar data based on newYear here
  };
  return (
    <View style={styles.contentContainerStyle}>
      <View style={styles.rowSb}>
        <Text style={[styles.SubHeading, {fontSize: RFPercentage(2)}]}>
          120 {t("Manual Punches")}
        </Text>
        <Svgs.filter />
      </View>
      <CalendarBtn onYearChange={handleYearChange} mode={true} />
      <SymbolCard heading={'Attendence Symbols'} array={AttendanceSymbols} />
      <View style={[styles.rowSb, {marginBottom: hp(1)}]}>
        <Text style={[styles.SubHeading]}>{t("All Attendance")}</Text>
        <Text style={[styles.SubHeading, {fontFamily: Fonts.PoppinsMedium}]}>
          {t("Date - Time")}
        </Text>
      </View>
      {AttendancePunchData.map(item => (
        <AttendancePunchCard
          key={item.id}
          date={item.date}
          name={item.name}
          timeRange={item.timeRange}
          status={item.status}
          onPress={() => {
            navigation.navigate(SCREENS.MANUALATTENDANCEDETAILS, {
              status: item.status,
            });
          }}
        />
      ))}
    </View>
  );
};

export default ManualCorrections;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    contentContainerStyle: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      flex: 1,
      marginTop: -hp(1.4),
    },
    rowSb: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: hp(3),
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });
