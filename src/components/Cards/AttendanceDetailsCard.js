import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {useTranslation} from 'react-i18next';
import {pxToPercentage} from '../../utils/responsive';

const AttendanceDetailsCard = ({details, onStartNewDay}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);

  const Row = ({label, value}) => (
    <View style={styles.row}>
      <Text style={styles.label}>{t(label)}</Text>
      <View style={styles.valueContainer}>
        {Array.isArray(value) ? (
          value.map((line, index) => (
            <Text key={index} style={styles.value}>
              {line}
            </Text>
          ))
        ) : (
          <Text style={styles.value}>{value}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.title}>{t("Today's Attendance Summary")}</Text>

      <Row label="Check-In Time" value={details.checkIn} />
      <Row label="Check-Out Time" value={details.checkOut} />
      <Row label="Total Working Hours" value={details.workingHours} />
      <Row label="Total Break Time" value={details.breakTime} />
      <Row label="Net Work Time" value={details.netWorkTime} />
      <Row label="Status" value={details.status} />

      {/* Add daily reset information */}
      <View style={styles.resetInfo}>
        <Text style={styles.resetText}>
          {t('Note: Working hours reset daily at midnight')}
        </Text>
      </View>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
      margin: wp(4),
    },
    title: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(2),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    valueContainer: {
      flex: 1.2,
      alignItems: 'flex-end',
    },
    value: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'right',
    },
    resetInfo: {
      marginTop: hp(2),
      padding: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(2),
    },
    resetText: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

export default AttendanceDetailsCard;
