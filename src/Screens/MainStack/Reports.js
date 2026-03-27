import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {useSelector} from 'react-redux';
import DatePicker from 'react-native-date-picker';
import {BarChart, LineChart, PieChart} from 'react-native-gifted-charts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import StackHeader from '../../components/Header/StackHeader';
import UnifiedExportComponent from '../../components/ExportComponent/UnifiedExportComponent';
import FilterBtmSheet, {
  FilterConfig,
} from '../../components/BottomSheets/FilterBtmSheet';
import {useTranslation} from 'react-i18next';

const generateReport = async (
  type,
  startDate,
  endDate,
  workerId,
  companyId,
) => {
  try {
    const response = await fetch(
      'https://biometric-staging-backend.caprover-testing.mtechub.com/api/public/reports/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          startDate,
          endDate,
          workerId,
          companyId,
          showChartData: true,
        }),
      },
    );

    const data = await response.json();
    console.log(`API Response for ${type}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`API Error for ${type}:`, error);
    throw error;
  }
};

const Reports = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {user} = useSelector(store => store.auth);
  const {t} = useTranslation();
  const styles = getStyles(isDarkMode);
  const screenWidth = Dimensions.get('window').width - wp(10);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date('2025-10-03'),
    endDate: new Date('2025-11-16'),
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [workerDailyData, setWorkerDailyData] = useState(null);
  const [scheduleComplianceData, setScheduleComplianceData] = useState(null);
  const [workerPerformanceData, setWorkerPerformanceData] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [error, setError] = useState(null);
  const filterRef = useRef(null);
  const filterBottomSheetRef = useRef(null);
  const {language} = useSelector(store => store?.auth);
  const languageCode = language === 'Español' ? 'es' : 'en';

  // Format date for API
  const formatDate = date => {
    return date.toISOString().split('T')[0];
  };

  // Fetch all data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const startDateStr = formatDate(dateRange.startDate);
      const endDateStr = formatDate(dateRange.endDate);
      const workerId = user?.id || 8;
      const companyId = user?.company_id || 100011;

      const [dailyData, complianceData, performanceData] = await Promise.all([
        generateReport(
          'worker_daily',
          startDateStr,
          endDateStr,
          workerId,
          companyId,
        ),
        generateReport(
          'schedule_compliance',
          startDateStr,
          endDateStr,
          workerId,
          companyId,
        ),
        generateReport(
          'worker_performance',
          startDateStr,
          endDateStr,
          workerId,
          companyId,
        ),
      ]);

      console.log('=== API RESPONSE DATA ===');
      console.log('Worker Daily Data:', JSON.stringify(dailyData, null, 2));
      console.log(
        'Schedule Compliance Data:',
        JSON.stringify(complianceData, null, 2),
      );
      console.log(
        'Worker Performance Data:',
        JSON.stringify(performanceData, null, 2),
      );
      console.log('=======================');

      setWorkerDailyData(dailyData.data || null);
      setScheduleComplianceData(complianceData.data || null);
      setWorkerPerformanceData(performanceData.data || null);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      setWorkerDailyData(null);
      setScheduleComplianceData(null);
      setWorkerPerformanceData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, user]);

  // Initial load and refresh
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Export Functions for Worker Daily Data
  const getWorkerDailyColumnConfig = () => [
    {key: 'report_date', label: t('Report Date')},
    {key: 'worker_name', label: t('Worker Name')},
    {key: 'tasks_assigned', label: t('Tasks Assigned')},
    {key: 'tasks_completed', label: t('Tasks Completed')},
    {key: 'productive_tasks', label: t('Productive Tasks')},
    {key: 'average_task_time_hours', label: t('Avg Task Time (Hours)')},
    {key: 'hours_worked', label: t('Hours Worked')},
    {key: 'compliance_percentage', label: t('Compliance %')},
    {key: 'productivity_percentage', label: t('Productivity %')},
    {key: 'efficiency_percentage', label: t('Efficiency %')},
  ];

  const getWorkerDailyExportData = () => {
    const data = workerDailyData?.data || [];
    return data.map(item => ({
      report_date: new Date(item.report_date).toLocaleDateString(),
      worker_name: item.worker_name || 'N/A',
      tasks_assigned: item.tasks_assigned || '0',
      tasks_completed: item.tasks_completed || '0',
      productive_tasks: item.productive_tasks || '0',
      average_task_time_hours: item.average_task_time_hours || '0.00',
      hours_worked: item.hours_worked || '0.00',
      compliance_percentage: item.compliance_percentage || '0',
      productivity_percentage: item.productivity_percentage || '0',
      efficiency_percentage: item.efficiency_percentage || '0',
    }));
  };

  const getWorkerDailyExportFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = filtersApplied ? '-filtered' : '';
    return `worker-daily-report-${timestamp}${filterSuffix}`;
  };

  const getScheduleComplianceColumnConfig = () => [
    {key: 'worker_name', label: t('Worker Name')},
    {key: 'employee_id', label: t('Employee ID')},
    {key: 'company_name', label: t('Company Name')},
    {key: 'total_scheduled_days', label: t('Total Scheduled Days')},
    {key: 'days_attended', label: t('Days Attended')},
    {key: 'days_absent', label: t('Days Absent')},
    {key: 'total_scheduled_hours', label: t('Total Scheduled Hours')},
    {key: 'total_actual_hours', label: t('Total Actual Hours')},
    {key: 'total_hours_variance', label: t('Total Hours Variance')},
    {key: 'avg_scheduled_hours_per_day', label: t('Avg Scheduled Hours/Day')},
    {key: 'avg_actual_hours_per_day', label: t('Avg Actual Hours/Day')},
    {key: 'overall_compliance_percentage', label: t('Overall Compliance %')},
    {key: 'attendance_rate_percentage', label: t('Attendance Rate %')},
  ];

  const getScheduleComplianceExportData = () => {
    const data = scheduleComplianceData?.data || [];
    return data.map(item => ({
      worker_name: item.worker_name || 'N/A',
      employee_id: item.employee_id || 'N/A',
      company_name: item.company_name || 'N/A',
      total_scheduled_days: item.total_scheduled_days || '0',
      days_attended: item.days_attended || '0',
      days_absent: item.days_absent || '0',
      total_scheduled_hours: item.total_scheduled_hours || '0.00',
      total_actual_hours: item.total_actual_hours || '0.00',
      total_hours_variance: item.total_hours_variance || '0.00',
      avg_scheduled_hours_per_day: item.avg_scheduled_hours_per_day || '0.00',
      avg_actual_hours_per_day: item.avg_actual_hours_per_day || '0.00',
      overall_compliance_percentage: item.overall_compliance_percentage || '0',
      attendance_rate_percentage: item.attendance_rate_percentage || '0',
    }));
  };

  const getScheduleComplianceExportFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = filtersApplied ? '-filtered' : '';
    return `schedule-compliance-report-${timestamp}${filterSuffix}`;
  };

  const getWorkerPerformanceColumnConfig = () => [
    {key: 'worker_name', label: t('Worker Name')},
    {key: 'start_date', label: t('Start Date')},
    {key: 'end_date', label: t('End Date')},
    {key: 'tasks_assigned', label: t('Tasks Assigned')},
    {key: 'tasks_completed', label: t('Tasks Completed')},
    {key: 'productive_tasks', label: t('Productive Tasks')},
    {key: 'average_task_time_hours', label: t('Avg Task Time (Hours)')},
    {key: 'hours_worked', label: t('Hours Worked')},
    {key: 'compliance_percentage', label: t('Compliance %')},
    {key: 'productivity_percentage', label: t('Productivity %')},
    {key: 'efficiency_percentage', label: t('Efficiency %')},
  ];

  const getWorkerPerformanceExportData = () => {
    const data = workerPerformanceData?.data || [];
    return data.map(item => ({
      worker_name: item.worker_name || 'N/A',
      start_date: new Date(item.start_date).toLocaleDateString(),
      end_date: new Date(item.end_date).toLocaleDateString(),
      tasks_assigned: item.tasks_assigned || '0',
      tasks_completed: item.tasks_completed || '0',
      productive_tasks: item.productive_tasks || '0',
      average_task_time_hours: item.average_task_time_hours || '0.00',
      hours_worked: item.hours_worked || '0.00',
      compliance_percentage: item.compliance_percentage || '0',
      productivity_percentage: item.productivity_percentage || '0',
      efficiency_percentage: item.efficiency_percentage || '0',
    }));
  };

  const getWorkerPerformanceExportFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = filtersApplied ? '-filtered' : '';
    return `worker-performance-report-${timestamp}${filterSuffix}`;
  };

  // Filter handlers
  const handleFilters = useCallback(
    async filters => {
      console.log('Applied Filters for Reports:', filters);
      setFiltersApplied(true);
      setActiveFilters(filters);

      // Update date range based on filters
      if (filters.dateFrom || filters.dateTo) {
        setDateRange({
          startDate: filters.dateFrom
            ? new Date(filters.dateFrom)
            : dateRange.startDate,
          endDate: filters.dateTo
            ? new Date(filters.dateTo)
            : dateRange.endDate,
        });
      }
    },
    [dateRange],
  );

  const clearFilters = useCallback(async () => {
    setFiltersApplied(false);
    setActiveFilters({});

    if (filterRef.current) {
      filterRef.current.resetFilters();
    }

    // Reset to default date range
    setDateRange({
      startDate: new Date('2025-10-03'),
      endDate: new Date('2025-11-16'),
    });
  }, []);

  const getFilterOptions = () => {
    return {
      enabledFilters: [FilterConfig.DATE_RANGE],
      fileTypes: null,
      statuses: null,
      labels: {
        dateRange: 'Date Range',
        clearAll: 'Clear All',
        apply: 'Apply',
      },
    };
  };

  // Chart colors
  const accentColors = {
    blue: '#4A90E2',
    green: '#50E3C2',
    orange: '#F5A623',
    red: '#D0021B',
    purple: '#9013FE',
  };

  // Process data for charts
  const getWorkerDailyChartData = () => {
    const data = workerDailyData?.data || [];

    const lineData = data.map((item, index) => ({
      value: parseFloat(item.hours_worked) || 0,
      label: new Date(item.report_date).getDate().toString(),
      labelTextStyle: {
        color: isDarkMode ? '#FFFFFF' : '#333333',
        fontSize: RFPercentage(1.2),
        fontFamily: Fonts.PoppinsRegular,
      },
      dataPointText: parseFloat(item.hours_worked).toFixed(1),
      onPress: () => setSelectedDay(item),
    }));

    return {
      lineData,
      labels: data.map(item => new Date(item.report_date).getDate().toString()),
    };
  };

  const getScheduleComplianceData = () => {
    const raw = scheduleComplianceData?.data?.[0] || null;

    if (!raw) {
      return {
        attendanceData: [],
        hoursData: [],
        complianceData: {},
      };
    }

    const totalScheduledDays = parseInt(raw.total_scheduled_days) || 0;
    const daysAttended = parseInt(raw.days_attended) || 0;
    const daysAbsent = parseInt(raw.days_absent) || 0;

    const totalScheduledHours = parseFloat(raw.total_scheduled_hours) || 0;
    const totalActualHours = parseFloat(raw.total_actual_hours) || 0;

    const attendanceRate =
      totalScheduledDays > 0 ? (daysAttended / totalScheduledDays) * 100 : 0;

    const hoursVariance =
      totalScheduledHours > 0
        ? totalActualHours - totalScheduledHours
        : totalActualHours;

    const compliancePercentage =
      totalScheduledHours > 0
        ? (totalActualHours / totalScheduledHours) * 100
        : 0;

    const attendanceData = [
      {
        value: totalScheduledDays,
        label: t('Total'),
        frontColor: accentColors.blue,
      },
      {
        value: daysAttended,
        label: t('Attended'),
        frontColor: accentColors.green,
      },
      {value: daysAbsent, label: t('Absent'), frontColor: accentColors.red},
    ];

    const hoursData = [
      {
        value: totalScheduledHours,
        color: accentColors.blue,
        text: `${totalScheduledHours.toFixed(1)}h`,
      },
      {
        value: totalActualHours,
        color: accentColors.green,
        text: `${totalActualHours.toFixed(1)}h`,
      },
    ];

    return {
      attendanceData,
      hoursData,
      complianceData: {
        ...raw,
        attendance_rate_percentage: attendanceRate.toFixed(2),
        overall_compliance_percentage: compliancePercentage.toFixed(2),
        total_hours_variance: hoursVariance.toFixed(2),
      },
    };
  };

  const getWorkerPerformanceData = () => {
    const data = workerPerformanceData?.data?.[0] || null;

    if (!data) {
      return {
        performanceData: [],
        performanceStats: {},
      };
    }

    const performanceData = [
      {
        value: parseFloat(data.compliance_percentage) || 0,
        label: t('Compliance'),
        frontColor: accentColors.blue,
      },
      {
        value: parseFloat(data.productivity_percentage) || 0,
        label: t('Productivity'),
        frontColor: accentColors.green,
      },
      {
        value: parseFloat(data.efficiency_percentage) || 0,
        label: t('Efficiency'),
        frontColor: accentColors.orange,
      },
    ];

    return {performanceData, performanceStats: data};
  };

  // Date display component
  const DateRangeSelector = () => (
    <View style={styles.dateRangeContainer}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowStartDatePicker(true)}>
        <MaterialIcons
          name="calendar-today"
          size={RFPercentage(2)}
          color={accentColors.blue}
        />
        <Text style={styles.dateButtonText}>
          {dateRange.startDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <Text style={styles.dateSeparator}>to</Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowEndDatePicker(true)}>
        <MaterialIcons
          name="calendar-today"
          size={RFPercentage(2)}
          color={accentColors.blue}
        />
        <Text style={styles.dateButtonText}>
          {dateRange.endDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={showStartDatePicker}
        date={dateRange.startDate}
        mode="date"
        locale={languageCode}
        title={t('Select Date')}
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
        onConfirm={date => {
          setShowStartDatePicker(false);
          setDateRange(prev => ({...prev, startDate: date}));
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <DatePicker
        modal
        open={showEndDatePicker}
        date={dateRange.endDate}
        mode="date"
        locale={languageCode}
        title={t('Select Date')}
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
        onConfirm={date => {
          setShowEndDatePicker(false);
          setDateRange(prev => ({...prev, endDate: date}));
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />
    </View>
  );

  // Export Header Component
  const ExportHeader = ({title, exportComponent}) => (
    <View style={styles.exportHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.exportButtonsContainer}>{exportComponent}</View>
    </View>
  );

  // Loading component
  if (loading && !refreshing) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColors.blue} />
          <Text style={styles.loadingText}>{t('Loading Reports...')}</Text>
        </View>
      </View>
    );
  }

  const dailyChartData = getWorkerDailyChartData();
  const complianceData = getScheduleComplianceData();
  const performanceData = getWorkerPerformanceData();

  return (
    <View style={styles.container}>
      <StackHeader
        title={'Reports'}
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
            colors={[accentColors.blue]}
            tintColor={accentColors.blue}
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Date Range Selector */}
        <View style={styles.dateSection}>
          <Text style={styles.dateSectionTitle}>{t('Select Date Range')}</Text>
          <DateRangeSelector />
        </View>

        {/* Section 1: Daily Performance */}
        <View style={styles.section}>
          <ExportHeader
            title={t('Daily Performance')}
            exportComponent={
              <UnifiedExportComponent
                data={getWorkerDailyExportData()}
                columns={getWorkerDailyColumnConfig()}
                fileName={getWorkerDailyExportFileName()}
                title={t('Daily Performance Report')}
                onExportStart={() =>
                  console.log('Daily performance export started')
                }
                onExportSuccess={filePath =>
                  console.log('Daily performance export success:', filePath)
                }
                onExportError={error =>
                  console.log('Daily performance export error:', error)
                }
                currentLanguage={languageCode}
                companyLogo={
                  language === 'English'
                    ? 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725800605-204511942.png'
                    : 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725818779-222108661.png'
                }
                showShareDialog={true}
                maxColumns={5}
                isDarkMode={isDarkMode}>
                <TouchableOpacity style={styles.exportButton}>
                  <Text style={styles.exportButtonText}>{t('Export')}</Text>
                  <Entypo name="export" size={RFPercentage(2)} color={'#FFF'} />
                </TouchableOpacity>
              </UnifiedExportComponent>
            }
          />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('Hours Worked Trend')}</Text>
            <LineChart
              data={dailyChartData.lineData}
              height={200}
              showTextOnPress
              textShiftY={-10}
              textColor={accentColors.blue}
              width={screenWidth - wp(8)}
              spacing={50}
              color={accentColors.blue}
              thickness={3}
              dataPointsColor={accentColors.blue}
              dataPointsRadius={4}
              yAxisColor={isDarkMode ? '#444' : '#DDD'}
              xAxisColor={isDarkMode ? '#444' : '#DDD'}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              noOfSections={4}
              maxValue={10}
              yAxisLabelPrefix=""
              yAxisLabelSuffix="h"
              rulesColor={isDarkMode ? '#333' : '#EEE'}
              rulesType="solid"
            />
            {selectedDay && (
              <View style={styles.selectedDataBox}>
                <Text style={styles.selectedDataTitle}>
                  {new Date(selectedDay.report_date).toLocaleDateString()}
                </Text>
                <View style={styles.selectedDataRow}>
                  <Text style={styles.selectedDataLabel}>
                    {t('Hours Worked:')}
                  </Text>
                  <Text style={styles.selectedDataValue}>
                    {selectedDay.hours_worked}h
                  </Text>
                </View>
                <View style={styles.selectedDataRow}>
                  <Text style={styles.selectedDataLabel}>
                    {t('Tasks Completed:')}
                  </Text>
                  <Text style={styles.selectedDataValue}>
                    {selectedDay.tasks_completed}
                  </Text>
                </View>
                <View style={styles.selectedDataRow}>
                  <Text style={styles.selectedDataLabel}>
                    {t('Efficiency:')}
                  </Text>
                  <Text style={styles.selectedDataValue}>
                    {selectedDay.efficiency_percentage}%
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    {backgroundColor: accentColors.blue},
                  ]}
                />
                <Text style={styles.legendText}>{t('Hours Worked')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Schedule Compliance */}
        <View style={styles.section}>
          <ExportHeader
            title={t('Schedule Compliance')}
            exportComponent={
              <UnifiedExportComponent
                data={getScheduleComplianceExportData()}
                columns={getScheduleComplianceColumnConfig()}
                fileName={getScheduleComplianceExportFileName()}
                title={t('Schedule Compliance Report')}
                onExportStart={() =>
                  console.log('Schedule compliance export started')
                }
                onExportSuccess={filePath =>
                  console.log('Schedule compliance export success:', filePath)
                }
                onExportError={error =>
                  console.log('Schedule compliance export error:', error)
                }
                showShareDialog={true}
                currentLanguage={languageCode}
                companyLogo={
                  language === 'English'
                    ? 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725800605-204511942.png'
                    : 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725818779-222108661.png'
                }
                maxColumns={5}
                isDarkMode={isDarkMode}>
                <TouchableOpacity style={styles.exportButton}>
                  <Text style={styles.exportButtonText}>{t('Export')}</Text>
                  <Entypo name="export" size={RFPercentage(2)} color={'#FFF'} />
                </TouchableOpacity>
              </UnifiedExportComponent>
            }
          />

          {/* Attendance Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('Attendance Overview')}</Text>
            <BarChart
              data={complianceData.attendanceData}
              barWidth={35}
              spacing={25}
              height={180}
              width={screenWidth - wp(12)}
              yAxisThickness={0}
              xAxisThickness={0}
              noOfSections={4}
              maxValue={
                Math.max(
                  ...complianceData.attendanceData.map(item => item.value),
                ) + 5
              }
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              showFractionalValues
            />
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {complianceData.complianceData.days_attended || 0}
                </Text>
                <Text style={styles.statLabel}>{t('Days Attended')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {complianceData.complianceData.days_absent || 0}
                </Text>
                <Text style={styles.statLabel}>{t('Days Absent')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {Math.round(
                    (complianceData.complianceData.days_attended /
                      complianceData.complianceData.total_scheduled_days) *
                      100,
                  ) || 0}
                  %
                </Text>
                <Text style={styles.statLabel}>{t('Attendance Rate')}</Text>
              </View>
            </View>
          </View>

          {/* Hours Compliance Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('Hours Compliance')}</Text>
            <View style={styles.pieChartContainer}>
              <PieChart
                data={complianceData.hoursData}
                showText
                textColor={isDarkMode ? '#FFFFFF' : '#333333'}
                radius={80}
                textSize={RFPercentage(1.4)}
                focusOnPress
                showValuesAsLabels
                showTextBackground
                textBackgroundRadius={15}
                centerLabelComponent={() => (
                  <View style={styles.centerLabelContainer}>
                    <Text style={styles.centerLabelMain}>
                      {complianceData.complianceData.total_actual_hours || 0}h
                    </Text>
                    <Text style={styles.centerLabelSub}>{t('Actual')}</Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.hoursSummary}>
              <View style={styles.hourItem}>
                <View
                  style={[
                    styles.hourColor,
                    {backgroundColor: accentColors.blue},
                  ]}
                />
                <Text style={styles.hourText}>
                  {t('Scheduled:')}{' '}
                  {complianceData.complianceData.total_scheduled_hours || 0}h
                </Text>
              </View>
              <View style={styles.hourItem}>
                <View
                  style={[
                    styles.hourColor,
                    {backgroundColor: accentColors.green},
                  ]}
                />
                <Text style={styles.hourText}>
                  {t('Actual:')}{' '}
                  {complianceData.complianceData.total_actual_hours || 0}h
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: Performance Overview */}
        <View style={styles.section}>
          <ExportHeader
            title={t('Performance Overview')}
            exportComponent={
              <UnifiedExportComponent
                data={getWorkerPerformanceExportData()}
                columns={getWorkerPerformanceColumnConfig()}
                fileName={getWorkerPerformanceExportFileName()}
                title={t('Employee Performance Report')}
                onExportStart={() =>
                  console.log('Worker performance export started')
                }
                onExportSuccess={filePath =>
                  console.log('Worker performance export success:', filePath)
                }
                onExportError={error =>
                  console.log('Worker performance export error:', error)
                }
                showShareDialog={true}
                currentLanguage={languageCode}
                companyLogo={
                  language === 'English'
                    ? 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725800605-204511942.png'
                    : 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725818779-222108661.png'
                }
                maxColumns={5}
                isDarkMode={isDarkMode}>
                <TouchableOpacity style={styles.exportButton}>
                  <Text style={styles.exportButtonText}>{t('Export')}</Text>
                  <Entypo name="export" size={RFPercentage(2)} color={'#FFF'} />
                </TouchableOpacity>
              </UnifiedExportComponent>
            }
          />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('Performance Metrics')}</Text>
            <BarChart
              data={performanceData.performanceData}
              barWidth={40}
              spacing={30}
              height={200}
              width={screenWidth - wp(12)}
              yAxisThickness={0}
              xAxisThickness={0}
              noOfSections={4}
              maxValue={100}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              showFractionalValues
            />
          </View>

          {/* Performance Statistics Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('Performance Statistics')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridValue}>
                  {performanceData.performanceStats.tasks_assigned || 0}
                </Text>
                <Text style={styles.gridLabel}>{t('Tasks Assigned')}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridValue}>
                  {performanceData.performanceStats.tasks_completed || 0}
                </Text>
                <Text style={styles.gridLabel}>{t('Tasks Completed')}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridValue}>
                  {parseFloat(
                    performanceData.performanceStats.hours_worked || 0,
                  ).toFixed(1)}
                </Text>
                <Text style={styles.gridLabel}>{t('Hours Worked')}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.gridValue, {color: accentColors.blue}]}>
                  {performanceData.performanceStats.compliance_percentage || 0}%
                </Text>
                <Text style={styles.gridLabel}>{t('Compliance')}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.gridValue, {color: accentColors.green}]}>
                  {performanceData.performanceStats.productivity_percentage ||
                    0}
                  %
                </Text>
                <Text style={styles.gridLabel}>{t('Productivity')}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.gridValue, {color: accentColors.orange}]}>
                  {performanceData.performanceStats.efficiency_percentage || 0}%
                </Text>
                <Text style={styles.gridLabel}>{t('Efficiency')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <FilterBtmSheet
        ref={filterRef}
        refRBSheet={filterBottomSheetRef}
        onApplyFilters={handleFilters}
        enabledFilters={getFilterOptions().enabledFilters}
        fileTypes={getFilterOptions().fileTypes}
        statuses={getFilterOptions().statuses}
        labels={getFilterOptions().labels}
        initialFilters={activeFilters}
      />
    </View>
  );
};

const getStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    loadingText: {
      marginTop: hp(2),
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsRegular,
    },
    dateSection: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
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
      borderRadius: 12,
      marginHorizontal: wp(1),
      flex: 1,
      justifyContent: 'center',
    },
    dateButtonText: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      marginLeft: wp(2),
      fontFamily: Fonts.PoppinsMedium,
    },
    dateSeparator: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode ? '#888888' : '#666666',
      marginHorizontal: wp(2),
      fontFamily: Fonts.PoppinsMedium,
    },
    section: {
      marginBottom: hp(2),
    },
    exportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    },
    sectionTitle: {
      fontSize: RFPercentage(2),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
    },
    exportButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clearButton: {
      backgroundColor: isDarkMode ? '#444' : '#f0f0f0',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: wp(2),
      marginRight: wp(2),
    },
    clearButtonText: {
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontSize: RFPercentage(1.2),
      fontFamily: Fonts.PoppinsMedium,
    },
    filterBtn: {
      padding: wp(1.5),
      marginRight: wp(2),
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#006EC2',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: wp(2),
      gap: wp(2),
    },
    exportButtonText: {
      color: '#FFF',
      fontSize: RFPercentage(1.2),
      fontFamily: Fonts.PoppinsMedium,
    },
    card: {
      backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
      borderRadius: 0,
      padding: wp(4),
      marginVertical: hp(0.5),
    },
    cardTitle: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(2),
    },
    axisText: {
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontSize: RFPercentage(1.2),
      fontFamily: Fonts.PoppinsRegular,
    },
    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: hp(2),
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: wp(2),
    },
    legendColor: {
      width: wp(3),
      height: wp(3),
      borderRadius: wp(1.5),
      marginRight: wp(2),
    },
    legendText: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#CCCCCC' : '#666666',
      fontFamily: Fonts.PoppinsRegular,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: hp(2),
    },
    statBox: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: RFPercentage(2.2),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(0.5),
    },
    statLabel: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#CCCCCC' : '#666666',
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
    },
    pieChartContainer: {
      alignItems: 'center',
      marginVertical: hp(1),
    },
    centerLabelContainer: {
      alignItems: 'center',
    },
    centerLabelMain: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
    },
    centerLabelSub: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#CCCCCC' : '#666666',
      fontFamily: Fonts.PoppinsRegular,
    },
    hoursSummary: {
      marginTop: hp(2),
    },
    hourItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: hp(0.5),
    },
    hourColor: {
      width: wp(3),
      height: wp(3),
      borderRadius: wp(1.5),
      marginRight: wp(3),
    },
    hourText: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsRegular,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gridItem: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: hp(1.5),
      marginBottom: hp(1),
      backgroundColor: isDarkMode ? '#3A3A3A' : '#F8F8F8',
      borderRadius: 8,
    },
    gridValue: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(0.5),
    },
    gridLabel: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#CCCCCC' : '#666666',
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
    },
    bottomSpacer: {
      height: hp(2),
    },
    selectedDataBox: {
      backgroundColor: isDarkMode ? '#3A3A3A' : '#F8F8F8',
      borderRadius: 10,
      padding: wp(4),
      marginTop: hp(2),
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: {width: 0, height: 2},
      shadowRadius: 4,
      elevation: 2,
    },
    selectedDataTitle: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(1),
      textAlign: 'center',
    },
    selectedDataRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: hp(0.5),
    },
    selectedDataLabel: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#CCCCCC' : '#666666',
      fontFamily: Fonts.PoppinsRegular,
    },
    selectedDataValue: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
    },
  });

export default Reports;
