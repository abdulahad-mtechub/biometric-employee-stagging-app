import React, {useEffect, useState, useRef, useCallback} from 'react';
import {ScrollView, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Feather';
import {getRequest} from '../../../Constants/api';
import {Colors} from '../../../Constants/themeColors';
import {Fonts} from '../../../Constants/Fonts';
import {statusStyles} from '../../../Constants/DummyData';
import {Svgs} from '../../../assets/Svgs/Svgs';
import FilterBtmSheet, {
  FilterConfig,
} from '../../../components/BottomSheets/FilterBtmSheet';

const TaskAttendanceHistory = () => {
  const {t} = useTranslation();
  const token = useSelector(state => state?.auth?.user?.token);
  const {isDarkMode} = useSelector(store => store.theme);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const filterRef = useRef(null);
  const filterBottomSheetRef = useRef(null);

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }

      const endpoint = `task-management/worker/tasks/attendance-history${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await getRequest(endpoint, token);

      console.log(
        '🚀 ~ Task Attendance History API Response:',
        JSON.stringify(response, null, 3),
      );

      if (response?.data?.tasks) {
        setAttendanceData(response.data.tasks);
      }
    } catch (err) {
      console.error('Error fetching task attendance history:', err);
      setError(err?.message || 'Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilters = useCallback(async filters => {
    console.log('🔍 Applied Filters for Task Attendance History:', filters);
    setFiltersApplied(true);
    setActiveFilters(filters);

    // Convert filter keys to match API expected parameters
    const apiFilters = {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      status: filters.status,
    };

    console.log('🌐 Converting to API filters:', apiFilters);

    await fetchAttendanceHistory(apiFilters);
  }, []);

  const clearFilters = useCallback(async () => {
    console.log('🧹 Clearing all filters');
    setFiltersApplied(false);
    setActiveFilters({});

    if (filterRef.current) {
      filterRef.current.resetFilters();
    }

    await fetchAttendanceHistory({});
  }, []);

  const getStatusOptions = () => {
    return [
      {label: t('Assigned'), value: 'assigned'},
      {label: t('Accepted'), value: 'accepted'},
      {label: t('Completed'), value: 'completed'},
      {label: t('Declined'), value: 'declined'},
      {label: t('In Progress'), value: 'in_progress'},
      {label: t('Not Done'), value: 'not_done'},
    ];
  };

  const getFilterOptions = () => {
    return {
      enabledFilters: [FilterConfig.DATE_RANGE, FilterConfig.STATUS],
      fileTypes: null,
      statuses: getStatusOptions(),
      priorities: null,
      labels: {
        status: t('Status'),
        dateRange: t('Date Range'),
        clearAll: t('Clear All'),
        apply: t('Apply'),
      },
    };
  };

  const getStatusBadge = status => {
    if (!status) return null;

    const statusMap = {
      in_progress: 'Ongoing',
      assigned: 'Invited',
      completed: 'Present',
      not_started: 'Invited',
      late: 'Late Arrival',
      not_ended: 'Active',
    };

    const mappedStatus = statusMap[status] || status;
    const style = statusStyles[mappedStatus] || statusStyles['Invited'];

    return (
      <View
        style={[styles.statusBadge, {backgroundColor: style.backgroundColor}]}>
        {style.icon && (
          <View style={styles.badgeIcon}>
            {React.cloneElement(style.icon, {height: hp(1.5)})}
          </View>
        )}
        <Text style={[styles.statusText, {color: style.color}]}>
          {t(mappedStatus)}
        </Text>
      </View>
    );
  };

  const formatDate = dateStr => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return dateStr;
    }
  };

  const formatDateTime = dateStr => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateStr;
    }
  };

  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Filter Header */}
      <View style={styles.filterHeader}>
        <View style={styles.filterHeaderLeft}>
          <Text style={styles.screenTitle}>{t('Task Attendance History')}</Text>
          {filtersApplied && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>{t('Filtered')}</Text>
            </View>
          )}
        </View>
        <View style={styles.filterHeaderRight}>
          {filtersApplied && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>{t('Clear')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => filterBottomSheetRef.current?.open()}>
            <Svgs.filter />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>{t('Loading...')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : attendanceData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {t('No attendance history found')}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{flexGrow: 1}}>
          <View style={styles.contentContainer}>
            {attendanceData.map((item, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {item.title || `Task #${item.task_id}`}
                  </Text>
                  <Text style={styles.cardDate}>
                    {formatDate(item.task_date)}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('Task ID')}</Text>
                    <Text style={styles.infoValue}>{item.task_id}</Text>
                  </View>

                  {/* <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('Priority')}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor:
                            item.priority === 'high' ? '#FF6B6B' : '#60A5FA',
                        },
                      ]}>
                      <Text style={styles.priorityText}>
                        {item.priority || 'N/A'}
                      </Text>
                    </View>
                  </View> */}

                  {/* <View style={styles.statusRow}>
                    <Text style={styles.infoLabel}>{t('Task Status')}</Text>
                   {item.name}
                  </View> */}
                  {/* <View style={styles.statusRow}>
                    <Text style={styles.infoLabel}>{t('Task Status')}</Text>
                    {getStatusBadge(item.task_status)}
                  </View> */}

                  {/* <View style={styles.statusRow}>
                    <Text style={styles.infoLabel}>
                      {t('Assignment Status')}
                    </Text>
                    {getStatusBadge(item.assignment_status)}
                  </View> */}

                  {/* {item.actual && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('Actual')}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('Started')}</Text>
                        <Text style={styles.infoValue}>
                          {formatDateTime(item.actual.started_at)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('Ended')}</Text>
                        <Text style={styles.infoValue}>
                          {formatDateTime(item.actual.ended_at)}
                        </Text>
                      </View>
                    </>
                  )} */}

                  {item.attendance && (
                    <>
                      <View style={styles.statusRow}>
                        <Text style={styles.infoLabel}>
                          {t('Start Status')}
                        </Text>
                        {getStatusBadge(item.attendance.start_status)}
                      </View>
                      <View style={styles.statusRow}>
                        <Text style={styles.infoLabel}>{t('End Status')}</Text>
                        {getStatusBadge(item.attendance.end_status)}
                      </View>
                    </>
                  )}
                  {item.scheduled && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                          {t('Scheduled')}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('Start Date')}</Text>
                        <Text style={styles.infoValue}>
                          {formatDateTime(item.scheduled.start_at)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('End Date')}</Text>
                        <Text style={styles.infoValue}>
                          {formatDateTime(item.scheduled.end_at)}
                        </Text>
                      </View>
                    </>
                  )}
                  {item.location?.address && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{t('Location')}</Text>
                      <Text style={styles.infoValue} numberOfLines={2}>
                        {item.location.address}
                      </Text>
                    </View>
                  )}

                  {item.assigned_by && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{t('Assigned By')}</Text>
                      <Text style={styles.infoValue}>{item.assigned_by}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <FilterBtmSheet
        ref={filterRef}
        refRBSheet={filterBottomSheetRef}
        onApplyFilters={handleFilters}
        enabledFilters={getFilterOptions().enabledFilters}
        statuses={getFilterOptions().statuses}
        labels={getFilterOptions().labels}
        initialFilters={activeFilters}
      />
    </View>
  );
};

