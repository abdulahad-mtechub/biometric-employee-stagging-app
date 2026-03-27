import moment from 'moment';
import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {statusStyles} from '../Constants/DummyData';
import {Fonts} from '../Constants/Fonts';
import {attendanceMonthly, getLastPunchDetails} from '../Constants/api';
import {Colors} from '../Constants/themeColors';
import {useAlert} from '../Providers/AlertContext';
import {Svgs} from '../assets/Svgs/Svgs';
import StatusBox from '../components/Cards/StatusBox';
import {formatSecondsToHourMin} from '../utils/Helpers';
import {pxToPercentage} from '../utils/responsive';

const ViewAttendanceDetails = ({navigation, route}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const token = useSelector(state => state?.auth?.user?.token);
  const {showAlert} = useAlert();
  const passedData = route?.params || {};
  console.log('Passed Data:', JSON.stringify(passedData, null, 2));
  const {
    currentWorkingHours = 0,
    currentBreakTime = 0,
    workStartTime = null,
    clockOutTime = null,
    status = 'On Time',
  } = passedData;
  const [attendanceData, setAttendanceData] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const getCurrentMonth = () => {
    return moment().format('YYYY-MM');
  };

  const fetchAttendanceDetails = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const month = getCurrentMonth();

      const monthlyDataResponse = await attendanceMonthly(month, token);
      if (monthlyDataResponse?.data) {
        setMonthlyData(monthlyDataResponse.data);

        const allPunches = [];
        if (monthlyDataResponse.data.records) {
          monthlyDataResponse.data.records.forEach(dayRecord => {
            if (dayRecord.punches && Array.isArray(dayRecord.punches)) {
              allPunches.push(...dayRecord.punches);
            }
          });
        }

        const sortedPunches = allPunches.sort(
          (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
        );

        setAttendanceData(sortedPunches);
      }

      const response = await getLastPunchDetails(token);
      if (response?.data?.attendance_records) {
        const todayRecords = response.data.attendance_records
          .filter(record => {
            const recordDate = moment(record.occurred_at).format('YYYY-MM-DD');
            const today = moment().format('YYYY-MM-DD');
            return recordDate === today;
          })
          .sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));

        calculateSummary(todayRecords);
      } else {
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      showAlert('Failed to fetch attendance details', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateSummary = records => {
    if (!records || records.length === 0) {
      if (passedData.currentWorkingHours || passedData.currentBreakTime) {
      } else {
      }
      return;
    }

    const clockInRecord = records.find(r => r.action_type === 'CLOCK_IN');
    const clockOutRecord = records.find(r => r.action_type === 'CLOCK_OUT');

    let totalBreakTime = 0;
    let totalWorkTime = 0;

    // Calculate break time
    let breakStartTime = null;
    records.forEach(record => {
      if (record.action_type === 'BREAK_START') {
        breakStartTime = new Date(record.occurred_at).getTime();
      } else if (record.action_type === 'BREAK_END' && breakStartTime) {
        const breakEndTime = new Date(record.occurred_at).getTime();
        totalBreakTime += (breakEndTime - breakStartTime) / 1000;
        breakStartTime = null;
      }
    });

    // Calculate total work time
    if (clockInRecord) {
      const clockInTime = new Date(clockInRecord.occurred_at).getTime();
      const clockOutTime = clockOutRecord
        ? new Date(clockOutRecord.occurred_at).getTime()
        : Date.now();

      totalWorkTime = (clockOutTime - clockInTime) / 1000;

      // Determine status based on work hours
      const workHours = totalWorkTime / 3600;
      // Minimum threshold: consider it "same time" if less than 1 minute (0.0167 hours)
      const isSameTimeCheckInOut = workHours < 0.0167;

      if (isSameTimeCheckInOut && clockOutRecord) {
        // Check-in and check-out at the same time - mark as Early Out
        status = 'Early Out';
      } else if (workHours < 8 && clockOutRecord) {
        status = 'Early Out';
      } else if (workHours >= 8) {
        status = 'On Time';
      }
    }

    // If we have passed data and it's more recent, use it instead
    if (
      passedData.currentWorkingHours > 0 &&
      passedData.currentWorkingHours > totalWorkTime
    ) {
      totalWorkTime = passedData.currentWorkingHours;
      totalBreakTime = passedData.currentBreakTime;
      status = passedData.status;
    }
  };

  useEffect(() => {
    fetchAttendanceDetails();
  }, []);

  const onRefresh = () => {
    fetchAttendanceDetails(true);
  };

  const getActionIcon = actionType => {
    switch (actionType) {
      case 'CLOCK_IN':
        return <Svgs.clockCheckin />;
      case 'CLOCK_OUT':
        return <Svgs.clockCheckinWhite />;
      case 'BREAK_START':
        return <Svgs.breakCupFilled />;
      case 'BREAK_END':
        return <Svgs.timerPause />;
      default:
        return <Svgs.clockCheckin />;
    }
  };

  const getActionColor = actionType => {
    switch (actionType) {
      case 'CLOCK_IN':
        return Colors.lightTheme.primaryColor;
      case 'CLOCK_OUT':
        return '#4BCE97';
      case 'BREAK_START':
        return '#FF8B00';
      case 'BREAK_END':
        return '#9F8FEF';
      default:
        return Colors.lightTheme.primaryColor;
    }
  };

  const getActionTitle = actionType => {
    switch (actionType) {
      case 'CLOCK_IN':
        return t('Clock In');
      case 'CLOCK_OUT':
        return t('Clock Out');
      case 'BREAK_START':
        return t('Break Started');
      case 'BREAK_END':
        return t('Break Ended');
      default:
        return actionType;
    }
  };

  const AttendanceTimelineItem = ({record, isLast}) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeftSection}>
        <View
          style={[
            styles.timelineIcon,
            {backgroundColor: getActionColor(record.action_type)},
          ]}>
          {getActionIcon(record.action_type)}
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>
            {getActionTitle(record.action_type)}
          </Text>
          <Text style={styles.timelineTime}>
            {moment(record.occurred_at).format('hh:mm A')}
          </Text>
        </View>

        <View style={styles.timelineDetails}>
          <Text style={styles.timelineDetailText}>
            {moment(record.occurred_at).format('DD MMM, YYYY')}
          </Text>

          {/* Show location info */}
          {record.location &&
            (record.location.gps_latitude || record.location.gps_longitude) && (
              <Text style={styles.timelineLocation} numberOfLines={2}>
                📍 {t('Lat')}: {record.location.gps_latitude}, {t('Lng')}:{' '}
                {record.location.gps_longitude}
              </Text>
            )}

          {/* Show verification status */}
          {record.verification && (
            <View style={styles.verificationContainer}>
              <Text
                style={[
                  styles.timelineNotes,
                  {
                    color: record.verification.face_matched
                      ? '#4BCE97'
                      : '#FF6B6B',
                  },
                ]}>
                ✓ {t('Face')}:{' '}
                {record.verification.face_matched
                  ? t('Matched')
                  : t('Not Matched')}
                {record.verification.face_match_score &&
                  ` (${(
                    parseFloat(record.verification.face_match_score) * 100
                  ).toFixed(1)}%)`}
              </Text>
              {record.verification.punch_status && (
                <Text style={styles.statusText}>
                  {t('Status')}: {t(record.verification.punch_status)}
                </Text>
              )}
            </View>
          )}

          {/* Show device info */}
          {record.device_info && (
            <Text style={styles.deviceInfo}>
              📱 {record.device_info.source} • v{record.device_info.app_version}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const SummaryCard = () => {
    const style = statusStyles[status] || statusStyles['On Time'];
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t("Today's Summary")}</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('Working Hours')}</Text>
          <Text style={styles.summaryValue}>
            {formatSecondsToHourMin(currentWorkingHours - currentBreakTime)}
          </Text>
        </View>

        {/* <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('Break Time')}</Text>
          <Text style={styles.summaryValue}>
            {formatSecondsToHourMin(currentBreakTime)}
          </Text>
        </View> */}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('Status')}</Text>
          <StatusBox
            status={style.name}
            backgroundColor={style.backgroundColor}
            color={style.color}
            icon={style.icon}
          />
        </View>

        {workStartTime && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('Clock In')}</Text>
            <Text style={styles.summaryValue}>
              {moment(workStartTime).format('hh:mm A')}
            </Text>
          </View>
        )}

        {clockOutTime && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('Clock Out')}</Text>
            <Text style={styles.summaryValue}>
              {moment(clockOutTime).format('hh:mm A')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const MonthlyStatsCard = () => {
    if (!monthlyData?.statistics) return null;

    const stats = monthlyData.statistics;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t('Monthly Statistics')}</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('Working Days')}</Text>
          <Text style={styles.summaryValue}>
            {stats.working_days}/{stats.total_days}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('Present Days')}</Text>
          <Text style={styles.summaryValue}>{stats.present_days}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('Total Hours')}</Text>
          <Text style={styles.summaryValue}>
            {stats.total_working_hours.toFixed(2)}h
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('Total Punches')}</Text>
          <Text style={styles.summaryValue}>{stats.total_punches}</Text>
        </View>
      </View>
    );
  };

  const LoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      {/* Header Skeleton */}
      <View style={styles.skeletonDateHeader}>
        <View style={styles.skeletonDateText} />
      </View>

      {/* Summary Card Skeleton */}
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonCardTitle} />
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.skeletonRow}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonValue} />
          </View>
        ))}
      </View>

      {/* Monthly Stats Card Skeleton */}
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonCardTitle} />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <View key={i} style={styles.skeletonRow}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonValue} />
          </View>
        ))}
      </View>

      {/* Timeline Skeleton */}
      <View style={styles.skeletonTimelineContainer}>
        <View style={styles.skeletonTimelineTitle} />
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.skeletonTimelineItem}>
            <View style={styles.skeletonTimelineIcon} />
            <View style={styles.skeletonTimelineContent}>
              <View style={styles.skeletonTimelineHeader}>
                <View style={styles.skeletonTimelineItemTitle} />
                <View style={styles.skeletonTimelineTime} />
              </View>
              <View style={styles.skeletonTimelineDetails}>
                <View style={styles.skeletonTimelineDetail} />
                <View style={styles.skeletonTimelineDetail} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon
            name="chevron-left"
            size={RFPercentage(4)}
            color={isDarkMode ? 'white' : 'black'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Attendance Details')}</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <LoadingSkeleton />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.lightTheme.primaryColor]}
            />
          }>
          {/* Date Header */}
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>
              {monthlyData
                ? moment(monthlyData.month).format('MMMM YYYY')
                : moment().format('MMMM YYYY')}
            </Text>
          </View>

          {/* Today's Summary Card */}
          <SummaryCard />

          {/* Monthly Stats Card */}
          <MonthlyStatsCard />

          {/* Timeline */}
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineHeader}>
              {t('Monthly Activity')}
              {/* ({attendanceData.length} {t('punches')}) */}
            </Text>

            {attendanceData.length > 0 ? (
              attendanceData.map((record, index) => (
                <AttendanceTimelineItem
                  key={record.id || index}
                  record={record}
                  isLast={index === attendanceData.length - 1}
                />
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  {t('No attendance records for this month')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    backButton: {
      padding: wp(2),
    },
    headerTitle: {
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    placeholder: {
      width: wp(8),
    },
    scrollView: {
      flex: 1,
    },
    dateHeader: {
      padding: wp(4),
      alignItems: 'center',
    },
    dateText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    summaryCard: {
      marginHorizontal: wp(4),
      marginBottom: hp(2),
      padding: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(3),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    summaryTitle: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(2),
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.5),
    },
    summaryLabel: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    summaryValue: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.NunitoMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    timelineContainer: {
      marginHorizontal: wp(4),
      marginBottom: hp(4),
    },
    timelineHeader: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(2),
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: hp(2),
    },
    timelineLeftSection: {
      alignItems: 'center',
      marginRight: wp(4),
    },
    timelineIcon: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginTop: hp(1),
    },
    timelineContent: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(3),
      padding: wp(3),
    },
    timelineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    timelineTitle: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    timelineTime: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.NunitoMedium,
      color: Colors.lightTheme.primaryColor,
    },
    timelineDetails: {
      gap: hp(0.5),
    },
    timelineDetailText: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    timelineLocation: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    timelineNotes: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    noDataContainer: {
      alignItems: 'center',
      paddingVertical: hp(4),
    },
    noDataText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    verificationContainer: {
      marginTop: hp(0.5),
    },
    statusText: {
      fontSize: RFPercentage(pxToPercentage(11)),
      fontFamily: Fonts.NunitoRegular,
      color: '#FF8B00',
      marginTop: hp(0.2),
    },
    deviceInfo: {
      fontSize: RFPercentage(pxToPercentage(11)),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(0.2),
    },
    loadingContainer: {
      flex: 1,
      paddingHorizontal: wp(4),
    },
    skeletonDateHeader: {
      padding: wp(4),
      alignItems: 'center',
    },
    skeletonDateText: {
      width: wp(50),
      height: hp(2.5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
    },
    skeletonCard: {
      marginHorizontal: wp(4),
      marginBottom: hp(2),
      padding: wp(4),
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8',
      borderRadius: wp(3),
    },
    skeletonCardTitle: {
      width: wp(40),
      height: hp(2.5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
      marginBottom: hp(2),
    },
    skeletonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.5),
    },
    skeletonLabel: {
      width: wp(25),
      height: hp(2),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
    },
    skeletonValue: {
      width: wp(20),
      height: hp(2),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
    },
    skeletonTimelineContainer: {
      marginHorizontal: wp(4),
      marginBottom: hp(4),
    },
    skeletonTimelineTitle: {
      width: wp(60),
      height: hp(2.5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
      marginBottom: hp(2),
    },
    skeletonTimelineItem: {
      flexDirection: 'row',
      marginBottom: hp(2),
    },
    skeletonTimelineIcon: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      marginRight: wp(4),
    },
    skeletonTimelineContent: {
      flex: 1,
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8',
      borderRadius: wp(3),
      padding: wp(3),
    },
    skeletonTimelineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    skeletonTimelineItemTitle: {
      width: wp(25),
      height: hp(2),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
    },
    skeletonTimelineTime: {
      width: wp(15),
      height: hp(1.5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
    },
    skeletonTimelineDetails: {
      gap: hp(0.5),
    },
    skeletonTimelineDetail: {
      width: wp(45),
      height: hp(1.5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
    },
  });

export default ViewAttendanceDetails;
