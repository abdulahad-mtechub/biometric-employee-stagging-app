import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  DeviceEventEmitter,
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
import {useSelector} from 'react-redux';
import {SYNC_COMPLETED_EVENT} from '../../services/OfflineLeaveRequestQueue';
import {Svgs} from '../../assets/Svgs/Svgs';
import ReusableBottomSheet from '../../components/BottomSheets/ReusableBottomSheet';
import SymbolCard from '../../components/Cards/SymbolCard';
import StackHeader from '../../components/Header/StackHeader';
import UniversalCardTable from '../../components/UniversalCardTable/UniversalCardTable';
import {getRequests} from '../../Constants/api';
import {RequestSymbols} from '../../Constants/DummyData';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';
import FilterBtmSheet, {
  FilterConfig,
} from '../../components/BottomSheets/FilterBtmSheet';
import UnifiedExportComponent from '../../components/ExportComponent/UnifiedExportComponent';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useButtonColors} from '../../Constants/colorHelper';

const ITEMS_PER_PAGE = 5;

const RequestManagement = ({navigation, route}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const {language} = useSelector(store => store?.auth);
  const languageCode = language === 'Español' ? 'es' : 'en';
  const [loading, setLoading] = useState(false);
  const btmSheetRef = useRef(null);
  const btmSheetRef2 = useRef(null);
  const token = useSelector(state => state?.auth?.user?.token);
  const [hrRequestsApiData, setHrRequestsApiData] = useState([]);
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
      if (!token) return;
      if (!append) {
        setLoading(true);
        setCurrentPage(1);
        setHasMoreData(true);
      } else {
        setIsLoadingMore(true);
      }
      try {
        const apiFilters = {
          ...filters,
          page,
          page_size: ITEMS_PER_PAGE,
        };
        const response = await getRequests(token, apiFilters);
        console.log(
          '📋 Requests Response - Page:',
          page,
          JSON.stringify(response, null, 2),
        );
        if (response?.data && Array.isArray(response.data)) {
          const transformedData = response.data.map(item => ({
            id: item.id,
            name: item.subject,
            date: new Date(item.created_at).toLocaleDateString('en-CA'),
            time: new Date(item.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            status: item.status,
            type: item.type,
            ...item,
          }));
          if (append) {
            setHrRequestsApiData(prev => [...prev, ...transformedData]);
          } else {
            setHrRequestsApiData(transformedData);
          }
          // Check pagination
          const hasMore = response.pagination?.has_next || false;
          setHasMoreData(hasMore);
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token],
  );

  const loadMoreRequests = useCallback(() => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchData(activeFilters, nextPage, true);
    }
  }, [currentPage, isLoadingMore, hasMoreData, activeFilters, fetchData]);

  const handleFilters = useCallback(
    async filters => {
      console.log('Applied Filters for API:', filters);
      setFiltersApplied(true);
      setActiveFilters(filters);
      const apiFilters = {
        start_date: filters.dateFrom,
        end_date: filters.dateTo,
        status: filters.status,
      };
      await fetchData(apiFilters);
    },
    [fetchData],
  );

  const clearFilters = useCallback(async () => {
    setFiltersApplied(false);
    setActiveFilters({});

    if (filterRef.current) {
      filterRef.current.resetFilters();
    }
    await fetchData();
  }, [fetchData]);

  const getStatusOptions = () => {
    return [
      {label: t('Approved'), value: 'APPROVED'},
      {label: t('Rejected'), value: 'REJECTED'},
      {label: t('Cancelled'), value: 'CANCELLED'},
      {label: t('Pending'), value: 'PENDING'},
      {label: t('Info Requested'), value: 'INFO_REQUESTED'},
    ];
  };

  const getDateRangeDisplay = () => {
    if (!activeFilters.dateFrom && !activeFilters.dateTo) return null;

    const formatDate = dateStr => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    if (activeFilters.dateFrom && activeFilters.dateTo) {
      return `${formatDate(activeFilters.dateFrom)} - ${formatDate(
        activeFilters.dateTo,
      )}`;
    }
    if (activeFilters.dateFrom) {
      return `${formatDate(activeFilters.dateFrom)} - ...`;
    }
    return `... - ${formatDate(activeFilters.dateTo)}`;
  };

  const getFilterOptions = () => {
    return {
      enabledFilters: [FilterConfig.DATE_RANGE, FilterConfig.STATUS],
      fileTypes: null,
      statuses: getStatusOptions(),
      labels: {
        status: t('Status'),
        dateRange: t('Date Range'),
        clearAll: t('Clear All'),
        apply: t('Apply'),
      },
    };
  };

  // Get column configuration for export
  const getColumnConfig = () => {
    return [
      {key: 'subject', label: t('Subject')},
      {key: 'type', label: t('Type')},
      {key: 'status', label: t('Status')},
      {key: 'created_at', label: t('Created Date')},
      {key: 'description', label: t('Description')},
    ];
  };

  // Get export data
  const getExportData = () => {
    return hrRequestsApiData.map(item => ({
      subject: item.subject || 'HR Request',
      type: item.type || 'Unknown',
      status: item.status,
      created_at: item.created_at,
      description: item.description || 'No description',
    }));
  };

  const getExportTitle = () => {
    const baseTitle = t('Request Management');
    if (filtersApplied) {
      return t('Request Management Export (Filtered)');
    }
    return baseTitle;
  };

  // Get export filename
  const getExportFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = filtersApplied ? '-filtered' : '';
    return `requests-export-${timestamp}${filterSuffix}`;
  };

  useFocusEffect(
    useCallback(() => {
      // Preserve filter state when navigating back to screen
      const apiFilters = filtersApplied
        ? {
            start_date: activeFilters.dateFrom,
            end_date: activeFilters.dateTo,
            status: activeFilters.status,
          }
        : {};
      fetchData(apiFilters);
    }, [token, filtersApplied, activeFilters, fetchData]),
  );

  // ============ OFFLINE MODE: LISTEN FOR SYNC COMPLETION ============
  // Auto-refresh data when offline requests are synced
  useEffect(() => {
    const syncListener = DeviceEventEmitter.addListener(
      SYNC_COMPLETED_EVENT,
      eventData => {
        console.log('🔄 Sync completed, refreshing request list...', eventData);
        // Refresh the requests list after successful sync
        fetchData(
          filtersApplied
            ? {
                start_date: activeFilters.dateFrom,
                end_date: activeFilters.dateTo,
                status: activeFilters.status,
              }
            : {},
        );
      },
    );

    // Cleanup listener on unmount
    return () => syncListener.remove();
  }, [fetchData, filtersApplied, activeFilters]);
  // ==================================================================

  const handleYearChange = newYear => {
    console.log('Selected year:', newYear);
  };

  const handleRequestPress = item => {
    navigation.navigate(SCREENS.REQUESTREQUESTDETAILS, {
      requestType: 'Request',
      item,
    });
  };

  const handleFloatingButtonPress = () => {
    try {
      if (btmSheetRef.current?.open) {
        btmSheetRef.current.open();
      } else {
        console.log('Bottom sheet method not available');
      }
    } catch (error) {
      console.error('Error opening bottom sheet:', error);
    }
  };

  const tabHeading = t('Export');

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: primaryButtonColors.backgroundColor,
          },
        ]}
        onPress={handleFloatingButtonPress}
        activeOpacity={0.7}>
        <Svgs.whitePlus height={hp(3)} width={hp(3)} />
      </TouchableOpacity>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        <StackHeader
          title={t('Request Management')}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />

        <View style={styles.contentContainerStyle}>
          <SymbolCard
            heading={t('Request Symbols')}
            array={RequestSymbols}
            contianerStyle={{
              backgroundColor: isDarkMode
                ? Colors.darkTheme.secondryColor
                : Colors.lightTheme.backgroundColor,
            }}
          />
          <View style={styles.tabHeaderBox}>
            <View style={styles.headerLeft}>
              <UnifiedExportComponent
                data={getExportData()}
                columns={getColumnConfig()}
                fileName={getExportFileName()}
                title={getExportTitle()}
                onExportStart={() => console.log('Export started')}
                onExportSuccess={filePath =>
                  console.log('Export success:', filePath)
                }
                onExportError={error => console.log('Export error:', error)}
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
                  <Text style={styles.exportButtonText}>{t(tabHeading)}</Text>
                  <Entypo
                    name="export"
                    size={RFPercentage(1.8)}
                    color={'#FFF'}
                  />
                </TouchableOpacity>
              </UnifiedExportComponent>
            </View>
            <View style={styles.headerRight}>
              {filtersApplied &&
                (activeFilters.dateFrom || activeFilters.dateTo) && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearFilters}>
                    <Text style={styles.clearButtonText}>{t('Clear')}</Text>
                  </TouchableOpacity>
                )}
              <TouchableOpacity
                style={styles.dateRangeButton}
                onPress={() => filterBottomSheetRef.current?.open()}>
                <Ionicons
                  name="filter-outline"
                  size={RFPercentage(1.8)}
                  color="#FFF"
                />
                <Text style={styles.dateRangeButtonText}>
                  {filtersApplied &&
                  (activeFilters.dateFrom || activeFilters.dateTo)
                    ? getDateRangeDisplay()
                    : t('Filter')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  {filtersApplied
                    ? t('Applying filters...')
                    : t('Loading requests...')}
                </Text>
              </View>
            ) : hrRequestsApiData.length === 0 ? (
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
                    <Text style={styles.clearFilterText}>
                      {t('Clear Filters')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <UniversalCardTable
                title={t('All Requests')}
                data={hrRequestsApiData}
                type="requests"
                loading={loading}
                emptyMessage={
                  filtersApplied
                    ? t('No records match your filters')
                    : t('No records found')
                }
                onPressItem={item => handleRequestPress(item)}
                showHeader={false}
                flatListProps={{
                  onEndReached: loadMoreRequests,
                  onEndReachedThreshold: 0.5,
                  ListFooterComponent: isLoadingMore ? (
                    <Text style={styles.loadingText}>
                      {t('Loading more...')}
                    </Text>
                  ) : null,
                }}
              />
            )}
          </View>
        </View>
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

      {/* Existing Bottom Sheets */}
      <ReusableBottomSheet
        height={hp('20%')}
        refRBSheet={btmSheetRef}
        sheetTitle={t('Select An Option')}
        options={[
          {
            icon: <Svgs.leaveRequest height={hp(4)} />,
            title: t('Generate Request'),
            onPress: () => {
              btmSheetRef.current?.close();
              navigation.navigate(SCREENS.SUBMITLEAVEREQUEST);
            },
          },
        ]}
      />
      <ReusableBottomSheet
        height={hp('25%')}
        refRBSheet={btmSheetRef2}
        sheetTitle={t('Select An Option')}
        options={[
          {
            icon: <Svgs.infoRequest height={hp(4)} />,
            title: 'Manual Punch Request',
            onPress: () => {
              btmSheetRef2.current?.close();
              navigation.navigate(SCREENS.ADDMANUALPUNCH);
            },
          },
          {
            icon: <Svgs.leaveRequest height={hp(4)} />,
            title: 'Leave Request',
            onPress: () => {
              btmSheetRef2.current?.close();
              navigation.navigate(SCREENS.SUBMITLEAVEREQUEST);
            },
          },
        ]}
      />
    </View>
  );
};

export default RequestManagement;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    tabHeaderBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: wp(2),
      padding: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginBottom: hp(1),
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    exportButton: {
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
    exportButtonText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: '#FFF',
    },
    clearButton: {
      backgroundColor: isDarkMode ? '#444' : '#f0f0f0',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: 8,
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
    dateRangeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: 8,
    },
    dateRangeButtonText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: '#FFF',
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
    floatingButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      width: wp(13),
      height: wp(13),
      borderRadius: wp(100),
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: hp(5),
      right: wp(5),
      elevation: 10,
      zIndex: 1000,
    },
    contentContainerStyle: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginLeft: wp(1.5),
    },
    TabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },
    listContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(4),
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(1),
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