export default TaskAttendanceHistory;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    filterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    filterHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    screenTitle: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginRight: wp(2),
    },
    activeFilterBadge: {
      backgroundColor: isDarkMode ? '#444' : '#e6f0fa',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: wp(1),
    },
    activeFilterText: {
      fontSize: RFPercentage(1),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode ? '#fff' : '#006EC2',
    },
    filterHeaderRight: {
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
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.2),
      fontFamily: Fonts.PoppinsMedium,
    },
    filterBtn: {
      padding: wp(1.5),
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(5),
    },
    loadingText: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    errorText: {
      fontSize: RFPercentage(1.8),
      color: '#FF6B6B',
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
    },
    contentContainer: {
      padding: wp(4),
    },
    card: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(4),
      padding: wp(4),
      marginBottom: hp(2),
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
      paddingBottom: hp(1.5),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    cardTitle: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
    },
    cardDate: {
      fontSize: RFPercentage(1.3),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    cardBody: {
      gap: hp(1.5),
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    infoLabel: {
      fontSize: RFPercentage(1.4),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    infoValue: {
      fontSize: RFPercentage(1.4),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1.5,
      textAlign: 'right',
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: hp(0.5),
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.5),
      borderRadius: wp(1),
      gap: wp(1),
    },
    badgeIcon: {
      marginRight: wp(0.5),
    },
    statusText: {
      fontSize: RFPercentage(1.2),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    priorityBadge: {
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.5),
      borderRadius: wp(2),
    },
    priorityText: {
      fontSize: RFPercentage(1.2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: '#fff',
      textTransform: 'capitalize',
    },
  });
