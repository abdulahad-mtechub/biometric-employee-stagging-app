import moment from 'moment';
import {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import StackHeader from '../../components/Header/StackHeader';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';

// Import the card components
import AttendanceCard from './Reports/AttendanceCard';
import ScheduleComplianceCard from './Reports/ScheduleComplianceCard';
import TaskReportCard from './Reports/TaskReportCard';

const ReportsScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {isDarkMode} = useSelector(store => store.theme);
  const {language} = useSelector(store => store?.auth);
  const styles = getStyles(isDarkMode);

  const languageCode = language === 'Español' ? 'es' : 'en';

  // Get current month's date range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: startOfMonth,
      endDate: endOfMonth,
    };
  };

  // State
  const [dateRange, setDateRange] = useState(getCurrentMonthRange());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Format date for display
  const formatDateDisplay = date => {
    return moment(date).format('MMM DD, YYYY');
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = date => {
    return moment(date).format('YYYY-MM-DD');
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset to trigger re-fetch in child components
    setDateRange({...dateRange});
    setTimeout(() => setRefreshing(false), 1000);
  }, [dateRange]);

  // Date range key to force re-render
  const dateRangeKey = `${formatDateForAPI(
    dateRange.startDate,
  )}-${formatDateForAPI(dateRange.endDate)}`;

  // Date Range Selector Component
  const DateRangeSelector = () => (
    <View style={styles.dateSelectorContainer}>
      <Text style={styles.dateSectionTitle}>{t('Select Date Range')}</Text>
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}>
          <MaterialIcons
            name="calendar-today"
            size={RFPercentage(2)}
            color="#4A90E2"
          />
          <Text style={styles.dateButtonText}>
            {formatDateDisplay(dateRange.startDate)}
          </Text>
        </TouchableOpacity>

        <Text style={styles.dateSeparator}>{t('to')}</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}>
          <MaterialIcons
            name="calendar-today"
            size={RFPercentage(2)}
            color="#4A90E2"
          />
          <Text style={styles.dateButtonText}>
            {formatDateDisplay(dateRange.endDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Date Filters */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={styles.quickFilterButton}
          onPress={() => {
            const now = new Date();
            setDateRange({
              startDate: new Date(now.getFullYear(), now.getMonth(), 1),
              endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
            });
          }}>
          <Text style={styles.quickFilterText}>{t('This Month')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickFilterButton}
          onPress={() => {
            const now = new Date();
            const lastMonth = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              1,
            );
            setDateRange({
              startDate: lastMonth,
              endDate: new Date(now.getFullYear(), now.getMonth(), 0),
            });
          }}>
          <Text style={styles.quickFilterText}>{t('Last Month')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickFilterButton}
          onPress={() => {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            setDateRange({
              startDate: startOfWeek,
              endDate: now,
            });
          }}>
          <Text style={styles.quickFilterText}>{t('This Week')}</Text>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      <DatePicker
        modal
        open={showStartDatePicker}
        date={dateRange.startDate}
        mode="date"
        locale={languageCode}
        title={t('Select Start Date')}
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
        onConfirm={date => {
          setShowStartDatePicker(false);
          if (date <= dateRange.endDate) {
            setDateRange(prev => ({...prev, startDate: date}));
          } else {
            // If start date is after end date, adjust end date
            setDateRange({startDate: date, endDate: date});
          }
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <DatePicker
        modal
        open={showEndDatePicker}
        date={dateRange.endDate}
        mode="date"
        locale={languageCode}
        title={t('Select End Date')}
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
        onConfirm={date => {
          setShowEndDatePicker(false);
          if (date >= dateRange.startDate) {
            setDateRange(prev => ({...prev, endDate: date}));
          } else {
            // If end date is before start date, adjust start date
            setDateRange({startDate: date, endDate: date});
          }
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Reports')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.2),
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
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Date Range Selector */}
        <DateRangeSelector />

        {/* Report Sections */}
        <View style={styles.sectionsContainer}>
          {/* Section 1: Schedule Compliance */}
          <ScheduleComplianceCard
            key={`schedule-${dateRangeKey}`}
            dateRange={dateRange}
          />

          {/* Section 2: Attendance */}
          <AttendanceCard
            key={`attendance-${dateRangeKey}`}
            dateRange={dateRange}
          />

          {/* Section 3: Task Report */}
          <TaskReportCard key={`task-${dateRangeKey}`} dateRange={dateRange} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const getStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : '#F5F7FA',
    },
    scrollView: {
      flex: 1,
    },
    dateSelectorContainer: {
      backgroundColor: isDarkMode ? Colors.darkTheme.cardBackground : '#FFFFFF',
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      marginBottom: hp(1),
    },
    dateSectionTitle: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(1.5),
    },
    dateRangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#3A3A3A' : '#F8F8F8',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      flex: 1,
      justifyContent: 'center',
    },
    dateButtonText: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      marginLeft: wp(2),
      fontFamily: Fonts.PoppinsMedium,
    },
    dateSeparator: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#888888' : '#666666',
      marginHorizontal: wp(2),
      fontFamily: Fonts.PoppinsMedium,
    },
    quickFilters: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: hp(2),
    },
    quickFilterButton: {
      backgroundColor: isDarkMode ? '#3A3A3A' : '#E8F4FD',
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      borderRadius: wp(2),
      borderWidth: 1,
      borderColor: '#4A90E2',
    },
    quickFilterText: {
      fontSize: RFPercentage(1.2),
      color: '#4A90E2',
      fontFamily: Fonts.PoppinsMedium,
    },
    sectionsContainer: {
      paddingHorizontal: wp(2),
    },
    bottomSpacer: {
      height: hp(4),
    },
  });

export default ReportsScreen;
