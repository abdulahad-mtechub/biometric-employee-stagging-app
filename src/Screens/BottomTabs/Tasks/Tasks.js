import {useFocusEffect, useRoute} from '@react-navigation/native';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  FlatList,
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
import Icon from 'react-native-vector-icons/Feather';
import {useSelector} from 'react-redux';
import {Svgs} from '../../../assets/Svgs/Svgs';
import FilterBtmSheet, {
  FilterConfig,
} from '../../../components/BottomSheets/FilterBtmSheet';
import TaskCalendar from '../../../components/Calender/TaskCalendar';
import YearlyCalendar from '../../../components/Calender/YearlyCalender';
import DashboardCard from '../../../components/Cards/DashboardCard';
import UnifiedExportComponent from '../../../components/ExportComponent/UnifiedExportComponent';
import MapComponent from '../../../components/Maps/LeafLetMap';
import TabSelector from '../../../components/TabSelector/TabSelector';
import UniversalCardTable from '../../../components/UniversalCardTable/UniversalCardTable';
import {
  getWorkerTasks,
  taskStats,
  yearlyTaskList,
} from '../../../Constants/api';
import {API_BASE_URL} from '../../../Constants/Base_URL';
import {useButtonColors} from '../../../Constants/colorHelper';
import {Fonts} from '../../../Constants/Fonts';
import {SCREENS} from '../../../Constants/Screens';
import {Colors} from '../../../Constants/themeColors';
import {fetchButtonColors} from '../../../utils/LocationHelpers';
import {pxToPercentage} from '../../../utils/responsive';
import TaskAttendanceHistory from './TaskAttendanceHistory';

const TASKS_PER_PAGE = 5;
const TASKS_API_FETCH_LIMIT = 100;
const TASKS_DEBUG = true;

// Move helper functions outside component to avoid recreation
const formatDate = dateStr => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const deduplicateTasks = tasks => {
  const uniqueTasks = [];
  const seenIds = new Set();

  tasks.forEach(task => {
    const taskId = task.id || task.task_id || `${task.title}-${task.start_at}`;
    if (!seenIds.has(taskId)) {
      seenIds.add(taskId);
      uniqueTasks.push(task);
    }
  });

  return uniqueTasks;
};

const getTaskTimestamp = task => {
  return new Date(
    task?.created_at || task?.createdAt || task?.start_at || task?.end_at || 0,
  ).getTime();
};

const getTaskStableId = task => {
  return String(task?.id || task?.task_id || task?.title || '');
};

const sortTasksByRecent = tasks => {
  return [...tasks].sort((a, b) => {
    const dateA = getTaskTimestamp(a);
    const dateB = getTaskTimestamp(b);
    if (dateB !== dateA) return dateB - dateA;

    return getTaskStableId(a).localeCompare(getTaskStableId(b));
  });
};

