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
import {getTaskReport} from '../../../services/reportService';
import {Fonts} from '../../../Constants/Fonts';
import {Colors} from '../../../Constants/themeColors';

const TaskReportCard = ({dateRange}) => {
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

      console.log('📊 [TaskReport] Request:', {
        type: 'task',
        startDate: startDateStr,
        endDate: endDateStr,
        workerId,
        companyId,
      });

      const response = await getTaskReport(
        startDateStr,
        endDateStr,
        workerId,
        companyId,
      );

      console.log(
        '📊 [TaskReport] Full Response:',
        JSON.stringify(response, null, 2),
      );

      if (response.error === true) {
        setError(response.message || 'Failed to fetch data');
        setData(null);
      } else {
        const tasks = response.data?.data || [];
        const taskSummary = response.data?.task_summary || null;
        console.log('📊 [TaskReport] Tasks:', JSON.stringify(tasks, null, 2));
        console.log(
          '📊 [TaskReport] Summary:',
          JSON.stringify(taskSummary, null, 2),
        );
        setData({
          tasks: tasks,
          taskSummary: taskSummary,
          recordsCount: response.data?.records_count || tasks.length,
          generatedAt: response.data?.generated_at,
        });
      }
    } catch (err) {
      console.log('📊 [TaskReport] Error:', err);
      setError(err.message || 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Bar chart data - Task distribution by status
  const getStatusBarData = () => {
    if (!data?.taskSummary?.status_distribution && !data?.tasks?.length) {
      return [];
    }

    const statusCounts = {};

    if (data?.taskSummary?.status_distribution) {
      Object.assign(statusCounts, data.taskSummary.status_distribution);
    } else {
      // Calculate from tasks
      data.tasks.forEach(task => {
        const status = task.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    const colors = {
      completed: '#50E3C2',
      pending: '#F5A623',
      in_progress: '#4A90E2',
      overdue: '#D0021B',
      cancelled: '#999',
      unknown: '#CCC',
    };

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        value: count,
        label: status.replace(/_/g, ' ').substring(0, 8),
        frontColor: colors[status] || '#999',
        labelTextStyle: styles.chartLabel,
      }));
  };

  // Pie chart data - Task status analysis
  const getStatusPieData = () => {
    const barData = getStatusBarData();
    return barData.map(item => ({
      value: item.value,
      color: item.frontColor,
      text: item.value.toString(),
      label: item.label,
    }));
  };

  // Pie chart data - Priority distribution
  const getPriorityPieData = () => {
    if (!data?.taskSummary?.priority_distribution && !data?.tasks?.length) {
      return [];
    }

    const priorityCounts = {};

    if (data?.taskSummary?.priority_distribution) {
      Object.assign(priorityCounts, data.taskSummary.priority_distribution);
    } else {
      data.tasks.forEach(task => {
        const priority = task.priority || 'medium';
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      });
    }

    const colors = {
      high: '#D0021B',
      medium: '#F5A623',
      low: '#50E3C2',
      urgent: '#9013FE',
      normal: '#4A90E2',
      unknown: '#CCC',
    };

    return Object.entries(priorityCounts)
      .filter(([_, count]) => count > 0)
      .map(([priority, count]) => ({
        value: count,
        color: colors[priority] || '#999',
        text: count.toString(),
        label: priority.toUpperCase(),
      }));
  };

  // Summary metrics
  const getSummary = () => {
    const totalTasks = data?.recordsCount || data?.tasks?.length || 0;

    if (data?.taskSummary) {
      return {
        totalTasks,
        completed:
          data.taskSummary.total_tasks - (data.taskSummary.overdue_tasks || 0),
        completionRate: data.taskSummary.completion_rate || 0,
        overdue: data.taskSummary.overdue_tasks || 0,
      };
    }

    // Calculate from tasks
    let completed = 0;
    let overdue = 0;

    data?.tasks?.forEach(task => {
      if (task.status === 'completed') completed++;
      if (task.status === 'overdue') overdue++;
    });

    return {
      totalTasks,
      completed,
      completionRate:
        totalTasks > 0 ? ((completed / totalTasks) * 100).toFixed(0) : 0,
      overdue,
    };
  };

  const statusBarData = getStatusBarData();
  const statusPieData = getStatusPieData();
  const priorityPieData = getPriorityPieData();
  const summary = getSummary();
  const hasData = data?.tasks?.length > 0;

  // Get priority color
  const getPriorityColor = priority => {
    const colors = {
      high: '#D0021B',
      medium: '#F5A623',
      low: '#50E3C2',
      urgent: '#9013FE',
      normal: '#4A90E2',
    };
    return colors[priority?.toLowerCase()] || '#999';
  };

  // Get status color
  const getStatusColor = status => {
    const colors = {
      completed: '#50E3C2',
      pending: '#F5A623',
      in_progress: '#4A90E2',
      overdue: '#D0021B',
      cancelled: '#999',
    };
    return colors[status?.toLowerCase()] || '#999';
  };

  // Format deadline
  const formatDeadline = deadline => {
    if (!deadline) return '-';
    return moment(deadline).format('MMM DD');
  };

  // Render task item
  const renderTaskItem = ({item}) => (
    <View style={styles.taskRow}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.title || 'Untitled'}
        </Text>
        <Text style={styles.taskAssigned}>
          {item.assigned_by || 'Unassigned'}
        </Text>
      </View>
      <View
        style={[
          styles.priorityBadge,
          {backgroundColor: getPriorityColor(item.priority)},
        ]}>
        <Text style={styles.badgeText}>
          {item.priority?.toUpperCase() || '-'}
        </Text>
      </View>
      <Text style={styles.taskDeadline}>{formatDeadline(item.deadline)}</Text>
      <View
        style={[
          styles.statusBadge,
          {backgroundColor: getStatusColor(item.status)},
        ]}>
        <Text style={styles.badgeText}>
          {(item.status || 'unknown').replace(/_/g, ' ').toUpperCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {t('Employee Task Compliance Report')}
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
            name="assignment"
            size={RFPercentage(8)}
            color="#CCC"
          />
          <Text style={styles.emptyText}>{t('No Task Data Available')}</Text>
          <Text style={styles.emptySubtext}>
            {t('No tasks for selected period')}
          </Text>
        </View>
      ) : (
        <>
          {/* Bar Chart - Status distribution */}
          {statusBarData.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                {t('Task Distribution by Status')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={statusBarData}
                  barWidth={wp(10)}
                  spacing={wp(5)}
                  height={hp(16)}
                  width={Math.max(screenWidth, statusBarData.length * wp(16))}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor={isDarkMode ? '#444' : '#DDD'}
                  noOfSections={4}
                  maxValue={Math.max(
                    ...statusBarData.map(item => item.value),
                    5,
                  )}
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  showFractionalValues={false}
                  hideRules
                />
              </ScrollView>
            </View>
          )}

          {/* Pie Charts Row */}
          <View style={styles.pieRow}>
            {/* Status Pie */}
            {statusPieData.length > 0 && (
              <View style={styles.pieSection}>
                <Text style={styles.chartTitle}>
                  {t('Task Status Analysis')}
                </Text>
                <PieChart
                  data={statusPieData}
                  showText
                  textColor="#FFF"
                  radius={45}
                  textSize={RFPercentage(1.2)}
                  focusOnPress
                  showValuesAsLabels
                  showTextBackground
                  textBackgroundRadius={10}
                />
              </View>
            )}

            {/* Priority Pie */}
            {priorityPieData.length > 0 && (
              <View style={styles.pieSection}>
                <Text style={styles.chartTitle}>
                  {t('Priority Distribution')}
                </Text>
                <PieChart
                  data={priorityPieData}
                  showText
                  textColor="#FFF"
                  radius={45}
                  textSize={RFPercentage(1.2)}
                  focusOnPress
                  showValuesAsLabels
                  showTextBackground
                  textBackgroundRadius={10}
                />
              </View>
            )}
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {t('Task Completion Metrics')}
            </Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryGridItem}>
                <Text style={styles.summaryGridValue}>
                  {summary.totalTasks}
                </Text>
                <Text style={styles.summaryGridLabel}>{t('Total Tasks')}</Text>
              </View>
              <View style={styles.summaryGridItem}>
                <Text style={[styles.summaryGridValue, {color: '#50E3C2'}]}>
                  {summary.completed}
                </Text>
                <Text style={styles.summaryGridLabel}>{t('Completed')}</Text>
              </View>
              <View style={styles.summaryGridItem}>
                <Text style={[styles.summaryGridValue, {color: '#4A90E2'}]}>
                  {summary.completionRate}%
                </Text>
                <Text style={styles.summaryGridLabel}>
                  {t('Completion Rate')}
                </Text>
              </View>
              {summary.overdue > 0 && (
                <View style={styles.summaryGridItem}>
                  <Text style={[styles.summaryGridValue, {color: '#D0021B'}]}>
                    {summary.overdue}
                  </Text>
                  <Text style={styles.summaryGridLabel}>{t('Overdue')}</Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {/* Detail Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Task Details')}</Text>
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
                <Text style={styles.summaryValue}>{summary.totalTasks}</Text>
                <Text style={styles.summaryLabel}>{t('Total Tasks')}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, {color: '#50E3C2'}]}>
                  {summary.completed}
                </Text>
                <Text style={styles.summaryLabel}>{t('Completed')}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, {color: '#4A90E2'}]}>
                  {summary.completionRate}%
                </Text>
                <Text style={styles.summaryLabel}>{t('Rate')}</Text>
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.taskCol]}>
                {t('Task')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.priorityCol]}>
                {t('Priority')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.deadlineCol]}>
                {t('Deadline')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.statusCol]}>
                {t('Status')}
              </Text>
            </View>

            <FlatList
              data={data?.tasks || []}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={renderTaskItem}
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
      height: hp(35),
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
      height: hp(35),
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
      height: hp(35),
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
    pieRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: hp(1),
    },
    pieSection: {
      alignItems: 'center',
      flex: 1,
    },
    summaryCard: {
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8',
      borderRadius: wp(3),
      padding: wp(3),
      marginTop: hp(2),
    },
    summaryTitle: {
      fontSize: RFPercentage(1.5),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode ? '#FFFFFF' : '#333333',
      marginBottom: hp(1),
      textAlign: 'center',
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    summaryGridItem: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: hp(1),
      marginBottom: hp(0.5),
    },
    summaryGridValue: {
      fontSize: RFPercentage(2.2),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsSemiBold,
    },
    summaryGridLabel: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#888' : '#666',
      fontFamily: Fonts.PoppinsRegular,
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
    summaryItem: {
      alignItems: 'center',
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
      fontSize: RFPercentage(1.1),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode ? '#888' : '#666',
      textAlign: 'center',
    },
    taskCol: {
      flex: 2,
      textAlign: 'left',
    },
    priorityCol: {
      flex: 1,
    },
    deadlineCol: {
      flex: 1,
    },
    statusCol: {
      flex: 1,
    },
    taskRow: {
      flexDirection: 'row',
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#EEE',
      alignItems: 'center',
    },
    taskInfo: {
      flex: 2,
      paddingRight: wp(1),
    },
    taskTitle: {
      fontSize: RFPercentage(1.3),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsMedium,
    },
    taskAssigned: {
      fontSize: RFPercentage(1.1),
      color: isDarkMode ? '#888' : '#666',
      fontFamily: Fonts.PoppinsRegular,
    },
    priorityBadge: {
      flex: 1,
      paddingHorizontal: wp(1),
      paddingVertical: hp(0.3),
      borderRadius: wp(1),
      alignItems: 'center',
      marginHorizontal: wp(0.5),
    },
    statusBadge: {
      flex: 1,
      paddingHorizontal: wp(1),
      paddingVertical: hp(0.3),
      borderRadius: wp(1),
      alignItems: 'center',
      marginHorizontal: wp(0.5),
    },
    badgeText: {
      fontSize: RFPercentage(0.8),
      color: '#FFF',
      fontFamily: Fonts.PoppinsMedium,
    },
    taskDeadline: {
      flex: 1,
      fontSize: RFPercentage(1.2),
      color: isDarkMode ? '#FFFFFF' : '#333333',
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
    },
  });

export default TaskReportCard;
