import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Fonts} from '../../Constants/Fonts';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';

export default function AttendanceListCard({item, onPress, containerStyle}) {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);

  // Helper function to get status color
  const getStatusColor = status => {
    const statusColors = {
      Present: '#34D399',
      'Half Day': '#FACC15',
      Absent: '#F87171',
      'Late Arrival': '#FB923C',
      'Early Out': '#A78BFA',
      'Full Day': '#34D399',
    };
    return statusColors[status] || '#60A5FA';
  };

  // Format date
  const formatDate = dateStr => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return {
      formatted: `${day}-${month}-${year}`,
      dayName: date.toLocaleDateString('en-US', {weekday: 'short'}),
    };
  };

  // Format time
  const formatTime = timeStr => {
    if (!timeStr || timeStr === t('N/A')) return '--:--';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? t('PM') : t('AM');
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Format working hours
  const formatWorkingHours = hours => {
    if (!hours && hours !== 0) return `0${t('h')} 0${t('m')}`;
    const totalMinutes = hours * 60;
    const workHours = Math.floor(totalMinutes / 60);
    const workMinutes = Math.round(totalMinutes % 60);
    return `${workHours}${t('h')} ${workMinutes}${t('m')}`;
  };

  // Format distance
  const formatDistance = meters => {
    if (!meters || meters === 0) return `0 ${t('m')}`;
    return meters > 1000
      ? `${(meters / 1000).toFixed(2)} ${t('km')}`
      : `${Math.round(meters)} ${t('m')}`;
  };

  const dateInfo = formatDate(item.date);
  const statusColor = getStatusColor(item.status);

  // Check if it's today's date
  const today = new Date();
  const itemDate = new Date(item.date);
  const isToday =
    itemDate.getDate() === today.getDate() &&
    itemDate.getMonth() === today.getMonth() &&
    itemDate.getFullYear() === today.getFullYear();

  // Get latest punch for verification info
  const latestPunch =
    item.punches && item.punches.length > 0
      ? item.punches[item.punches.length - 1]
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, containerStyle, isToday && styles.todayCard]}>
      {/* Today Badge */}
      {isToday && (
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>{t('Today')}</Text>
        </View>
      )}

      {/* Header with Date and Status */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={[styles.dayName, isToday && styles.todayText]}>
            {dateInfo.dayName}
          </Text>
          <Text style={[styles.dateText, isToday && styles.todayText]}>
            {dateInfo.formatted}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: statusColor + '20', borderColor: statusColor},
            isToday && {borderWidth: 2},
          ]}>
          <Text style={[styles.statusText, {color: statusColor}]}>
            {t(item.status)}
          </Text>
        </View>
      </View>

      {/* Time Details */}
      <View style={styles.timeSection}>
        <View style={styles.timeItem}>
          <View style={styles.timeIconContainer}>
            <Entypo name="login" size={RFPercentage(2)} color="#2196F3" />
          </View>
          <View style={styles.timeContent}>
            <Text style={styles.timeLabel}>{t('Clock In')}</Text>
            <Text style={styles.timeValue}>{item.checkInTime}</Text>
          </View>
        </View>

        <View style={styles.timeItem}>
          <View style={styles.timeIconContainer}>
            <Entypo name="log-out" size={RFPercentage(2)} color="#F44336" />
          </View>
          <View style={styles.timeContent}>
            <Text style={styles.timeLabel}>{t('Clock Out')}</Text>
            <Text style={styles.timeValue}>{item.checkOutTime}</Text>
          </View>
        </View>

        <View style={styles.timeItem}>
          <View style={styles.timeIconContainer}>
            <MaterialIcons
              name="timer"
              size={RFPercentage(2)}
              color="#4CAF50"
            />
          </View>
          <View style={styles.timeContent}>
            <Text style={styles.timeLabel}>{t('Working Hours')}</Text>
            <Text style={styles.timeValue}>
              {formatWorkingHours(item.workingHours)}
            </Text>
          </View>
        </View>
      </View>

      {/* Punch Count and Verification */}
      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <MaterialIcons name="face" size={RFPercentage(2)} color="#000" />
          <Text style={styles.detailText}>
            {item.totalPunches} {item.totalPunches === 1 ? t('Punch') : t('Punches')}
          </Text>
        </View>

        {latestPunch?.verification && (
          <View style={styles.verificationBadges}>
            {/* Face Verification Badge */}
            <View
              style={[
                styles.verificationBadge,
                {
                  backgroundColor: latestPunch.verification.face_matched
                    ? 'rgba(76, 175, 80, 0.15)'
                    : 'rgba(244, 67, 54, 0.15)',
                },
              ]}>
              <MaterialIcons
                name={
                  latestPunch.verification.face_matched
                    ? 'check-circle'
                    : 'cancel'
                }
                size={RFPercentage(1.6)}
                color={
                  latestPunch.verification.face_matched ? '#4CAF50' : '#F44336'
                }
              />
              <Text
                style={[
                  styles.verificationText,
                  {
                    color: latestPunch.verification.face_matched
                      ? '#4CAF50'
                      : '#F44336',
                  },
                ]}>
                {t('Face')}
              </Text>
            </View>

            {/* Location Validation Badge */}
            {latestPunch.location && (
              <View
                style={[
                  styles.verificationBadge,
                  {
                    backgroundColor: latestPunch.location.location_validated
                      ? 'rgba(76, 175, 80, 0.15)'
                      : 'rgba(255, 152, 0, 0.15)',
                  },
                ]}>
                <MaterialIcons
                  name={
                    latestPunch.location.location_validated
                      ? 'verified'
                      : 'error-outline'
                  }
                  size={RFPercentage(1.6)}
                  color={
                    latestPunch.location.location_validated
                      ? '#4CAF50'
                      : '#FF9800'
                  }
                />
                <Text
                  style={[
                    styles.verificationText,
                    {
                      color: latestPunch.location.location_validated
                        ? '#4CAF50'
                        : '#FF9800',
                    },
                  ]}>
                  {t('Location')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Location Distance */}
      {latestPunch?.location?.distance_from_office > 0 && (
        <View style={styles.locationSection}>
          <View style={styles.detailItem}>
            <MaterialIcons
              name="place"
              size={RFPercentage(2)}
              color="#FF5722"
            />
            <Text style={styles.detailText}>
              {formatDistance(latestPunch.location.distance_from_office)}{' '}
              {t('from office')}
            </Text>
          </View>
          {latestPunch.location.gps_accuracy && (
            <Text style={styles.accuracyText}>
              {t('Accuracy')}: ±{latestPunch.location.gps_accuracy}m
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    card: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.backgroundColor,
      borderRadius: 15,
      padding: wp(4),
      marginVertical: hp(0.8),
      borderWidth: 1,
      borderColor: '#dcdcdc',
      position: 'relative',
    },
    todayCard: {
      borderWidth: 1,
      borderColor: '#2196F3',
      shadowColor: '#2196F3',
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    todayBadge: {
      position: 'absolute',
      backgroundColor: '#2196F3',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.2),
      borderTopEndRadius: 4,
      borderBottomRightRadius: 15,
      zIndex: 1,
    },
    todayBadgeText: {
      color: '#fff',
      fontFamily: Fonts.PoppinsBold,
      fontSize: RFPercentage(pxToPercentage(10)),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    todayText: {
      color: '#2196F3',
      fontFamily: Fonts.PoppinsBold,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
      paddingBottom: hp(1.5),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.08)',
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    dayName: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    dateText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    statusBadge: {
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      borderRadius: 20,
      borderWidth: 1,
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(12)),
    },
    timeSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: hp(2),
      gap: wp(2),
    },
    timeItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
    },
    timeIconContainer: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeContent: {
      flex: 1,
    },
    timeLabel: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(10)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0.2),
    },
    timeValue: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(13)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    detailsSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1.5),
      paddingTop: hp(1.5),
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
    },
    detailText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    verificationBadges: {
      flexDirection: 'row',
      gap: wp(1.5),
    },
    verificationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(0.8),
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.4),
      borderRadius: 15,
    },
    verificationText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(10)),
    },
    locationSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1),
      paddingHorizontal: wp(2),
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 10,
    },
    accuracyText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(10)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    evidenceSection: {
      marginTop: hp(1.5),
      paddingTop: hp(1.5),
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    evidenceLabel: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
    },
    selfieImage: {
      width: wp(20),
      height: wp(20),
      borderRadius: 10,
      borderWidth: 2,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.1)',
    },
    punchStatusContainer: {
      marginTop: hp(1.5),
      alignItems: 'flex-end',
    },
    punchStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.6),
      borderRadius: 20,
    },
    punchStatusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(11)),
    },
  });

function pxToPercentage(value) {
  return value / 7.8;
}
