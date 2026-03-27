import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Fonts} from '../../Constants/Fonts';
import {Svgs} from '../../assets/Svgs/Svgs';
import StatusBox from './StatusBox';
import {useTranslation} from 'react-i18next';

export default function WorkerStatus({
  name,
  status,
  nameTextStyle,
  showIcon,
  Dep,
  onPress,
  type,
  checkInTime,
  checkOutTime,
  date,
  time,
}) {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const statusStyles = {
    Leave: {
      backgroundColor: '#60A5FA',
      color: '#ffffff',
      icon: <Svgs.mailL height={hp(2)} />,
      name: 'Leave',
    },
    Invited: {
      backgroundColor: '#60A5FA',
      color: '#ffffff',
      icon: <Svgs.mailL height={hp(2)} />,
    },
    Present: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Active: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    active: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Paid: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Absent: {
      backgroundColor: '#F87171',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Error: {
      backgroundColor: '#F87171',
      color: '#ffffff',
      icon: <Svgs.alertWhite height={hp(2)} />,
    },
    Inactive: {
      backgroundColor: '#F87171',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    'Early Out': {
      backgroundColor: '#A78BFA',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    'Late Arrival': {
      backgroundColor: '#FB923C',
      color: '#000000',
      icon: <Svgs.CheckOutlineBlack height={hp(2)} />,
    },
    'Half Leave': {
      backgroundColor: '#FACC15',
      color: '#000000',
      icon: <Svgs.halfLeave height={hp(2)} />,
    },
    completed: {
      backgroundColor: '#10B981',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Completed: {
      backgroundColor: '#10B981',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Request: {
      backgroundColor: '#FACC15',
      color: '#000000',
      icon: <Svgs.halfLeave height={hp(2)} />,
    },
    Assigned: {
      backgroundColor: '#60A5FA',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    assigned: {
      backgroundColor: '#60A5FA',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    'In Progress': {
      backgroundColor: '#F59E0B',
      color: '#ffffff',
      icon: <Svgs.Processing height={hp(2)} />,
    },
    'in progress': {
      backgroundColor: '#F59E0B',
      color: '#ffffff',
      icon: <Svgs.Processing height={hp(2)} />,
    },
    in_progress: {
      backgroundColor: '#F59E0B',
      color: '#ffffff',
      icon: <Svgs.Processing height={hp(2)} />,
    },
    'In-Progress': {
      backgroundColor: '#F59E0B',
      color: '#ffffff',
      icon: <Svgs.Processing height={hp(2)} />,
    },
    Valid: {
      backgroundColor: Colors.lightTheme.primaryColor,
      color: '#ffffff',
      icon: <Svgs.lateWhite height={hp(2)} />,
    },
    Invalid: {
      backgroundColor: '#D50A0A',
      color: '#ffffff',
      icon: <Svgs.alertOutline height={hp(2)} />,
    },
    Rejected: {
      backgroundColor: '#D50A0A',
      color: '#ffffff',
      icon: <Svgs.CrossOutlineFill height={hp(2)} />,
    },
    Requested: {
      backgroundColor: '#F5CD47',
      color: '#000000',
      icon: <Svgs.halfLeave height={hp(2)} />,
    },
    Approved: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Processing: {
      backgroundColor: '#579DFF',
      color: '#ffffff',
      icon: <Svgs.Processing height={hp(2)} />,
    },
    Pending: {
      backgroundColor: '#579DFF',
      color: '#ffffff',
      icon: <Svgs.pending height={hp(2)} />,
    },
    PENDING: {
      backgroundColor: '#579DFF',
      color: '#ffffff',
      icon: <Svgs.pending height={hp(2)} />,
    },
    Ongoing: {
      backgroundColor: '#9F8FEF',
      color: '#ffffff',
      icon: <Svgs.ongoingWhite height={hp(2)} width={hp(2)} />,
    },
  };

  // Log status for debugging
  if (type === 'task' && !statusStyles[status]) {
    console.log(
      '⚠️ Unknown task status:',
      status,
      'Available statuses:',
      Object.keys(statusStyles),
    );
  }

  const style = statusStyles[status] || statusStyles.Absent;

  // Check if status is INFO_REQUESTED
  const isInfoRequested = status && status.toUpperCase() === 'INFO_REQUESTED';
  const recordDate = new Date(date);
  const day = String(recordDate.getDate()).padStart(2, '0');
  const month = String(recordDate.getMonth() + 1).padStart(2, '0');
  const year = recordDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  return (
    <TouchableOpacity onPress={onPress} style={styles.row}>
      <View>
        {type === 'attendance' ? (
          <>
            <Text
              style={[
                styles.name,
                nameTextStyle,
                {
                  color: isDarkMode
                    ? Colors.darkTheme.primaryTextColor
                    : '#000',
                },
              ]}>
              {status}
            </Text>
            <Text
              style={[
                styles.name,
                nameTextStyle,
                {fontSize: RFPercentage(1.5)},
              ]}>
              {time}
            </Text>
          </>
        ) : type === 'request' ? (
          <>
            <Text
              style={[
                styles.name,
                nameTextStyle,
                {
                  color: isDarkMode
                    ? Colors.darkTheme.primaryTextColor
                    : '#000',
                },
              ]}>
              {name === 'GENERIC_HR'
                ? t('Generic HR')
                : name === 'SCHEDULE_CHANGE'
                ? t('Schedule leave')
                : name}
            </Text>
            <Text
              style={[
                styles.name,
                nameTextStyle,
                {fontSize: RFPercentage(1.5)},
              ]}>
              {time}
            </Text>
          </>
        ) : (
          <Text style={[styles.name, nameTextStyle]}>{t(name)}</Text>
        )}
        {Dep && <Text style={[styles.name]}>{t(Dep)}</Text>}
      </View>
      {['remuneration', 'attendance'].includes(type) ? (
        <Text style={[styles.name, nameTextStyle]}>{t(formattedDate)}</Text>
      ) : type === 'request' || 'task' ? (
        <StatusBox
          status={status === 'INFO_REQUESTED' ? 'INFO QUERY' : status}
          backgroundColor={style.backgroundColor}
          color={style.color}
          icon={style.icon}
          showIcon={showIcon}
        />
      ) : null}
    </TouchableOpacity>
  );
}

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(0.7),
    },
    name: {
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.NunitoMedium,
    },

    statusText: {
      fontSize: RFPercentage(1.8),
      textAlign: 'center',
      textAlignVertical: 'center',
      marginLeft: wp(1),
      color: Colors.lightTheme.primaryTextColor,
    },
  });