const Tasks = ({navigation}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const {t} = useTranslation();
  const styles = useMemo(() => dynamicStyles(isDarkMode), [isDarkMode]);
  const route = useRoute();
  const [selectedTab, setSelectedTab] = useState(t('All Tasks'));
  const navFilterJustApplied = useRef(false);
  const lastLoadedPage = useRef(1);
  const activeListRequestId = useRef(0);
  const hasListScrollStarted = useRef(false);
  const filterRef = useRef(null);
  const filterBottomSheetRef = useRef(null);
  const handleFiltersRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.status) {
        setActiveFilters({status: route.params.status});
        setFiltersApplied(true);
        if (handleFiltersRef.current) {
          handleFiltersRef.current({status: route.params.status});
        }
        setSelectedTab(t('All Tasks'));
        navFilterJustApplied.current = true;
      }
    }, [route.params?.status, t]),
  );

  const [showCalenderBtns, setShowCalenderBtns] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [statsCards, setStatsCards] = useState([]);
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(`${new Date().getFullYear()}-12-31`);
  const {language} = useSelector(store => store?.auth);
  const languageCode = language === 'Español' ? 'es' : 'en';
  const [yearlyTasks, setYearlyTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true); // Start with true to show loading initially
  const [tasksError, setTasksError] = useState(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [taskPins, setTaskPins] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const token = useSelector(state => state?.auth?.user?.token);

  const changeYear = delta => {
    const newYear = year + delta;
    setYear(newYear);
    setFrom(`${newYear}-01-01`);
    setTo(`${newYear}-12-31`);
  };

  useFocusEffect(
    useCallback(() => {
      fetchButtonColors();
    }, []),
  );
  const FullYear = () => {
    return year;
  };

  const [calendarType, setCalenderType] = useState('');

  const calendarBtn = [
    {
      name: 'Year',
      onPress: () => {
        setCalenderType('Year');
        setShowCalenderBtns(false);
      },
      icon: <Svgs.calenderYearlyView />,
    },
    {
      name: 'Month',
      onPress: () => {
        setCalenderType('Month');
        setShowCalenderBtns(false);
      },
      icon: <Svgs.calenderMonthlyView />,
    },
    {
      name: 'Week',
      onPress: () => {
        setCalenderType('Week');
        setShowCalenderBtns(false);
      },
      icon: <Svgs.calenderWeeklyView />,
    },
    {
      name: 'Tasks',
      onPress: () => {
        setCalenderType('Tasks');
        setShowCalenderBtns(false);
      },
      icon: <Svgs.calenderTasksView />,
    },
  ];

  const isTasks = selectedTab === t('All Tasks');
  const isAttendanceHistory = selectedTab === t('Task Attendance History');

  const fetchWorkerTasksForPins = useCallback(
    async (filters = {}, page = 1, append = false) => {
      try {
        const apiFilters = {
          from: filters.dateFrom || from,
          to: filters.dateTo || to,
        };
        if (filters.status) {
          apiFilters.status = filters.status;
        }

        const workerTaskParams = new URLSearchParams({
          show_history: 'true',
          ...(apiFilters.status ? {status: apiFilters.status} : {}),
          ...(apiFilters.from ? {from: apiFilters.from} : {}),
          ...(apiFilters.to ? {to: apiFilters.to} : {}),
          page: String(page),
          page_size: String(TASKS_API_FETCH_LIMIT),
        });
        if (TASKS_DEBUG) {
          console.log(
            '[Tasks API][Pins][REQ]',
            `${API_BASE_URL}task-management/worker/tasks?${workerTaskParams.toString()}`,
          );
        }

        const response = await getWorkerTasks(token, {
          ...apiFilters,
          page,
          limit: TASKS_API_FETCH_LIMIT,
        });
        if (TASKS_DEBUG) {
          console.log('[Tasks API][Pins][RES]', {
            success: response?.success,
            tasksCount: response?.data?.tasks?.length || 0,
            firstTask:
              response?.data?.tasks?.[0] || 'No tasks returned from API',
          });
        }
        if (response?.data?.tasks && Array.isArray(response.data.tasks)) {
          const pins = response.data.tasks
            .filter(task => task.location_lat && task.location_lng)
            .map(task => ({
              id: task.id,
              lat: parseFloat(task.location_lat),
              lng: parseFloat(task.location_lng),
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              address: task.location_address,
              start_at: task.start_at,
              end_at: task.end_at,
              attachments: task.attachments,
            }));

          const uniquePins = deduplicateTasks(pins);

          if (append) {
            setTaskPins(prev => {
              const combinedPins = [...prev, ...uniquePins];
              return deduplicateTasks(combinedPins);
            });
          } else {
            setTaskPins(uniquePins);
          }
        } else {
          setTaskPins([]);
        }
      } catch (error) {
        setTaskPins([]);
      }
    },
    [token, from, to],
  );

  useEffect(() => {
    if (isTasks) {
      fetchWorkerTasksForPins(filtersApplied ? activeFilters : {});
    }
  }, [isTasks, fetchWorkerTasksForPins, filtersApplied, activeFilters]);

  const isCalendar = selectedTab === t('Calendar View');

  const fetchYearlyTasks = useCallback(
    async (filters = {}, page = 1, append = false) => {
      let requestId = activeListRequestId.current;
      try {
        if (!append) {
          requestId = activeListRequestId.current + 1;
          activeListRequestId.current = requestId;
          setHasAttemptedLoad(false);
          setTasksLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        setTasksError(null);
        const hasDateFilters =
          filtersApplied &&
          (filters.from || filters.to || filters.dateFrom || filters.dateTo);

        let response;

        if (hasDateFilters || filters.status) {
          const apiFilters = {
            from: filters.from || filters.dateFrom || from,
            to: filters.to || filters.dateTo || to,
          };

          if (filters.status) {
            apiFilters.status = filters.status;
          }

          const yearlyParams = new URLSearchParams({
            page_size: String(TASKS_API_FETCH_LIMIT),
            page: String(page),
            ...(apiFilters.from ? {from: apiFilters.from} : {}),
            ...(apiFilters.to ? {to: apiFilters.to} : {}),
            ...(apiFilters.status ? {status: apiFilters.status} : {}),
          });
          if (TASKS_DEBUG) {
            console.log(
              '[Tasks API][List][REQ]',
              `${API_BASE_URL}task-management/worker/tasks?${yearlyParams.toString()}`,
            );
          }

          response = await yearlyTaskList(
            apiFilters.from,
            apiFilters.to,
            token,
            {
              page,
              limit: TASKS_API_FETCH_LIMIT,
              ...(apiFilters.status ? {status: apiFilters.status} : {}),
            },
          );
        } else {
          const yearlyParams = new URLSearchParams({
            page_size: String(TASKS_API_FETCH_LIMIT),
            page: String(page),
          });
          if (TASKS_DEBUG) {
            console.log(
              '[Tasks API][List][REQ]',
              `${API_BASE_URL}task-management/worker/tasks?${yearlyParams.toString()}`,
            );
          }
          response = await yearlyTaskList(null, null, token, {
            page,
            limit: TASKS_API_FETCH_LIMIT,
          });
        }
        if (TASKS_DEBUG) {
          console.log('[Tasks API][List][RES]', {
            success: response?.success,
            tasksCount: response?.data?.tasks?.length || 0,
            pagination: response?.data?.pagination || null,
            firstTask:
              response?.data?.tasks?.[0] || 'No tasks returned from API',
          });
        }

        const statsResponse = await taskStats(token);

        if (!append && requestId !== activeListRequestId.current) {
          return;
        }

        if (response?.data?.tasks) {
          let newTasks = response.data.tasks;
          lastLoadedPage.current = page;

          newTasks = deduplicateTasks(newTasks);

          // Keep ordering deterministic to prevent visible row jumps.
          newTasks = sortTasksByRecent(newTasks);

          // ✅ ATOMIC UPDATE: Set tasks and loading together to prevent flicker
          if (append) {
            // For pagination: append without reordering existing rows.
            setYearlyTasks(prev => {
              const combinedTasks = [...prev, ...newTasks];
              const dedupedTasks = deduplicateTasks(combinedTasks);
              return dedupedTasks;
            });
            setIsLoadingMore(false);
          } else {
            setYearlyTasks(newTasks);
          }
          // Use API's pagination info to determine if there are more pages
          const hasMorePages = response.data.pagination?.has_next || false;
          setHasMoreData(hasMorePages);
        }

        if (statsResponse?.data?.counters && page === 1) {
          const c = statsResponse.data.counters;
          setStatsCards([
            {
              title: 'Assigned Task',
              value: c.assigned_task_until_today || 0,
              subText: t('Tasks assigned'),
            },
            {
              title: 'Pending Task',
              value: c.pending_task_until_today || 0,
              subText: t('Tasks pending'),
            },
            {
              title: 'Start Task',
              value: c.start_task_today || 0,
              subText: t('Started today'),
            },
            {
              title: 'On-Time Start Task',
              value: c.on_time_start_task_today || 0,
              subText: t('On time starts'),
            },
            {
              title: 'Late Start Task',
              value: c.late_start_task_today || 0,
              subText: t('Late starts'),
            },
            {
              title: 'End Task',
              value: c.end_task_today || 0,
              subText: t('Ended today'),
            },
            {
              title: 'On-Time End Task',
              value: c.on_time_end_task_today || 0,
              subText: t('On time ends'),
            },
            {
              title: 'Late End Task',
              value: c.late_end_task_today || 0,
              subText: t('Late ends'),
            },
            {
              title: 'Not Done',
              value: c.not_done_until_today || 0,
              subText: t('Not done'),
            },
            {
              title: 'Cancelled Task',
              value: c.cancelled_until_today || 0,
              subText: t('Cancelled'),
            },
            {
              title: 'High Priority',
              value: c.priority_high_today || 0,
              subText: t('High priority'),
            },
            {
              title: 'Medium Priority',
              value: c.priority_medium_today || 0,
              subText: t('Medium priority'),
            },
            {
              title: 'Low Priority',
              value: c.priority_low_today || 0,
              subText: t('Low priority'),
            },
            {
              title: 'Unvalidated Tasks',
              value: c.not_validated_events || 0,
              subText: t('Need review'),
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching yearly tasks:', error);
        if (append || requestId === activeListRequestId.current) {
          setTasksError(error.message || 'Failed to fetch tasks');
        }
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else if (requestId === activeListRequestId.current) {
          // Reveal list only after the latest request fully completes.
          setTasksLoading(false);
          setHasAttemptedLoad(true);
        }
      }
    },
    [from, to, token, filtersApplied, t],
  );

  const handleFilters = useCallback(
    async filters => {
      // Immediately clear tasks to prevent showing old data during filter
      setYearlyTasks([]);
      setTaskPins([]);
      setTasksLoading(true);
      setFiltersApplied(true);
      setActiveFilters(filters);
      setCurrentPage(1);
      setHasMoreData(true);
      lastLoadedPage.current = 1;
      hasListScrollStarted.current = false;

      const apiFilters = {
        from: filters.dateFrom || from,
        to: filters.dateTo || to,
      };

      if (filters.status) {
        apiFilters.status = filters.status;
      }

      await Promise.all([
        fetchYearlyTasks(apiFilters, 1, false),
        fetchWorkerTasksForPins(filters, 1, false),
      ]);
    },
    [fetchYearlyTasks, fetchWorkerTasksForPins, from, to],
  );

  // Update ref when handleFilters changes
  useEffect(() => {
    handleFiltersRef.current = handleFilters;
  }, [handleFilters]);

  const getDateRangeDisplay = () => {
    if (!activeFilters.dateFrom && !activeFilters.dateTo) return null;

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

  const clearFilters = useCallback(async () => {
    // Immediately clear tasks to prevent showing old data
    setYearlyTasks([]);
    setTaskPins([]);
    setTasksLoading(true);
    setFiltersApplied(false);
    setActiveFilters({});
    setCurrentPage(1);
    setHasMoreData(true);
    lastLoadedPage.current = 1;
    hasListScrollStarted.current = false;

    if (filterRef.current) {
      filterRef.current.resetFilters();
    }

    await Promise.all([
      fetchYearlyTasks({}, 1, false),
      fetchWorkerTasksForPins({}, 1, false),
    ]);
  }, [fetchYearlyTasks, fetchWorkerTasksForPins]);

  const loadMoreTasks = useCallback(() => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      if (lastLoadedPage.current !== nextPage) {
        lastLoadedPage.current = nextPage;
        setCurrentPage(nextPage);
        fetchYearlyTasks(activeFilters, nextPage, true);
      }
    }
  }, [
    currentPage,
    isLoadingMore,
    hasMoreData,
    activeFilters,
    fetchYearlyTasks,
  ]);

  // Memoized status options
  const statusOptions = useMemo(
    () => [
      {label: t('Assigned'), value: 'assigned'},
      {label: t('In Progress'), value: 'in_progress'},
      {label: t('Completed'), value: 'completed'},
      {label: t('Not Done'), value: 'not_done'},
      {label: t('Cancelled'), value: 'cancelled'},
      {label: t('Overdue'), value: 'overdue'},
    ],
    [t],
  );

  // Memoized filter options
  const filterOptions = useMemo(
    () => ({
      enabledFilters: [FilterConfig.DATE_RANGE, FilterConfig.STATUS],
      fileTypes: null,
      statuses: statusOptions,
      priorities: null,
      labels: {
        status: t('Status'),
        dateRange: t('Date Range'),
        clearAll: t('Clear All'),
        apply: t('Apply'),
      },
    }),
    [t, statusOptions],
  );

  // Memoized column config
  const columnConfig = useMemo(
    () => [
      {key: 'title', label: t('Task Title')},
      {key: 'description', label: t('Description')},
      {key: 'priority', label: t('Priority')},
      {key: 'status', label: t('Status')},
      {key: 'start_at', label: t('Start Date')},
      {key: 'end_at', label: t('End Date')},
      {key: 'assigned_by_name', label: t('Assigned By')},
      {key: 'location_address', label: t('Location')},
    ],
    [t],
  );

  // Memoized export data
  const exportData = useMemo(() => {
    const filteredTasks = yearlyTasks.filter(
      item => item.status === 'completed' || item.status === 'not_done',
    );

    return filteredTasks.map(item => ({
      title: item.title || 'Untitled Task',
      description: item.description || 'No description',
      priority: item.priority || 'Not set',
      status: item.status || 'Unknown',
      start_at: item.start_at
        ? new Date(item.start_at).toLocaleDateString()
        : 'N/A',
      end_at: item.end_at ? new Date(item.end_at).toLocaleDateString() : 'N/A',
      assigned_by_name: item.assigned_by_name || 'Unknown',
      location_address: item.location_address || 'No location',
    }));
  }, [yearlyTasks]);

  // Memoized export title
  const exportTitle = useMemo(() => {
    const baseTitle = t('Tasks Export');
    if (filtersApplied) {
      return `${baseTitle} (Filtered)`;
    }
    return baseTitle;
  }, [filtersApplied, t]);

  // Memoized export filename
  const exportFileName = useMemo(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = filtersApplied ? '-filtered' : '';
    return `tasks-export-${timestamp}${filterSuffix}`;
  }, [filtersApplied]);

  // Memoized filtered tasks
  useFocusEffect(
    useCallback(() => {
      if (navFilterJustApplied.current) {
        navFilterJustApplied.current = false;
        return;
      }

      // Always refresh on focus so newly created tasks appear immediately.
      setCurrentPage(1);
      setHasMoreData(true);
      lastLoadedPage.current = 1;
      hasListScrollStarted.current = false;

      const appliedFilters = filtersApplied ? activeFilters : {};
      fetchYearlyTasks(appliedFilters, 1, false);
      fetchWorkerTasksForPins(appliedFilters, 1, false);
      setHasAttemptedLoad(true);
    }, [
      fetchYearlyTasks,
      fetchWorkerTasksForPins,
      filtersApplied,
      activeFilters,
    ]),
  );

  const filteredTasks = useMemo(() => {
    // Keep all fetched tasks visible; API status values may evolve.
    return yearlyTasks;
  }, [yearlyTasks]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}
        scrollEnabled={scrollEnabled}>
        <View style={styles.headerContainer}>
          <Text style={[styles.ScreenHeading]}>{t('Task Management')}</Text>
          <View style={styles.iconContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate(SCREENS.MESSAGES);
              }}>
              <Svgs.messageL height={hp(3.5)} width={hp(3.5)} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate(SCREENS.NOTIFICATIONS);
              }}>
              {isDarkMode ? (
                <Svgs.BellD height={hp(4)} />
              ) : (
                <Svgs.BellL height={hp(4)} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <TabSelector
          tabs={[
            t('All Tasks'),
            t('Calendar View'),
            t('Task Attendance History'),
          ]}
          selectedTab={selectedTab}
          onTabPress={setSelectedTab}
          isScrollable={true}
        />
        {isTasks && (
          <View
            style={{width: '100%', height: 250, marginBottom: 16}}
            onTouchStart={() => setScrollEnabled(false)}
            onTouchEnd={() => setScrollEnabled(true)}>
            <MapComponent
              initialLat={taskPins.length > 0 ? taskPins[0].lat : 33.6519}
              initialLng={taskPins.length > 0 ? taskPins[0].lng : 73.0817}
              initialZoom={13}
              markers={taskPins.map(pin => ({
                lat: pin.lat,
                lng: pin.lng,
                title: pin.title,
                description: pin.description,
                status: pin.status,
                priority: pin.priority,
                address: pin.address,
                start_at: pin.start_at,
                end_at: pin.end_at,
                attachments: pin.attachments,
              }))}
              height={250}
              showSearch={false}
              searchPlaceholder={''}
            />
          </View>
        )}

        {isTasks ? (
          <View style={styles.contentContainerStyle}>
            <FlatList
              data={statsCards}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContainer,
                {
                  backgroundColor: 'transparent',
                  paddingTop: 0,
                },
              ]}
              style={styles.flatListContainer}
              renderItem={({item}) => (
                <DashboardCard
                  title={item.title}
                  value={item.value}
                  subText={item.subText}
                  progress={item.progress}
                />
              )}
            />
            <View style={styles.listContainer}>
              <View style={styles.tabHeaderBox}>
                <View style={styles.sectionHeader}>
                  <View style={styles.headerLeft}>
                    <UnifiedExportComponent
                      data={exportData}
                      columns={columnConfig}
                      fileName={exportFileName}
                      title={exportTitle}
                      onExportStart={() => console.log('Export started')}
                      onExportSuccess={filePath =>
                        console.log('Export success:', filePath)
                      }
                      onExportError={error =>
                        console.log('Export error:', error)
                      }
                      showShareDialog={true}
                      currentLanguage={languageCode}
                      companyLogo={
                        language === 'English'
                          ? 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725800605-204511942.png'
                          : 'https://biometric-staging-backend.caprover-testing.mtechub.com/api/uploads/profile-pictures/profile-1763725818779-222108661.png'
                      }
                      maxColumns={8}
                      isDarkMode={isDarkMode}>
                      <TouchableOpacity style={styles.exportButton}>
                        <Text style={styles.exportButtonText}>
                          {t('Export')}
                        </Text>
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
                          <Text style={styles.clearButtonText}>
                            {t('Clear')}
                          </Text>
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

                {filtersApplied && activeFilters.status && (
                  <View
                    style={{
                      marginTop: 8,
                      alignSelf: 'flex-start',
                      backgroundColor: isDarkMode ? '#222' : '#e6f0fa',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    }}>
                    <Text
                      style={{
                        color: isDarkMode ? '#fff' : '#006EC2',
                        fontWeight: 'bold',
                      }}>
                      {t('Status')}:{' '}
                      {t(
                        activeFilters.status.charAt(0).toUpperCase() +
                          activeFilters.status.slice(1).replace('_', ' '),
                      )}
                    </Text>
                  </View>
                )}
              </View>
              {/* <SymbolCard
              heading={'Status Symbols'}
              array={TaskSymbols}
              contianerStyle={{
                backgroundColor: isDarkMode
                  ? Colors.darkTheme.secondryColor
                  : Colors.lightTheme.backgroundColor,
              }}
            /> */}
              {tasksLoading || !hasAttemptedLoad ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>
                    {filtersApplied
                      ? t('Applying filters...')
                      : t('Loading tasks...')}
                  </Text>
                </View>
              ) : tasksError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{tasksError}</Text>
                </View>
              ) : filteredTasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {filtersApplied
                      ? t('No tasks match your filters')
                      : t('No tasks found')}
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
                  title={t('All Tasks')}
                  data={filteredTasks}
                  type="tasks"
                  loading={tasksLoading}
                  emptyMessage={
                    filtersApplied
                      ? t('No tasks match your filters')
                      : t('No tasks found')
                  }
                  onPressItem={item => {
                    navigation.navigate(SCREENS.TASKDETAIL, {
                      task: item,
                      previousScreen: 'Tasks',
                    });
                  }}
                  showHeader={false}
                  flatListProps={{
                    onMomentumScrollBegin: () => {
                      hasListScrollStarted.current = true;
                    },
                    onEndReached: () => {
                      if (!hasListScrollStarted.current) return;
                      loadMoreTasks();
                    },
                    onEndReachedThreshold: 0.5,
                    ListFooterComponent: isLoadingMore ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>
                          {t('Loading more...')}
                        </Text>
                      </View>
                    ) : null,
                  }}
                />
              )}
            </View>
          </View>
        ) : isCalendar ? (
          <View
            style={[
              styles.contentContainerStyle,
              calendarType === 'Year' && {paddingHorizontal: wp(1.5)},
            ]}>
            {calendarType === 'Year' && (
              <View style={[styles.rowViewSB, {marginVertical: hp(3)}]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: wp(3),
                  }}>
                  <TouchableOpacity onPress={() => changeYear(-1)}>
                    <Icon
                      name="chevron-left"
                      size={RFPercentage(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.iconColor
                          : Colors.lightTheme.iconColor
                      }
                    />
                  </TouchableOpacity>

                  <Text style={styles.year}>{FullYear()}</Text>

                  <TouchableOpacity onPress={() => changeYear(1)}>
                    <Icon
                      name="chevron-right"
                      size={RFPercentage(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.iconColor
                          : Colors.lightTheme.iconColor
                      }
                    />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: wp(4),
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() => setShowCalenderBtns(!showCalenderBtns)}>
                    {isDarkMode ? (
                      <Svgs.calenderYearlyView />
                    ) : (
                      <Svgs.calenderYearlyView />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity>
                    {isDarkMode ? <Svgs.searchD /> : <Svgs.SearchL />}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={[styles.rowViewSB, {padding: 0}]}>
              {showCalenderBtns &&
                calendarBtn.map((item, index) => (
                  <TouchableOpacity
                    onPress={item.onPress}
                    style={styles.calenderBtn}>
                    {item.icon}
                    <Text style={styles.calenderBtnTxt}>{t(item.name)}</Text>
                  </TouchableOpacity>
                ))}
            </View>
            {calendarType === 'Year' ? (
              <View style={styles.calendarContainer}>
                <YearlyCalendar year={FullYear()} />
              </View>
            ) : calendarType === 'Week' ? (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>
                  Weekly View Coming Soon
                </Text>
              </View>
            ) : calendarType === 'Tasks' ? (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>
                  Tasks View Coming Soon
                </Text>
              </View>
            ) : (
              <View style={styles.monthCalendarContainer}>
                <TaskCalendar showDailyView={true} />
              </View>
            )}
          </View>
        ) : isAttendanceHistory ? (
          <TaskAttendanceHistory />
        ) : null}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: primaryButtonColors.backgroundColor,
          },
        ]}
        onPress={() => navigation.navigate(SCREENS.CREATETASK, {type: 'Task'})}
        activeOpacity={0.7}>
        <Entypo name="plus" size={RFPercentage(3.5)} color="#FFF" />
      </TouchableOpacity>

      <FilterBtmSheet
        ref={filterRef}
        refRBSheet={filterBottomSheetRef}
        onApplyFilters={handleFilters}
        enabledFilters={filterOptions.enabledFilters}
        fileTypes={filterOptions.fileTypes}
        statuses={filterOptions.statuses}
        labels={filterOptions.labels}
        initialFilters={activeFilters}
      />
    </View>
  );
};

