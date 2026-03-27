import moment from 'moment';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {
  getTicketCategories,
  getTicketPriorities,
  getTicketStatus,
} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';
import CustomSwitch from '../Buttons/CustomSwitch';
import DateTimePickerModal from '../DateTimeModal/CustomDateTimePicker';
import CustomDropDown from '../DropDown/CustomDropDown';

// Configuration object for filter options
export const FilterConfig = {
  DATE_RANGE: 'dateRange',
  STATUS: 'status',
  PRIORITY: 'priority',
  CATEGORY: 'category',
  TYPE: 'type', // Added type filter for absence types
  FILE_TYPE: 'fileType', // Added file type filter
  ASSIGNED_TO_ME: 'assignedToMe',
  CREATED_BY_ME: 'createdByMe',
};

// Common file types for documents
export const DEFAULT_FILE_TYPES = [
  {label: 'PDF', value: 'pdf'},
  {label: 'Word Document', value: 'doc'},
  {label: 'Word Document', value: 'docx'},
  {label: 'Excel', value: 'xls'},
  {label: 'Excel', value: 'xlsx'},
  {label: 'PowerPoint', value: 'ppt'},
  {label: 'PowerPoint', value: 'pptx'},
  {label: 'Image', value: 'jpg'},
  {label: 'Image', value: 'jpeg'},
  {label: 'Image', value: 'png'},
  {label: 'Image', value: 'gif'},
  {label: 'Text', value: 'txt'},
  {label: 'All Files', value: 'all'},
];

