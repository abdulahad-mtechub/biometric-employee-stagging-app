import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useRef, useState} from 'react';
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
import {Svgs} from '../../assets/Svgs/Svgs';
import FilterBtmSheet, {
  FilterConfig,
} from '../../components/BottomSheets/FilterBtmSheet';
import ReusableBottomSheet from '../../components/BottomSheets/ReusableBottomSheet';
import SymbolCard from '../../components/Cards/SymbolCard';
import UnifiedExportComponent from '../../components/ExportComponent/UnifiedExportComponent';
import StackHeader from '../../components/Header/StackHeader';
import TabSelector from '../../components/TabSelector/TabSelector';
import UniversalCardTable from '../../components/UniversalCardTable/UniversalCardTable';
import {getExpenses, getRemunerations} from '../../Constants/api';
import {useButtonColors} from '../../Constants/colorHelper';
import {RequestSymbols} from '../../Constants/DummyData';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';

const ITEMS_PER_PAGE = 5;

const Payments = ({navigation}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const [selectedTab, setSelectedTab] = useState(t('Expense'));
  const [loading, setLoading] = useState(false);
  const [expenseApiData, setExpenseApiData] = useState([]);
  const [remunerationApiData, setRemunerationApiData] = useState([]);
  const token = useSelector(state => state?.auth?.user?.token);
  const btmSheetRef = useRef(null);
  const btmSheetRef3 = useRef(null);
  const filterRef = useRef(null);
  const filterBottomSheetRef = useRef(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const {language} = useSelector(store => store?.auth);
  const languageCode = language === 'Español' ? 'es' : 'en';
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleTabChange = tab => {
    setSelectedTab(tab);
    setFiltersApplied(false);
    setActiveFilters({});
    setCurrentPage(1);
    setHasMoreData(true);
    fetchData({}, 1, false);
  };

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
        const paginationFilters = {
          ...filters,
          page,
          page_size: ITEMS_PER_PAGE,
        };

        if (selectedTab === t('Expense')) {
          const response = await getExpenses(token, paginationFilters);
          console.log(
            '💰 Expenses Response - Page:',
            page,
            JSON.stringify(response, null, 2),
          );
          if (response?.data && Array.isArray(response.data)) {
            const transformedData = response.data.map(item => ({
              id: item.id,
              name: item.description,
              date: new Date(item.date_of_expense).toLocaleDateString('en-CA'),
              time: new Date(item.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
              status: item.status,
              amount: `${item.amount} ${item.currency}`,
              ...item,
            }));

            if (append) {
              setExpenseApiData(prev => [...prev, ...transformedData]);
            } else {
              setExpenseApiData(transformedData);
            }
            // Check pagination
            const hasMore = response.pagination?.has_next || false;
            setHasMoreData(hasMore);
          }
        } else if (selectedTab === t('Remuneration')) {
          const response = await getRemunerations(token, paginationFilters);
          console.log(
            '💰 Remunerations Response - Page:',
            page,
            JSON.stringify(response, null, 2),
          );
          if (response?.data && Array.isArray(response.data)) {
            const transformedData = response.data.map(item => ({
              id: item.id,
              name: item.note || 'Remuneration',
              date: new Date(item.paid_at).toLocaleDateString('en-CA'),
              time: new Date(item.paid_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
              status: item.status,
              amount: `${item.amount} ${item.currency}`,
              ...item,
            }));

            if (append) {
              setRemunerationApiData(prev => [...prev, ...transformedData]);
            } else {
              setRemunerationApiData(transformedData);
            }
            // Check pagination
            const hasMore = response.pagination?.has_next || false;
            setHasMoreData(hasMore);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token, selectedTab, t],
  );

  const loadMorePayments = useCallback(() => {
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
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: filters.status,
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

    await fetchData();
  }, [fetchData]);

  const getStatusOptions = () => {
    return [
      {label: t('Pending'), value: 'pending'},
      {label: t('Approved'), value: 'approved'},
      {label: t('Paid'), value: 'paid'},
      {label: t('Rejected'), value: 'rejected'},
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
    const enabledFilters = [FilterConfig.DATE_RANGE];

    // Only include STATUS filter for Expense tab, not for Remuneration
    if (selectedTab === t('Expense')) {
      enabledFilters.push(FilterConfig.STATUS);
    }

    return {
      enabledFilters,
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

  const getColumnConfig = () => {
    if (selectedTab === t('Expense')) {
      return [
        {key: 'description', label: 'Description'},
        {key: 'amount', label: 'Amount'},
        {key: 'currency', label: 'Currency'},
        {key: 'date_of_expense', label: 'Expense Date'},
        {key: 'status', label: 'Status'},
        {key: 'created_at', label: 'Created Date'},
      ];
    } else {
      return [
        {key: 'type', label: 'Type'},
        {key: 'amount', label: 'Amount'},
        {key: 'currency', label: 'Currency'},
        {key: 'paid_at', label: 'Payment Date'},
        {key: 'status', label: 'Status'},
        {key: 'note', label: 'Note'},
      ];
    }
  };

  const getExportData = () => {
    const data =
      selectedTab === t('Expense') ? expenseApiData : remunerationApiData;
    return data.map(item => {
      if (selectedTab === t('Expense')) {
        return {
          description: item.description || 'No description',
          amount: item.amount,
          currency: item.currency,
          date_of_expense: item.date_of_expense,
          status: item.status,
          created_at: item.created_at,
        };
      } else {
        return {
          type: item.type || 'Unknown',
          amount: item.amount,
          currency: item.currency,
          paid_at: item.paid_at,
          status: item.status,
          note: item.note || 'No note',
        };
      }
    });
  };

  // Get export title
  const getExportTitle = () => {
    const baseTitle =
      selectedTab === t('Expense')
        ? t('Expenses Export')
        : t('Remunerations Export');

    if (filtersApplied) {
      return `${baseTitle} (Filtered)`;
    }
    return baseTitle;
  };

  // Get export filename
  const getExportFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const tabName = selectedTab === t('Expense') ? 'expenses' : 'remunerations';
    const filterSuffix = filtersApplied ? '-filtered' : '';
    return `${tabName}-export-${timestamp}${filterSuffix}`;
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [token, selectedTab, t]),
  );

  const handleYearChange = newYear => {
    console.log('Selected year:', newYear);
  };

  const tabHeading = t('Export');

  const RenderArray =
    selectedTab === t('Expense')
      ? expenseApiData
      : selectedTab === t('Remuneration')
      ? remunerationApiData
      : [];

  const requestType =
    selectedTab === t('Expense')
      ? 'Expense'
      : selectedTab === t('Remuneration')
      ? 'Remuneration'
      : null;

  const handleItemPress = item => {
    if (selectedTab === t('Expense')) {
      navigation.navigate(SCREENS.EXPENSEREQUESTDETAILS, {
        requestType: 'Expense',
        item,
      });
    } else if (selectedTab === t('Remuneration')) {
      navigation.navigate(SCREENS.REMUNERATIONREQUESTDETAILS, {
        requestType: 'Remuneration',
        item,
      });
    }
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

  return (
    <View style={styles.container}>
      {selectedTab === t('Expense') && (
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
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        <StackHeader
          title={t('Payment Management')}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />
        <TabSelector
          tabs={[t('Expense'), t('Remuneration')]}
          selectedTab={selectedTab}
          onTabPress={handleTabChange}
        />

        <View style={styles.contentContainerStyle}>
          {/* Export and Filter Header */}

          {selectedTab === t('Expense') && (
            <SymbolCard
              heading={t('Request Symbols')}
              array={RequestSymbols}
              contianerStyle={{
                backgroundColor: isDarkMode
                  ? Colors.darkTheme.secondryColor
                  : Colors.lightTheme.backgroundColor,
              }}
            />
          )}
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
                currentLanguage={languageCode}
                companyLogo={
                  language === 'English'
                    ? 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725800605-204511942.png'
                    : 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725818779-222108661.png'
                }
                onExportError={error => console.log('Export error:', error)}
                showShareDialog={true}
                maxColumns={6}
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
                    : t('Loading payments...')}
                </Text>
              </View>
            ) : RenderArray.length === 0 ? (
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
                title={
                  selectedTab === t('Expense')
                    ? t('Expenses')
                    : t('Remunerations')
                }
                data={RenderArray}
                type={
                  selectedTab === t('Expense') ? 'expenses' : 'remuneration'
                }
                loading={loading}
                emptyMessage={
                  filtersApplied
                    ? t('No records match your filters')
                    : t('No records found')
                }
                onPressItem={item => handleItemPress(item)}
                showHeader={false}
                flatListProps={{
                  onEndReached: loadMorePayments,
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
            icon: <Svgs.dollarRound height={hp(5)} />,
            title: t('Expense Request'),
            onPress: () => {
              btmSheetRef.current?.close();
              btmSheetRef3.current?.open();
            },
          },
        ]}
      />
      <ReusableBottomSheet
        height={hp('33%')}
        refRBSheet={btmSheetRef3}
        sheetTitle={t('Select An Option')}
        options={[
          {
            icon: <Svgs.dollarRound height={hp(4)} />,
            title: t('Expense'),
            onPress: () => {
              btmSheetRef3.current?.close();
              navigation.navigate(SCREENS.SUBMITEXPENSEREQUEST, {
                type: 'Expense',
              });
            },
          },
          {
            icon: <Svgs.leaveRequest height={hp(4)} />,
            title: t('Loan'),
            onPress: () => {
              btmSheetRef3.current?.close();
              navigation.navigate(SCREENS.SUBMITEXPENSEREQUEST, {type: 'Loan'});
            },
          },
        ]}
      />
    </View>
  );
};

export default Payments;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
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
    // ...existing styles continue...
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
      marginVertical: hp(1),
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
    tabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
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