export default Tasks;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      justifyContent: 'space-between',
      marginBottom: hp(3),
    },
    ScreenHeading: {
      paddingTop: hp(1.5),
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(20)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },

    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(5),
    },

    listContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(4),
      paddingTop: hp(2),
      marginTop: hp(2),
    },
    flatListContainer: {
      marginTop: hp(2),
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      padding: wp(4),
      borderRadius: wp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    TabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },
    contentContainerStyle: {
      paddingHorizontal: wp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(1),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
      width: '100%',
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(17)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
    },
    key: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    value: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    sectionContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingVertical: wp(2),
      paddingHorizontal: wp(4),
      marginVertical: wp(1.5),
      borderRadius: wp(2),
    },
    calenderBtn: {
      width: wp(20),
      height: wp(20),
      borderRadius: wp(2),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,
    },
    calenderBtnTxt: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#2C384C',
      fontSize: RFPercentage(pxToPercentage(13)),
    },
    calendarContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    year: {
      fontSize: RFPercentage(pxToPercentage(20)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    placeholderText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    monthCalendarContainer: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    loadingContainer: {
      padding: wp(4),
      paddingVertical: hp(15),
      alignItems: 'center',
    },
    loadingText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    errorContainer: {
      padding: wp(4),
      alignItems: 'center',
    },
    errorText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: '#FF6B6B',
      fontFamily: Fonts.PoppinsRegular,
      textAlign: 'center',
    },
    tabHeaderBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      marginBottom: hp(2),
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
    tabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: '#FFF',
    },
  });
