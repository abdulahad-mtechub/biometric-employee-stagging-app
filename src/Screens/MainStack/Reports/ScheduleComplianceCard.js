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
} from 'react-native';
import {useSelector} from 'react-redux';
import {BarChart} from 'react-native-gifted-charts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';
import moment from 'moment';
import {getScheduleComplianceReport} from '../../../services/reportService';
import {Fonts} from '../../../Constants/Fonts';
import {Colors} from '../../../Constants/themeColors';

const ScheduleComplianceCard = ({dateRange}) => {
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

      console.log('📊 [ScheduleCompliance] Request:', {
        type: 'schedule_compliance',
        startDate: startDateStr,
        endDate: endDateStr,
        workerId,
        companyId,
      });

      const response = await getScheduleComplianceReport(
        startDateStr,
        endDateStr,
        workerId,
        companyId,
      );

      console.log(
        '📊 [ScheduleCompliance] Full Response:',
        JSON.stringify(response, null, 2),
      );

      if (response.error === true) {
        setError(response.message || 'Failed to fetch data');
        setData(null);
      } else {
        const rawData = response.data?.data;
        console.log(
          '📊 [ScheduleCompliance] Raw Data:',
          JSON.stringify(rawData, null, 2),
        );
        setData(rawData?.[0] || rawData || null);
        console.log(
          '📊 [ScheduleCompliance] Set Data:',
          rawData?.[0] || rawData || null,
        );
      }
    } catch (err) {
      console.log('📊 [ScheduleCompliance] Error:', err);
      setError(err.message || 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart data
  const getChartData = () => {
    if (!data) return [];

    const totalDays = parseInt(data.total_scheduled_days) || 0;
    const daysAttended = parseInt(data.days_attended) || 0;
    const daysAbsent = parseInt(data.days_absent) || 0;

    return [
      {
        value: totalDays,
        label: t('Total'),
        frontColor: '#4A90E2', // Blue
        labelTextStyle: styles.chartLabel,
      },
      {
        value: daysAttended,
        label: t('Attended'),
        frontColor: '#50E3C2', // Green
        labelTextStyle: styles.chartLabel,
      },
      {
        value: daysAbsent,
        label: t('Absent'),
        frontColor: '#D0021B', // Red
        labelTextStyle: styles.chartLabel,
      },
    ];
  };

  const chartData = getChartData();
  const hasData = data && data.total_scheduled_days > 0;

  // Format summary data for modal
  const getSummaryData = () => {
    if (!data) return [];

    return Object.entries(data).map(([key, value]) => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value?.toString() || '0',
    }));
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {t('Employee Schedule Compliance')}
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowModal(true)}>
          <MaterialIcons
            name="info-outline"
            size={RFPercentage(2.5)}
            color="#666"
          />
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
            name="event-busy"
            size={RFPercentage(8)}
            color="#CCC"
          />
          <Text style={styles.emptyText}>
            {t('No Schedule Data Available')}
          </Text>
          <Text style={styles.emptySubtext}>
            {t('No scheduled days for selected period')}
          </Text>
        </View>
      ) : (
        <>
          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            <BarChart
              data={chartData}
              barWidth={wp(12)}
              spacing={wp(8)}
              height={hp(20)}
              width={screenWidth - wp(8)}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={isDarkMode ? '#444' : '#DDD'}
              noOfSections={4}
              maxValue={Math.max(...chartData.map(item => item.value), 10)}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              showFractionalValues={false}
              hideRules
            />
          </View>

          {/* Summary Row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, {backgroundColor: '#4A90E2'}]} />
              <Text style={styles.summaryLabel}>{t('Total Days')}</Text>
              <Text style={styles.summaryValue}>
                {data.total_scheduled_days || 0}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, {backgroundColor: '#50E3C2'}]} />
              <Text style={styles.summaryLabel}>{t('Attended')}</Text>
              <Text style={styles.summaryValue}>{data.days_attended || 0}</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, {backgroundColor: '#D0021B'}]} />
              <Text style={styles.summaryLabel}>{t('Absent')}</Text>
              <Text style={styles.summaryValue}>{data.days_absent || 0}</Text>
            </View>
          </View>
        </>
      )}

      {/* Detail Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Schedule Details')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons
                  name="close"
                  size={RFPercentage(3)}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.summaryTable}>
                {getSummaryData().map((item, index) => (
                  <View key={index} style={styles.summaryRowItem}>
                    <Text style={styles.summaryRowLabel}>{item.label}</Text>
                    <Text style={styles.summaryRowValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
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
      height: hp(25),
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
      height: hp(25),
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
      height: hp(25),
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
    chartContainer: {
      alignItems: 'center',
      marginVertical: hp(1),
    },
    axisText: {
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontSize: RFPercentage(1.2),
      fontFamily: Fonts.PoppinsRegular,
    },
    chartLabel: {
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontSize: RFPercentage(1),
      fontFamily: Fonts.PoppinsRegular,
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
    summaryDot: {
      width: wp(3),
      height: wp(3),
      borderRadius: wp(1.5),
      marginBottom: hp(0.5),
    },
    summaryLabel: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#888' : '#666',
      fontFamily: Fonts.PoppinsRegular,
    },
    summaryValue: {
      fontSize: RFPercentage(2),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
      marginTop: hp(0.5),
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
      maxHeight: '70%',
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
    modalScroll: {
      padding: wp(4),
    },
    summaryTable: {
      flex: 1,
    },
    summaryRowItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: hp(1.5),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#EEE',
    },
    summaryRowLabel: {
      fontSize: RFPercentage(1.5),
      color: isDarkMode ? '#888' : '#666',
      fontFamily: Fonts.PoppinsRegular,
      flex: 1,
    },
    summaryRowValue: {
      fontSize: RFPercentage(1.5),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsMedium,
    },
  });

export default ScheduleComplianceCard;
