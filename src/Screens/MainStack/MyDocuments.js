import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useRef, useState, useEffect} from 'react';
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
import {Svgs} from '../../assets/Svgs/Svgs';
import FilterBtmSheet, {
  FilterConfig,
} from '../../components/BottomSheets/FilterBtmSheet';
import StackHeader from '../../components/Header/StackHeader';
import TabSelector from '../../components/TabSelector/TabSelector';
import UniversalCardTable from '../../components/UniversalCardTable/UniversalCardTable';
import {getCompaniesDocument, getMyDocuments} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UnifiedExportComponent from '../../components/ExportComponent/UnifiedExportComponent';
import {useButtonColors} from '../../Constants/colorHelper';
import {DOCUMENT_SYNC_COMPLETED_EVENT} from '../../services/OfflineDocumentQueue';

const ITEMS_PER_PAGE = 5;

const MyDocuments = ({navigation}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const [selectedTab, setSelectedTab] = useState(t('Sent Documents'));
  const [myDocuments, setMyDocuments] = useState([]);
  const [companyDocuments, setCompanyDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = useSelector(state => state?.auth?.user?.token);
  console.log('Token in MyDocuments:', token);
  const filterRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [refreshing, setRefreshing] = useState(false);
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
    fetchDocuments();
  };
  const fetchDocuments = useCallback(
    async (filters = {}, page = 1, append = false) => {
      try {
        if (!append) {
          setLoading(true);
          setCurrentPage(1);
          setHasMoreData(true);
        } else {
          setIsLoadingMore(true);
        }

        const paginationFilters = {
          ...filters,
          page,
          page_size: ITEMS_PER_PAGE,
        };

        console.log('📄 Filters applied:', filters);
        console.log('📄 Selected tab:', selectedTab);

        const [myDocumentsResponse, companiesDocumentsResponse] =
          await Promise.all([
            getMyDocuments(token, paginationFilters),
            getCompaniesDocument(token, paginationFilters),
          ]);

        console.log(
          '📄 Received Documents Response:',
          JSON.stringify(companiesDocumentsResponse, null, 2),
        );

        if (myDocumentsResponse?.data?.documents) {
          if (append) {
            setMyDocuments(prev => [
              ...prev,
              ...myDocumentsResponse.data.documents,
            ]);
          } else {
            setMyDocuments(myDocumentsResponse.data.documents);
          }
          // Check pagination
          const hasMore =
            myDocumentsResponse.data.pagination?.has_next || false;
          setHasMoreData(hasMore);
        } else {
          if (!append) setMyDocuments([]);
        }
        if (companiesDocumentsResponse?.data?.documents) {
          if (append) {
            setCompanyDocuments(prev => [
              ...prev,
              ...companiesDocumentsResponse.data.documents,
            ]);
          } else {
            setCompanyDocuments(companiesDocumentsResponse.data.documents);
          }
        } else {
          if (!append) setCompanyDocuments([]);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [token],
  );

  const loadMoreDocuments = useCallback(() => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchDocuments(activeFilters, nextPage, true);
    }
  }, [currentPage, isLoadingMore, hasMoreData, activeFilters, fetchDocuments]);

  const handleFilters = useCallback(
    async filters => {
      setFiltersApplied(true);
      setActiveFilters(filters);
      setCurrentPage(1);
      setHasMoreData(true);

      const apiFilters = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        category: filters.category,
      };

      Object.keys(apiFilters).forEach(key => {
        if (apiFilters[key] === undefined || apiFilters[key] === null) {
          delete apiFilters[key];
        }
      });

      await fetchDocuments(apiFilters, 1, false);
    },
    [fetchDocuments],
  );

  const clearFilters = useCallback(async () => {
    setFiltersApplied(false);
    setActiveFilters({});

    if (filterRef.current) {
      filterRef.current.resetFilters();
    }

    await fetchDocuments();
  }, [fetchDocuments]);

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

  const getDocumentsToShow = () => {
    return selectedTab === t('Sent Documents') ? myDocuments : companyDocuments;
  };

  const docsToShow = getDocumentsToShow();

  const tabHeading =
    selectedTab === t('Sent Documents')
      ? t('Export')
      : selectedTab === t('Received Documents')
      ? t('Export')
      : null;

  const handleItemPress = item => {
    console.log('item', item);
    navigation.navigate(SCREENS.DOCUMENTDETAILS, {
      item,
      type: selectedTab === t('Sent Documents') ? 'Document' : 'Policies',
    });
  };

  const getCategoryOptions = () => {
    return [
      {label: 'Medical', value: 'medical'},
      {label: 'ID', value: 'id'},
      {label: 'Expense', value: 'expense'},
      {label: 'Other', value: 'other'},
    ];
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        if (isActive) {
          await fetchDocuments();
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [fetchDocuments]),
  );

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener(
      DOCUMENT_SYNC_COMPLETED_EVENT,
      eventData => {
        console.log('📄 Documents synced, refreshing list...', eventData);
        fetchDocuments(activeFilters);
      },
    );

    return () => {
      listener.remove();
    };
  }, [fetchDocuments, activeFilters]);

  const renderDocumentList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {filtersApplied
              ? t('Applying filters...')
              : t('Loading documents...')}
          </Text>
        </View>
      );
    }

    if (!docsToShow || docsToShow.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filtersApplied
              ? t('No documents match your filters')
              : t('No documents found')}
          </Text>
          {filtersApplied && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={clearFilters}>
              <Text style={styles.clearFilterText}>{t('Clear Filters')}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <UniversalCardTable
        title={
          selectedTab === t('Sent Documents')
            ? t('Sent Documents')
            : t('Received Documents')
        }
        data={docsToShow}
        type="documents"
        loading={loading}
        emptyMessage={
          filtersApplied
            ? t('No documents match your filters')
            : t('No documents found')
        }
        onPressItem={item => handleItemPress(item)}
        showHeader={false}
        fieldMapping={{
          date:
            selectedTab === t('Sent Documents') ? 'uploaded_at' : 'created_at',
        }}
        flatListProps={{
          onEndReached: loadMoreDocuments,
          onEndReachedThreshold: 0.5,
          ListFooterComponent: isLoadingMore ? (
            <Text style={styles.loadingText}>{t('Loading more...')}</Text>
          ) : null,
        }}
      />
    );
  };

  const getFilterOptions = () => {
    if (selectedTab === t('Sent Documents')) {
      return {
        enabledFilters: [FilterConfig.DATE_RANGE],
        fileTypes: null,
        statuses: null,
        categories: null,
        labels: {
          dateRange: t('Date Range'),
          clearAll: t('Clear All'),
          apply: t('Apply'),
        },
      };
    } else {
      return {
        enabledFilters: [FilterConfig.DATE_RANGE, FilterConfig.CATEGORY],
        fileTypes: null,
        statuses: null,
        categories: getCategoryOptions(),
        labels: {
          status: t('Category'),
          dateRange: t('Date Range'),
          clearAll: t('Clear All'),
          apply: t('Apply'),
        },
      };
    }
  };

  const filterOptions = getFilterOptions();

  const getColumnConfig = () => {
    if (selectedTab === t('Sent Documents')) {
      return [
        {key: 'name', label: t('Document Name')},
        {key: 'description', label: t('Description')},
        {key: 'category', label: t('Category')},
        {key: 'file_type', label: t('File Type')},
        {key: 'uploaded_at', label: t('Upload Date')},
      ];
    } else {
      return [
        {key: 'name', label: t('Policy Name')},
        {key: 'description', label: t('Description')},
        {key: 'category', label: t('Category')},
        {key: 'file_type', label: t('File Type')},
        {key: 'created_at', label: t('Created Date')},
      ];
    }
  };

  const getExportData = () => {
    const documents = getDocumentsToShow();
    return documents.map(doc => {
      if (selectedTab === t('Sent Documents')) {
        return {
          name: doc.name || 'Unnamed Document',
          description: doc.description || 'No description',
          category: doc.category || 'Uncategorized',
          file_type: doc.file_type || 'Unknown',
          uploaded_at: doc.uploaded_at,
        };
      } else {
        return {
          name: doc.name || 'Unnamed Policy',
          description: doc.description || 'No description',
          category: doc.category || 'Uncategorized',
          file_type: doc.file_type || 'Unknown',
          created_at: doc.created_at,
        };
      }
    });
  };

  const getExportTitle = () => {
    const baseTitle =
      selectedTab === t('Sent Documents')
        ? t('Documents Export')
        : t('Policies Export');

    if (filtersApplied) {
      return `${baseTitle} (Filtered)`;
    }
    return baseTitle;
  };

  const getExportFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const tabName =
      selectedTab === t('Sent Documents') ? 'my-documents' : 'company-policies';
    const filterSuffix = filtersApplied ? '-filtered' : '';
    return `${tabName}-export-${timestamp}${filterSuffix}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {backgroundColor: primaryButtonColors.backgroundColor},
        ]}
        onPress={() => navigation.navigate(SCREENS.UPLOADDOCUMENT)}>
        <Svgs.whitePlus height={hp(3)} width={hp(3)} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <StackHeader
          title={t('Document Management')}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />

        <TabSelector
          tabs={[t('Sent Documents'), t('Received Documents')]}
          selectedTab={selectedTab}
          onTabPress={handleTabChange}
        />

        <View style={styles.contentContainerStyle}>
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
                maxColumns={5}
                currentLanguage={languageCode}
                companyLogo={
                  language === 'English'
                    ? 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725800605-204511942.png'
                    : 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725818779-222108661.png'
                }
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
                onPress={() => bottomSheetRef.current?.open()}>
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

          <View style={styles.listContainer}>{renderDocumentList()}</View>
        </View>

        <FilterBtmSheet
          ref={filterRef}
          refRBSheet={bottomSheetRef}
          onApplyFilters={handleFilters}
          enabledFilters={filterOptions.enabledFilters}
          fileTypes={filterOptions.fileTypes}
          statuses={filterOptions.statuses}
          categories={filterOptions.categories}
          labels={filterOptions.labels}
          initialFilters={activeFilters}
        />
      </ScrollView>
    </View>
  );
};

export default MyDocuments;

// ... keep your existing styles the same ...
const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    // ... your existing styles remain unchanged ...
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
    scrollContent: {
      flexGrow: 1,
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
      marginTop: hp(2),
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
    filterBtn: {
      padding: wp(1.5),
    },
    tabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(15)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
    },
    activeFiltersBadge: {
      backgroundColor: Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.5),
      borderRadius: wp(2),
      marginLeft: wp(2),
    },
    activeFiltersText: {
      color: '#fff',
      fontSize: RFPercentage(pxToPercentage(10)),
      fontFamily: Fonts.PoppinsMedium,
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
    },
    filterBtnText: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderBottomWidth: 1,
      paddingBottom: hp(1),
    },
    listContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(4),
      paddingTop: hp(2),

      minHeight: hp(20),
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(1),
    },
    cardContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(1),
      paddingVertical: hp(0.5),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      paddingBottom: hp(1),
    },
    nameColumn: {
      flex: 2,
      marginRight: wp(2),
    },
    typeColumn: {
      flex: 0.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateColumn: {
      flex: 1.5,
      textAlign: 'right',
    },
    cardText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(25),
    },
    loadingText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(1),
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
  });