export default forwardRef(function FilterBtmSheet(
  {
    refRBSheet,
    onApplyFilters,
    // Array of filter options to show
    enabledFilters = [
      FilterConfig.DATE_RANGE,
      FilterConfig.STATUS,
      FilterConfig.PRIORITY,
      FilterConfig.CATEGORY,
      FilterConfig.FILE_TYPE, // Added file type to default enabled filters
      FilterConfig.ASSIGNED_TO_ME,
      FilterConfig.CREATED_BY_ME,
    ],
    // Pre-selected status options passed from parent (optional)
    statuses = null,
    // Pre-selected category options passed from parent (optional)
    categories = null,
    // File type options passed from parent (optional)
    fileTypes = null,
    // Default height
    height = hp(67),
    // Custom labels for filters
    labels = {},
    // Initial filter values
    initialFilters = {},
  },
  ref,
) {
  const {isDarkMode} = useSelector(state => state.theme);
  const {user} = useSelector(store => store.auth);
  const token = user?.token;
  const {t} = useTranslation();

  // Filter states with initial values
  const [selectedStatus, setSelectedStatus] = useState(
    initialFilters.status || null,
  );
  const [selectedPriority, setSelectedPriority] = useState(
    initialFilters.priority || null,
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialFilters.category || null,
  );
  const [selectedType, setSelectedType] = useState(
    initialFilters.type || null,
  );
  const [selectedFileType, setSelectedFileType] = useState(
    initialFilters.fileType || null,
  );
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || null);
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || null);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null);
  const [assignedToMe, setAssignedToMe] = useState(
    initialFilters.assignedToMe || false,
  );
  const [createdByMe, setCreatedByMe] = useState(
    initialFilters.createdByMe || false,
  );

  // Options data
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [fileTypeOptions, setFileTypeOptions] = useState([]);

  const styles = useMemo(() => dynamicStyles(isDarkMode), [isDarkMode]);

  // Get custom labels or fallback to translation keys
  const getLabel = useCallback(
    (key, defaultKey) => {
      return labels[key] || t(defaultKey);
    },
    [labels, t],
  );

  // Check if a filter is enabled
  const isFilterEnabled = useCallback(
    filter => {
      return enabledFilters.includes(filter);
    },
    [enabledFilters],
  );

  const resetAllFilters = useCallback(() => {
    setSelectedStatus(null);
    setSelectedPriority(null);
    setSelectedCategory(null);
    setSelectedType(null);
    setSelectedFileType(null);
    setDateFrom(null);
    setDateTo(null);
    setAssignedToMe(false);
    setCreatedByMe(false);
  }, []);

  useImperativeHandle(ref, () => ({
    resetFilters: resetAllFilters,
    setFilters: filters => {
      if (filters.status !== undefined) setSelectedStatus(filters.status);
      if (filters.priority !== undefined) setSelectedPriority(filters.priority);
      if (filters.category !== undefined) setSelectedCategory(filters.category);
      if (filters.type !== undefined) setSelectedType(filters.type);
      if (filters.fileType !== undefined) setSelectedFileType(filters.fileType);
      if (filters.dateFrom !== undefined) setDateFrom(filters.dateFrom);
      if (filters.dateTo !== undefined) setDateTo(filters.dateTo);
      if (filters.assignedToMe !== undefined)
        setAssignedToMe(filters.assignedToMe);
      if (filters.createdByMe !== undefined)
        setCreatedByMe(filters.createdByMe);
    },
  }));

  // Initialize status options from props or API
  useEffect(() => {
    if (statuses && isFilterEnabled(FilterConfig.STATUS)) {
      // Use statuses passed from parent and translate labels
      const formattedStatuses = statuses.map(item => ({
        label: t(item.label),
        value: item.value,
      }));
      setStatusOptions(formattedStatuses);
    }
  }, [statuses, isFilterEnabled, t]);

  // Initialize category options from props or API
  useEffect(() => {
    if (categories && isFilterEnabled(FilterConfig.CATEGORY)) {
      // Use categories passed from parent and translate labels
      const formattedCategories = categories.map(item => ({
        label: t(item.label),
        value: item.value,
      }));
      setCategoryOptions(formattedCategories);
    }
  }, [categories, isFilterEnabled, t]);

  // Initialize type options from props (for absence types)
  useEffect(() => {
    if (fileTypes && isFilterEnabled(FilterConfig.TYPE)) {
      // Use types passed from parent via fileTypes prop
      const formattedTypes = fileTypes.map(item => ({
        label: item.label,
        value: item.value,
      }));
      setTypeOptions(formattedTypes);
    }
  }, [fileTypes, isFilterEnabled]);

  // Initialize file type options from props or default
  useEffect(() => {
    if (fileTypes && isFilterEnabled(FilterConfig.FILE_TYPE)) {
      // Use file types passed from parent
      const formattedFileTypes = fileTypes.map(item => ({
        label: item.label,
        value: item.value,
      }));
      setFileTypeOptions(formattedFileTypes);
    } else if (isFilterEnabled(FilterConfig.FILE_TYPE)) {
      // Use default file types
      setFileTypeOptions(DEFAULT_FILE_TYPES);
    }
  }, [fileTypes, isFilterEnabled]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Only fetch data for enabled filters
        const promises = [];

        // Only fetch categories from API if not provided by parent
        if (isFilterEnabled(FilterConfig.CATEGORY) && !categories) {
          promises.push(getTicketCategories(token));
        }
        if (isFilterEnabled(FilterConfig.PRIORITY)) {
          promises.push(getTicketPriorities(token));
        }
        // Only fetch status from API if not provided by parent
        if (isFilterEnabled(FilterConfig.STATUS) && !statuses) {
          promises.push(getTicketStatus(token));
        }

        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.error === false) {
            const data = result.value.data;

            // Only set category options if not provided by parent
            if (
              isFilterEnabled(FilterConfig.CATEGORY) &&
              !categories &&
              index === promises.findIndex(p => p === getTicketCategories(token))
            ) {
              const formattedCategories = data.categories.map(item => ({
                label: item.label,
                value: item.value,
              }));
              setCategoryOptions(formattedCategories);
            }

            if (
              isFilterEnabled(FilterConfig.PRIORITY) &&
              index ===
                promises.findIndex(p => p === getTicketPriorities(token))
            ) {
              const formattedPriorities = data.priorities.map(item => ({
                label: item.label,
                value: item.value,
              }));
              setPriorityOptions(formattedPriorities);
            }

            // Only set status options if not provided by parent
            if (
              isFilterEnabled(FilterConfig.STATUS) &&
              !statuses &&
              index === promises.findIndex(p => p === getTicketStatus(token))
            ) {
              const formattedStatuses = data.statuses.map(item => ({
                label: item.label,
                value: item.value,
              }));
              setStatusOptions(formattedStatuses);
            }
          }
        });
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };

    fetchDropdownData();
  }, [token, isFilterEnabled, statuses, categories]);

  // Check if any filter is applied
  const hasFiltersApplied = useMemo(() => {
    return (
      (isFilterEnabled(FilterConfig.STATUS) && selectedStatus) ||
      (isFilterEnabled(FilterConfig.PRIORITY) && selectedPriority) ||
      (isFilterEnabled(FilterConfig.CATEGORY) && selectedCategory) ||
      (isFilterEnabled(FilterConfig.TYPE) && selectedType) ||
      (isFilterEnabled(FilterConfig.FILE_TYPE) && selectedFileType) ||
      (isFilterEnabled(FilterConfig.DATE_RANGE) && (dateFrom || dateTo)) ||
      (isFilterEnabled(FilterConfig.ASSIGNED_TO_ME) && assignedToMe) ||
      (isFilterEnabled(FilterConfig.CREATED_BY_ME) && createdByMe)
    );
  }, [
    selectedStatus,
    selectedPriority,
    selectedCategory,
    selectedType,
    selectedFileType,
    dateFrom,
    dateTo,
    assignedToMe,
    createdByMe,
    isFilterEnabled,
  ]);

  const handleApplyFilters = useCallback(() => {
    const appliedFilters = {
      ...(isFilterEnabled(FilterConfig.STATUS) && {status: selectedStatus}),
      ...(isFilterEnabled(FilterConfig.PRIORITY) && {
        priority: selectedPriority,
      }),
      ...(isFilterEnabled(FilterConfig.CATEGORY) && {
        category: selectedCategory,
      }),
      ...(isFilterEnabled(FilterConfig.TYPE) && {
        type: selectedType,
      }),
      ...(isFilterEnabled(FilterConfig.FILE_TYPE) && {
        fileType: selectedFileType,
      }),
      ...(isFilterEnabled(FilterConfig.DATE_RANGE) && {
        dateFrom: dateFrom,
        dateTo: dateTo,
      }),
      ...(isFilterEnabled(FilterConfig.ASSIGNED_TO_ME) && {
        assignedToMe: assignedToMe,
      }),
      ...(isFilterEnabled(FilterConfig.CREATED_BY_ME) && {
        createdByMe: createdByMe,
      }),
    };

    onApplyFilters(appliedFilters);
    refRBSheet.current.close();
  }, [
    selectedStatus,
    selectedPriority,
    selectedCategory,
    selectedType,
    selectedFileType,
    dateFrom,
    dateTo,
    assignedToMe,
    createdByMe,
    onApplyFilters,
    refRBSheet,
    isFilterEnabled,
  ]);

  // Calculate dynamic height based on enabled filters
  const calculateDynamicHeight = useCallback(() => {
    let baseHeight = hp(40); // Minimum height for header and buttons
    const filterHeight = hp(8); // Approximate height per filter

    const enabledCount = enabledFilters.length;
    return Math.min(height, baseHeight + enabledCount * filterHeight);
  }, [enabledFilters, height]);

  return (
    <RBSheet
      ref={refRBSheet}
      height={calculateDynamicHeight()}
      openDuration={300}
      draggable={true}
      closeOnPressMask
      customStyles={{
        container: {
          borderTopLeftRadius: wp(5),
          borderTopRightRadius: wp(5),
          backgroundColor: isDarkMode
            ? Colors.darkTheme.backgroundColor
            : Colors.lightTheme.backgroundColor,
          padding: wp(4),
        },
      }}>
      <View style={styles.header}>
        <Text style={styles.title}>{getLabel('title', t('Filter'))}</Text>
        <TouchableOpacity onPress={() => refRBSheet.current.close()}>
          <Icon
            name="x"
            size={RFPercentage(3)}
            color={
              isDarkMode
                ? Colors.darkTheme.primaryTextColor
                : Colors.lightTheme.primaryTextColor
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        {/* Status */}
        {isFilterEnabled(FilterConfig.STATUS) && (
          <CustomDropDown
            data={statusOptions}
            selectedValue={selectedStatus}
            onValueChange={setSelectedStatus}
            placeholder={getLabel('status', 'Status')}
          />
        )}

        {/* Priority */}
        {isFilterEnabled(FilterConfig.PRIORITY) && (
          <CustomDropDown
            data={priorityOptions}
            selectedValue={selectedPriority}
            onValueChange={setSelectedPriority}
            placeholder={getLabel('priority', 'Priority')}
          />
        )}

        {/* Category */}
        {isFilterEnabled(FilterConfig.CATEGORY) && (
          <CustomDropDown
            data={categoryOptions}
            selectedValue={selectedCategory}
            onValueChange={setSelectedCategory}
            placeholder={getLabel('category', 'Category')}
          />
        )}

        {/* Type */}
        {isFilterEnabled(FilterConfig.TYPE) && (
          <CustomDropDown
            data={typeOptions}
            selectedValue={selectedType}
            onValueChange={setSelectedType}
            placeholder={getLabel('type', 'Type')}
          />
        )}

        {/* File Type */}
        {isFilterEnabled(FilterConfig.FILE_TYPE) && (
          <CustomDropDown
            data={fileTypeOptions}
            selectedValue={selectedFileType}
            onValueChange={setSelectedFileType}
            placeholder={getLabel('fileType', 'File Type')}
          />
        )}

        {/* Assigned to me */}
        {isFilterEnabled(FilterConfig.ASSIGNED_TO_ME) && (
          <View style={styles.rowViewSb}>
            <Text style={styles.switchText}>
              {getLabel('assignedToMe', 'Assigned to me')}
            </Text>
            <CustomSwitch
              value={assignedToMe}
              onValueChange={setAssignedToMe}
            />
          </View>
        )}

        {/* Created by me */}
        {isFilterEnabled(FilterConfig.CREATED_BY_ME) && (
          <View style={styles.rowViewSb}>
            <Text style={styles.switchText}>
              {getLabel('createdByMe', 'Created by me')}
            </Text>
            <CustomSwitch value={createdByMe} onValueChange={setCreatedByMe} />
          </View>
        )}

        {/* Date Range */}
        {isFilterEnabled(FilterConfig.DATE_RANGE) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {getLabel('dateRange', 'Set the date range')}
            </Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setDatePickerType('start');
                  setIsDatePickerVisible(true);
                }}>
                <Text style={styles.dateText}>
                  {dateFrom || getLabel('from', 'From')}
                </Text>
                <MaterialCommunityIcons
                  name="calendar"
                  size={RFPercentage(2.5)}
                  color={
                    isDarkMode
                      ? Colors.darkTheme.secondryTextColor
                      : Colors.lightTheme.secondryTextColor
                  }
                />
              </TouchableOpacity>

              <Text style={styles.dashText}>–</Text>

              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setDatePickerType('end');
                  setIsDatePickerVisible(true);
                }}>
                <Text style={styles.dateText}>
                  {dateTo || getLabel('to', 'To')}
                </Text>
                <MaterialCommunityIcons
                  name="calendar"
                  size={RFPercentage(2.5)}
                  color={
                    isDarkMode
                      ? Colors.darkTheme.secondryTextColor
                      : Colors.lightTheme.secondryTextColor
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onClose={() => setIsDatePickerVisible(false)}
        onConfirm={date => {
          const formatted = moment(date).format('YYYY-MM-DD');
          if (datePickerType === 'start') {
            setDateFrom(formatted);
          } else if (datePickerType === 'end') {
            setDateTo(formatted);
          }
          setIsDatePickerVisible(false);
        }}
      />

      <View style={styles.filterActions}>
        <TouchableOpacity style={styles.clearButton} onPress={resetAllFilters}>
          <Text style={styles.clearText}>
            {getLabel('clearAll', 'Clear All')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.applyBtn,
            !hasFiltersApplied && styles.applyBtnDisabled,
          ]}
          onPress={handleApplyFilters}
          disabled={!hasFiltersApplied}>
          <Text style={styles.applyText}>{getLabel('apply', 'Apply')}</Text>
        </TouchableOpacity>
      </View>
    </RBSheet>
  );
});

