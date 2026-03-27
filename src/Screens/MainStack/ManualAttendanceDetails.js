import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import StackHeader from '../../components/Header/StackHeader';
import {Fonts} from '../../Constants/Fonts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import AttendanceDetailsCard2 from '../../components/Cards/AttendanceDetailsCard2';
import RequestDetailsCard from '../../components/Cards/RequestDetailsCard';
import {Svgs} from '../../assets/Svgs/Svgs';
import {useTranslation} from 'react-i18next';

const ManualAttendanceDetails = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const attendanceData = {
    checkIn: '09:02AM',
    checkOut: '07:00 PM',
    workingHours: '8 Hours 58 mins',
    breakTime: '01:12 PM - 2:20 PM',
    PunchLocation: ['Calle de Alcalá, 32, 28009', 'Madrid, Spain'],
    totalBreak: '1 Hours 8 mins',
    overtimeDetails: '56 Min Overtime',
  };
  const RequestDetails = [
    {label: 'Type', value: 'Leave'},
    {label: 'Date', value: '2025-06-12'},
    {label: 'Punch-In/Out', value: '09:00 AM / 06:00 PM'},
    {label: 'Break-Start/End', value: '01:00 PM / 01:30 PM'},
    {label: 'Description', value: ['Went for appointment', 'Returned late']},
  ];

  const Row = ({label, value}) => (
    <View style={styles.row}>
      <Text style={styles.label}>{t(label)}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
  return (
    <ScrollView style={styles.container}>
      <StackHeader
        title={'13 May, 2025'}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        onBackPress={() => navigation.goBack()}
        headerStyle={styles.headerStyle}
      />

      <View style={styles.statusContainer}>
        <WorkerStatus
          name={'Status'}
          status={'Present'}
          nameTextStyle={styles.statusText}
        />
        <View style={styles.rowSb}>
          <Text style={[styles.statusText]}>{t('Requested')}</Text>
          <Text
            style={[
              styles.statusText,
              {fontFamily: Fonts.PoppinsRegular, fontSize: RFPercentage(1.6)},
            ]}>
            {t('Manual')}
          </Text>
        </View>
      </View>
      <AttendanceDetailsCard2 details={attendanceData} />
      <Text style={styles.sectionHeading}>{t('Request Details')}</Text>

      <View style={styles.statusContainer}>
        <WorkerStatus
          name={'Status'}
          status={'Present'}
          nameTextStyle={styles.statusText}
        />
        <View style={styles.rowSb}>
          <Text style={[styles.statusText]}>{t('Requested')}</Text>
          <Text
            style={[
              styles.statusText,
              {fontFamily: Fonts.PoppinsRegular, fontSize: RFPercentage(1.6)},
            ]}>
            {'12 May, 2025'}
          </Text>
        </View>
      </View>

      <RequestDetailsCard details={RequestDetails} />

      <View style={styles.cardContainer}>
        <View style={styles.rowSb}>
          <Text style={styles.title}>{t('Action Details')}</Text>

          <Svgs.ChevronDownFilled height={wp(7)} width={wp(7)} />
        </View>
        <Row label={'Action on'} value={'13 May, 2025'} />
        <Row
          label={'Admin Comment'}
          value={
            "Your request has been approved and will add your manual punch with in 2 days if your punch doesn't updated comment in request"
          }
        />
      </View>
    </ScrollView>
  );
};

export default ManualAttendanceDetails;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      paddingVertical: wp(2),
      paddingHorizontal: wp(3),
      marginVertical: wp(1.5),
      borderRadius: wp(2),
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.9),
    },
    rowSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(0.5),
    },
    sectionHeading: {
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.9),
      marginLeft: wp(5),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.9),
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
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'right',
    },
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
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlignVertical: 'center',
      //   marginBottom: hp(2),
    },
  });
