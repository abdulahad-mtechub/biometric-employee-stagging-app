import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useState, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {
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
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import FilterBtmSheet, {
  FilterConfig,
} from '../../components/BottomSheets/FilterBtmSheet';
import AbsenceCalendar from '../../components/Calender/AbsenceCalendar';
import UnifiedExportComponent from '../../components/ExportComponent/UnifiedExportComponent';
import StackHeader from '../../components/Header/StackHeader';
import TabSelector from '../../components/TabSelector/TabSelector';
import UniversalCardTable from '../../components/UniversalCardTable/UniversalCardTable';
import {getAbsences} from '../../Constants/api';
import {useButtonColors} from '../../Constants/colorHelper';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';

const ITEMS_PER_PAGE = 5;

const Absence = ({navigation, route}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(t('Absence List'));
  const token = useSelector(state => state?.auth?.user?.token);
  const [absencesData, setAbsencesData] = useState([]);
  const filterRef = useRef(null);
  const filterBottomSheetRef = useRef(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchData = useCallback(
    async (filters = {}, page = 1, append = false) => {
      if (!append) {
        setLoading(true);
        setCurrentPage(1);
        setHasMoreData(true);
      } else {
        setIsLoadingMore(true);
      }
      try {
        const paginationFilters = {
          ...filters,
          page,
          page_size: ITEMS_PER_PAGE,
        };
        const response = await getAbsences(token, paginationFilters);
        console.log(
          '🏥 Absence Response - Page:',
          page,
          JSON.stringify(response, null, 2),
        );
        if (response?.error === false && response?.data?.absences) {
          const transformedData = response.data.absences.map(item => {
            const startDate = new Date(item.dateRange.start);
            const endDate = new Date(item.dateRange.end);
            const timeDiff = endDate.getTime() - startDate.getTime();
            const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

            let status = 'approved'; // default
            if (item.source === 'no_show') status = 'rejected';
            else if (item.source === 'approved_leave') status = 'approved';
            else if (item.source === 'manual_admin') status = 'assigned';

            return {
              id: item.id,
              name: item.type.name || 'Absence',
              date: new Date(item.createdAt).toLocaleDateString('en-CA'),
              time: new Date(item.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
              status: status,
              type: item.type.name,
              color: item.type.color,
              isPaid: item.type.isPaid,
              start_date: item.dateRange.start,
              end_date: item.dateRange.end,
              total_days: totalDays,
              comment: item.comment,
              source: item.source,
              isPartial: item.isPartial,
              partialTimes: item.partialTimes,
              createdAt: item.createdAt,
              employee_name: 'Current User',
              employee_id: 'USER',
              dateFrom: new Date(item.start_date).toLocaleDateString('en-CA'),
              dateTo: new Date(item.end_date).toLocaleDateString('en-CA'),
            };
          });

          if (append) {
            setAbsencesData(prev => [...prev, ...transformedData]);
          } else {
            setAbsencesData(transformedData);
          }
          // Check pagination
          const hasMore = response.data.pagination?.has_next || false;
          setHasMoreData(hasMore);
        } else {
          if (!append) setAbsencesData([]);
        }
      } catch (error) {
        if (!append) setAbsencesData([]);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token],
  );

  const handleTabChange = tab => {
    setSelectedTab(tab);
    setFiltersApplied(false);
    setActiveFilters({});
    fetchData();
  };

  // Load more absences
  const loadMoreAbsences = useCallback(() => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchData(activeFilters, nextPage, true);
    }
  }, [currentPage, isLoadingMore, hasMoreData, activeFilters, fetchData]);

  // Handle filter application
  const handleFilters = useCallback(
    async filters => {
      console.log('Applied Filters for API:', filters);
      setFiltersApplied(true);
      setActiveFilters(filters);

      const apiFilters = {
        absence_type: filters.type,
        start_date: filters.dateFrom,
        end_date: filters.dateTo,
      };

      await fetchData(apiFilters, 1, false);
    },
    [fetchData],
  );

  const clearFilters = useCallback(async () => {
    setFiltersApplied(false);
    setActiveFilters({});

    if (filterRef.current) {
      filterRef.current.resetFilters();
    }

    await fetchData({}, 1, false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const getStatusOptions = () => {
    return [
      {label: t('Approved'), value: 'APPROVED'},
      {label: t('Manual'), value: 'MANUAL'},
      {label: t('Auto Generated'), value: 'AUTO_GENERATED'},
      {label: t('Pending'), value: 'PENDING'},
    ];
  };

  const getTypeOptions = () => {
    return [
      {label: t('Vacation'), value: 'VACATION'},
      {label: t('Medical Leave'), value: 'MEDICAL'},
      {label: t('Personal Leave'), value: 'PERSONAL'},
      {label: t('Unjustified Absence'), value: 'UNJUSTIFIED'},
      {label: t('Paid Leave'), value: 'PAID_LEAVE'},
      {label: t('Unpaid Leave'), value: 'UNPAID_LEAVE'},
      {label: t('Training'), value: 'TRAINING'},
      {label: t('Other'), value: 'OTHER'},
    ];
  };

  const getFilterOptions = () => {
    return {
      enabledFilters: [FilterConfig.DATE_RANGE, FilterConfig.TYPE],
      fileTypes: getTypeOptions(),
      statuses: getStatusOptions(),
      labels: {
        type: t('Absence Type'),
        dateRange: t('Date Range'),
        clearAll: t('Clear All'),
        apply: t('Apply'),
      },
    };
  };

  // Get column configuration for export
  const getColumnConfig = () => {
    return [
      {key: 'employee_name', label: 'Employee Name'},
      {key: 'employee_id', label: 'Employee ID'},
      {key: 'absence_type', label: 'Absence Type'},
      {key: 'start_date', label: 'Start Date'},
      {key: 'end_date', label: 'End Date'},
      {key: 'total_days', label: 'Total Days'},
      {key: 'status', label: 'Status'},
      {key: 'comment', label: 'Comment'},
      {key: 'source', label: 'Source'},
      {key: 'is_partial', label: 'Is Partial'},
      {key: 'partial_times', label: 'Partial Times'},
      {key: 'is_paid', label: 'Is Paid'},
      {key: 'created_date', label: 'Created Date'},
    ];
  };

  // Get export data
  const getExportData = () => {
    return absencesData.map(item => ({
      employee_name: item.employee_name || 'Current User',
      employee_id: item.employee_id || 'USER',
      absence_type: item.type || 'N/A',
      start_date: new Date(item.start_date).toLocaleDateString(),
      end_date: new Date(item.end_date).toLocaleDateString(),
      total_days: item.total_days?.toString() || '0',
      status: item.status,
      comment: item.comment || 'No comment',
      source: item.source || 'N/A',
      is_partial: item.isPartial ? 'Yes' : 'No',
      partial_times: item.partialTimes
        ? `${item.partialTimes.start} - ${item.partialTimes.end}`
        : 'N/A',
      is_paid: item.isPaid ? 'Yes' : 'No',
      created_date: new Date(item.createdAt).toLocaleDateString(),
    }));
  };

  // Get export filename
  const getExportFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `absences-export-${timestamp}`;
  };

  const handleAbsencePress = item => {
    navigation.navigate(SCREENS.ABSENCEDETAILS, {
      absence: item,
    });
  };

  const tabHeading = t('Export');

  const renderAbsenceList = () => (
    <View style={styles.contentContainerStyle}>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.filterButtonStyle}
          onPress={() => filterBottomSheetRef.current?.open()}>
          <Ionicons
            name="filter-outline"
            size={RFPercentage(1.8)}
            color="#FFF"
          />
          <Text style={styles.filterButtonTextStyle}>
            {filtersApplied ? t('Filters Applied') : t('Filter')}
          </Text>
          {filtersApplied && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearFilters}>
              <Entypo
                name="circle-with-cross"
                size={RFPercentage(3)}
                color={Colors.darkTheme.deadlineMissedColor}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        <UnifiedExportComponent
          data={getExportData()}
          columns={getColumnConfig()}
          fileName={getExportFileName()}
          title="Absence Management Export"
          onExportStart={() => console.log('Absence export started')}
          onExportSuccess={filePath =>
            console.log('Absence export success:', filePath)
          }
          onExportError={error => console.log('Absence export error:', error)}
          showShareDialog={true}
          maxColumns={5}
          isDarkMode={isDarkMode}>
          <TouchableOpacity style={styles.exportButtonStyle}>
            <Entypo name="export" size={RFPercentage(1.8)} color={'#FFF'} />
            <Text style={styles.exportButtonTextStyle}>{t(tabHeading)}</Text>
          </TouchableOpacity>
        </UnifiedExportComponent>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {filtersApplied
                ? t('Applying filters...')
                : t('Loading absences...')}
            </Text>
          </View>
        ) : absencesData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filtersApplied
                ? t('No records match your filters')
                : t('No records found')}
            </Text>
            {filtersApplied && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearFilters}>
                <Text style={styles.clearFilterText}>{t('Clear Filters')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <UniversalCardTable
            title={t('Absences')}
            data={absencesData}
            type="absences"
            loading={loading}
            emptyMessage={
              filtersApplied
                ? t('No records match your filters')
                : t('No records found')
            }
            onPressItem={item => handleAbsencePress(item)}
            showHeader={false}
            flatListProps={{
              onEndReached: loadMoreAbsences,
              onEndReachedThreshold: 0.5,
              ListFooterComponent: isLoadingMore ? (
                <Text style={styles.loadingText}>{t('Loading more...')}</Text>
              ) : null,
            }}
          />
        )}
      </View>
    </View>
  );

  const renderAbsenceCalendar = () => (
    <View style={styles.calendarContainer}>
      <AbsenceCalendar />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        <StackHeader
          title={t('Absence Management')}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />

        {/* Tab Selector */}
        <TabSelector
          tabs={[t('Absence List'), t('Absence Calendar')]}
          selectedTab={selectedTab}
          onTabPress={handleTabChange}
        />

        {/* Conditional rendering based on selected tab */}
        {selectedTab === t('Absence List')
          ? renderAbsenceList()
          : renderAbsenceCalendar()}
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

export default Absence;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    headerStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    headerTxtStyle: {
      textAlign: 'left',
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    contentContainerStyle: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    calendarContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
    },
    tabHeaderBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginVertical: hp(3),
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
      padding: wp(2),
      borderRadius: wp(2),
      backgroundColor: '#006EC2',
      marginVertical: hp(2),
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: hp(2),
    },
    filterButtonStyle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: 8,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      maxWidth: '40%',
    },
    filterButtonTextStyle: {
      fontSize: RFPercentage(pxToPercentage(11)),
      fontFamily: Fonts.PoppinsMedium,
      color: '#FFF',
    },
    exportButtonStyle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(1),
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: 8,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    exportButtonTextStyle: {
      fontSize: RFPercentage(pxToPercentage(11)),
      fontFamily: Fonts.PoppinsMedium,
      color: '#FFF',
    },
    clearFiltersButton: {
      position: 'absolute',
      top: -hp(1),
      right: -wp(2),
      zIndex: 10,
      borderRadius: RFPercentage(5),
      padding: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
      borderRadius: wp(2),
      width: '100%',
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
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsMedium,
    },
    filterBtn: {
      padding: wp(1.5),
    },
    filterText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsMedium,
    },
    tabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: '#FFF',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(5),
    },
    emptyText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      marginBottom: hp(2),
    },
    clearFilterButton: {
      backgroundColor: Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: wp(2),
    },
    clearFilterText: {
      color: '#fff',
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsMedium,
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginLeft: wp(1.5),
    },
    listContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(4),
      paddingBottom: hp(2),
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    loadingContainer: {
      padding: wp(4),
      paddingVertical: hp(5),
      alignItems: 'center',
    },
    loadingText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
  });