const createStyles = isDarkMode =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: hp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginBottom: hp(2),
    },
    title: {
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      marginBottom: hp(2.5),
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      marginBottom: hp(1),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
    },
    dateInput: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: hp(5.5),
      paddingHorizontal: wp(4),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    dateText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    dashText: {
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    applyBtn: {
      backgroundColor: Colors.lightTheme.primaryColor,
      borderRadius: wp(2),
      alignItems: 'center',
      paddingVertical: hp(1.3),
      width: wp(60),
      height: wp(12),
      marginBottom: hp(1),
    },
    applyBtnDisabled: {
      backgroundColor: '#a0a0a0',
      opacity: 0.5,
    },
    applyText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.2),
      color: '#fff',
    },
    switchText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    rowViewSb: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(2),
    },
    filterActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: hp(2),
    },
    clearButton: {
      borderWidth: 1,
      borderColor: Colors.lightTheme.primaryColor,
      borderRadius: wp(2),
      marginRight: wp(2),
      width: wp(30),
      height: wp(12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearText: {
      color: Colors.lightTheme.primaryColor,
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
    },
  });

const dynamicStyles = (() => {
  const cache = new Map();
  return isDarkMode => {
    if (!cache.has(isDarkMode)) {
      cache.set(isDarkMode, createStyles(isDarkMode));
    }
    return cache.get(isDarkMode);
  };
})();
