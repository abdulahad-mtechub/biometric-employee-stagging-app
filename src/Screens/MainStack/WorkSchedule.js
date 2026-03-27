import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {getMySchedule} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import StackHeader from '../../components/Header/StackHeader';
import {useAlert} from '../../Providers/AlertContext';

const WorkSchedule = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {user} = useSelector(store => store.auth);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const {showAlert} = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);

  const fetchSchedule = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMySchedule(user?.token);

      if (response?.error === false && response?.data) {
        setScheduleData(response.data);
      } else {
        showAlert(
          response?.message || t('Failed to fetch work schedule'),
          'error',
        );
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      showAlert(t('Failed to fetch work schedule'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const formatTime = time => {
    if (!time) return 'N/A';
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayAbbreviation = day => {
    const dayMap = {
      Mon: t('Monday'),
      Tue: t('Tuesday'),
      Wed: t('Wednesday'),
      Thu: t('Thursday'),
      Fri: t('Friday'),
      Sat: t('Saturday'),
      Sun: t('Sunday'),
    };
    return dayMap[day] || day;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StackHeader
          title={t('Work Schedule')}
          headerTxtStyle={{
            textAlign: 'left',
            fontSize: RFPercentage(2.6),
            fontFamily: Fonts.PoppinsSemiBold,
          }}
          headerStyle={{
            paddingVertical: hp(2),
            backgroundColor: isDarkMode
              ? Colors.darkTheme.secondryColor
              : Colors.lightTheme.backgroundColor,
          }}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={
              isDarkMode
                ? Colors.darkTheme.primaryColor
                : Colors.lightTheme.primaryColor
            }
          />
          <Text style={styles.loadingText}>{t('Loading schedule...')}</Text>
        </View>
      </View>
    );
  }

  if (!scheduleData?.hasSettings) {
    return (
      <View style={styles.container}>
        <StackHeader
          title={t('Work Schedule')}
          headerTxtStyle={{
            textAlign: 'left',
            fontSize: RFPercentage(2.6),
            fontFamily: Fonts.PoppinsSemiBold,
          }}
          headerStyle={{
            paddingVertical: hp(2),
            backgroundColor: isDarkMode
              ? Colors.darkTheme.secondryColor
              : Colors.lightTheme.backgroundColor,
          }}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={hp(10)}
            color={
              isDarkMode
                ? Colors.darkTheme.BorderGrayColor
                : Colors.lightTheme.BorderGrayColor
            }
          />
          <Text style={styles.emptyText}>
            {t('No work schedule has been assigned to you yet.')}
          </Text>
          <Text style={styles.emptySubtext}>
            {t('Please contact your administrator for more information.')}
          </Text>
        </View>
      </View>
    );
  }

  const {schedule, location} = scheduleData;

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Work Schedule')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.6),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{
          paddingVertical: hp(2),
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : Colors.lightTheme.backgroundColor,
        }}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSchedule(true)}
            colors={[
              isDarkMode
                ? Colors.darkTheme.primaryColor
                : Colors.lightTheme.primaryColor,
            ]}
            tintColor={
              isDarkMode
                ? Colors.darkTheme.primaryColor
                : Colors.lightTheme.primaryColor
            }
          />
        }>
        {/* Working Days Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={hp(3)}
              color={
                isDarkMode
                  ? Colors.darkTheme.primaryColor
                  : Colors.lightTheme.primaryColor
              }
            />
            <Text style={styles.cardTitle}>{t('Working Days')}</Text>
          </View>
          <View style={styles.daysContainer}>
            {schedule?.days?.map((day, index) => (
              <View key={index} style={styles.dayChip}>
                <Text style={styles.dayChipText}>
                  {getDayAbbreviation(day)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Working Hours Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={hp(3)}
              color={
                isDarkMode
                  ? Colors.darkTheme.primaryColor
                  : Colors.lightTheme.primaryColor
              }
            />
            <Text style={styles.cardTitle}>{t('Working Hours')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('Start Time:')}</Text>
            <Text style={styles.infoValue}>{formatTime(schedule?.start)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('End Time:')}</Text>
            <Text style={styles.infoValue}>{formatTime(schedule?.end)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('Daily Hours:')}</Text>
            <Text style={styles.infoValue}>
              {schedule?.dailyHours || 0} {t('hours')}
            </Text>
          </View>
        </View>

        {/* Break Policy Card */}
        {schedule?.breakPolicy?.unpaid && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="coffee-outline"
                size={hp(3)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryColor
                    : Colors.lightTheme.primaryColor
                }
              />
              <Text style={styles.cardTitle}>{t('Break Policy')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Unpaid Break:')}</Text>
              <Text style={styles.infoValue}>
                {schedule.breakPolicy.unpaid} {t('minutes')}
              </Text>
            </View>
          </View>
        )}

        {/* Grace Period Card */}
        {schedule?.graceMinutes !== undefined && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={hp(3)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryColor
                    : Colors.lightTheme.primaryColor
                }
              />
              <Text style={styles.cardTitle}>{t('Grace Period')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Grace Minutes:')}</Text>
              <Text style={styles.infoValue}>
                {schedule.graceMinutes} {t('minutes')}
              </Text>
            </View>
            <Text style={styles.graceNote}>
              {t(
                'You can clock in up to {{minutes}} minutes late without penalty.',
                {minutes: schedule.graceMinutes},
              )}
            </Text>
          </View>
        )}

        {/* Work Location Card */}
        {location && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="location-on"
                size={hp(3)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryColor
                    : Colors.lightTheme.primaryColor
                }
              />
              <Text style={styles.cardTitle}>{t('Work Location')}</Text>
            </View>
            <Text style={styles.locationText}>
              {location.locationName || t('Location name not available')}
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Allowed Radius:')}</Text>
              <Text style={styles.infoValue}>
                {location.radiusMeters} {t('meters')}
              </Text>
            </View>
            <Text style={styles.locationNote}>
              {t('You must be within the specified radius to clock in/out.')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default WorkSchedule;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: hp(2),
    },
    loadingText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp(10),
      gap: hp(2),
    },
    emptyText: {
      fontSize: RFPercentage(2.2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
    card: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
      marginBottom: hp(2),
      //   borderWidth: 1,
      //   borderColor: isDarkMode
      //     ? Colors.darkTheme.BorderGrayColor
      //     : Colors.lightTheme.BorderGrayColor,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(2),
      gap: wp(2),
    },
    cardTitle: {
      fontSize: RFPercentage(2.2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    daysContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(2),
    },
    dayChip: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: wp(2),
    },
    dayChipText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
      color: '#FFFFFF',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    infoLabel: {
      fontSize: RFPercentage(1.9),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    infoValue: {
      fontSize: RFPercentage(1.9),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    graceNote: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(1),
      fontStyle: 'italic',
    },
    locationText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1.5),
      lineHeight: hp(2.8),
    },
    locationNote: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(1),
      fontStyle: 'italic',
    },
  });
