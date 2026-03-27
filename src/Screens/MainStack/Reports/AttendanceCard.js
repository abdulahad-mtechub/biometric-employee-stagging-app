import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import {useSelector} from 'react-redux';
import {BarChart, PieChart} from 'react-native-gifted-charts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';
import moment from 'moment';
import {getAttendanceReport} from '../../../services/reportService';
import {Fonts} from '../../../Constants/Fonts';
import {Colors} from '../../../Constants/themeColors';

const AttendanceCard = ({dateRange}) => {
  const {t} = useTranslation();
  const {isDarkMode} = useSelector(store => store.theme);
  const {user} = useSelector(store => store.auth);
  const styles = getStyles(isDarkMode);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const screenWidth = Dimensions.get('window').width - wp(10);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;

    setLoading(true);
    setError(null);

    try {
      const startDateStr = moment(dateRange.startDate).format('YYYY-MM-DD');
      const endDateStr = moment(dateRange.endDate).format('YYYY-MM-DD');
      const workerId = user?.id;
      const companyId = user?.company_id;

      console.log('📊 [Attendance] Request:', {
        type: 'attendance',
        startDate: startDateStr,
        endDate: endDateStr,
        workerId,
        companyId,
      });

      const response = await getAttendanceReport(
        startDateStr,
        endDateStr,
        workerId,
        companyId,
      );

      console.log(
        '📊 [Attendance] Full Response:',
        JSON.stringify(response, null, 2),
      );

      if (response.error === true) {
        setError(response.message || 'Failed to fetch data');
        setData(null);
      } else {
        const records = response.data?.data || [];
        console.log(
          '📊 [Attendance] Records:',
          JSON.stringify(records, null, 2),
        );
        setData({
          records: records,
          recordsCount: response.data?.records_count || records.length,
          generatedAt: response.data?.generated_at,
        });
      }
    } catch (err) {
      console.log('📊 [Attendance] Error:', err);
      setError(err.message || 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Bar chart data - Hours worked per day
  const getBarChartData = () => {
    if (!data?.records?.length) return [];

    return data.records.slice(0, 15).map(record => ({
      value: parseFloat(record.total_hours) || 0,
      label: moment(record.date).format('DD'),
      labelTextStyle: styles.chartLabel,
      frontColor: '#4A90E2',
    }));
  };

  // Pie chart data - Validation status distribution
  const getPieChartData = () => {
    if (!data?.records?.length) return [];

    const statusCounts = {};
    data.records.forEach(record => {
      const status = record.validation_status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const colors = {
      validated: '#50E3C2', // Green
      pending_review: '#F5A623', // Orange
      pending: '#F5A623', // Orange
      invalid: '#D0021B', // Red
    };

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        value: count,
        color: colors[status] || '#999',
        text: count.toString(),
        label: status.replace(/_/g, ' ').toUpperCase(),
      }));
  };

  const barChartData = getBarChartData();
  const pieChartData = getPieChartData();
  const hasData = data?.records?.length > 0;

  // Calculate totals
  const getTotals = () => {
    if (!data?.records?.length) return {totalDays: 0, totalHours: 0};

    const totalDays = data.records.length;
    const totalHours = data.records.reduce(
      (sum, record) => sum + (parseFloat(record.total_hours) || 0),
      0,
    );

    return {totalDays, totalHours: totalHours.toFixed(1)};
  };

  const totals = getTotals();

  // Format time
  const formatTime = time => {
    if (!time) return '-';
    return moment(time).format('HH:mm');
  };

  // Get status color
  const getStatusColor = status => {
    const colors = {
      validated: '#50E3C2',
      pending_review: '#F5A623',
      pending: '#F5A623',
      invalid: '#D0021B',
    };
    return colors[status] || '#999';
  };

  // Render attendance record
  const renderAttendanceItem = ({item}) => (
    <View style={styles.attendanceRow}>
      <Text style={styles.attendanceCell}>
        {moment(item.date).format('MMM DD')}
      </Text>
      <Text style={styles.attendanceCell}>{formatTime(item.check_in)}</Text>
      <Text style={styles.attendanceCell}>{formatTime(item.check_out)}</Text>
      <Text style={styles.attendanceCell}>{item.total_hours || 0}h</Text>
      <View
        style={[
          styles.statusBadge,
          {backgroundColor: getStatusColor(item.validation_status)},
        ]}>
        <Text style={styles.statusText}>
          {(item.validation_status || 'unknown')
            .replace(/_/g, ' ')
            .toUpperCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {t('Hourly Compliance Report & Employee Log')}
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowModal(true)}>
          <MaterialIcons name="list" size={RFPercentage(2.5)} color="#666" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>{t('Loading...')}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={RFPercentage(4)}
            color="#D0021B"
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>{t('Retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : !hasData ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="event-note"
            size={RFPercentage(8)}
            color="#CCC"
          />
          <Text style={styles.emptyText}>
            {t('No Attendance Data Available')}
          </Text>
          <Text style={styles.emptySubtext}>
            {t('No attendance records for selected period')}
          </Text>
        </View>
      ) : (
        <>
          {/* Bar Chart - Hours per day */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>{t('Daily Attendance Hours')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={barChartData}
                barWidth={wp(8)}
                spacing={wp(4)}
                height={hp(18)}
                width={Math.max(screenWidth, barChartData.length * wp(14))}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={isDarkMode ? '#444' : '#DDD'}
                noOfSections={4}
                maxValue={Math.max(...barChartData.map(item => item.value), 10)}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                showFractionalValues={false}
                hideRules
              />
            </ScrollView>
          </View>

          {/* Pie Chart - Status distribution */}
          {pieChartData.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                {t('Attendance Validation Status')}
              </Text>
              <View style={styles.pieContainer}>
                <PieChart
                  data={pieChartData}
                  showText
                  textColor="#FFF"
                  radius={60}
                  textSize={RFPercentage(1.4)}
                  focusOnPress
                  showValuesAsLabels
                  showTextBackground
                  textBackgroundRadius={12}
                />
              </View>
              <View style={styles.pieLegend}>
                {pieChartData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, {backgroundColor: item.color}]}
                    />
                    <Text style={styles.legendText}>{item.label}</Text>
                    <Text style={styles.legendValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totals.totalDays}</Text>
              <Text style={styles.summaryLabel}>{t('Total Days')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totals.totalHours}h</Text>
              <Text style={styles.summaryLabel}>{t('Total Hours')}</Text>
            </View>
          </View>
        </>
      )}

      {/* Detail Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Attendance Details')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons
                  name="close"
                  size={RFPercentage(3)}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.modalSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totals.totalDays}</Text>
                <Text style={styles.summaryLabel}>{t('Total Days')}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totals.totalHours}h</Text>
                <Text style={styles.summaryLabel}>{t('Total Hours')}</Text>
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>
                {t('Date')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>
                {t('Check In')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>
                {t('Check Out')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>
                {t('Hours')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>
                {t('Status')}
              </Text>
            </View>

            <FlatList
              data={data?.records || []}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={renderAttendanceItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = isDarkMode =>
  StyleSheet.create({
    card: {
      backgroundColor: isDarkMode ? Colors.darkTheme.cardBackground : '#FFFFFF',
      borderRadius: wp(4),
      padding: wp(4),
      marginVertical: hp(1),
      marginHorizontal: wp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    cardTitle: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode ? '#FFFFFF' : '#333333',
      flex: 1,
    },
    infoButton: {
      padding: wp(2),
    },
    loadingContainer: {
      height: hp(30),
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: hp(1),
      fontSize: RFPercentage(1.5),
      color: isDarkMode ? '#888' : '#666',
      fontFamily: Fonts.PoppinsRegular,
    },
    errorContainer: {
      height: hp(30),
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(4),
    },
    errorText: {
      marginTop: hp(1),
      fontSize: RFPercentage(1.5),
      color: '#D0021B',
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: hp(2),
      backgroundColor: '#4A90E2',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: wp(2),
    },
    retryButtonText: {
      color: '#FFF',
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.5),
    },
    emptyContainer: {
      height: hp(30),
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(4),
    },
    emptyText: {
      marginTop: hp(2),
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? '#888' : '#666',
      fontFamily: Fonts.PoppinsSemiBold,
    },
    emptySubtext: {
      marginTop: hp(0.5),
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#666' : '#999',
      fontFamily: Fonts.PoppinsRegular,
    },
    chartSection: {
      marginVertical: hp(1),
    },
    chartTitle: {
      fontSize: RFPercentage(1.5),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode ? '#888' : '#666',
      marginBottom: hp(1),
    },
    axisText: {
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontSize: RFPercentage(1),
      fontFamily: Fonts.PoppinsRegular,
    },
    chartLabel: {
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontSize: RFPercentage(0.8),
      fontFamily: Fonts.PoppinsRegular,
    },
    pieContainer: {
      alignItems: 'center',
      marginVertical: hp(1),
    },
    pieLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: hp(1),
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: wp(2),
      marginVertical: hp(0.5),
    },
    legendDot: {
      width: wp(2.5),
      height: wp(2.5),
      borderRadius: wp(1.25),
      marginRight: wp(1),
    },
    legendText: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#888' : '#666',
      fontFamily: Fonts.PoppinsRegular,
    },
    legendValue: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
      marginLeft: wp(1),
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: hp(2),
      paddingTop: hp(2),
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#333' : '#EEE',
    },
    summaryItem: {
      alignItems: 'center',
      flex: 1,
    },
    summaryDivider: {
      width: 1,
      backgroundColor: isDarkMode ? '#333' : '#EEE',
    },
    summaryLabel: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#888' : '#666',
      fontFamily: Fonts.PoppinsRegular,
      marginTop: hp(0.5),
    },
    summaryValue: {
      fontSize: RFPercentage(2.2),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDarkMode ? Colors.darkTheme.cardBackground : '#FFFFFF',
      borderTopLeftRadius: wp(5),
      borderTopRightRadius: wp(5),
      maxHeight: '80%',
      paddingBottom: hp(3),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: wp(4),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#EEE',
    },
    modalTitle: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode ? '#FFFFFF' : '#333333',
    },
    modalSummary: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: wp(4),
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(2),
      backgroundColor: isDarkMode ? '#333' : '#F0F0F0',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#DDD',
    },
    tableHeaderCell: {
      fontSize: RFPercentage(1.2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode ? '#888' : '#666',
      textAlign: 'center',
    },
    flex1: {
      flex: 1,
    },
    attendanceRow: {
      flexDirection: 'row',
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#EEE',
      alignItems: 'center',
    },
    attendanceCell: {
      flex: 1,
      fontSize: RFPercentage(1.3),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
    },
    statusBadge: {
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.5),
      borderRadius: wp(1),
    },
    statusText: {
      fontSize: RFPercentage(1),
      color: '#FFF',
      fontFamily: Fonts.PoppinsMedium,
    },
  });

export default AttendanceCard;
