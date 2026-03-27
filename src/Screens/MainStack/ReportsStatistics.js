import {t} from 'i18next';
import React, {useEffect, useState} from 'react';
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
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import DashboardCard from '../../components/Cards/DashboardCard';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import StackHeader from '../../components/Header/StackHeader';
import {
  attendanceMonthly,
  getLastPunchDetails,
  getRemunerations,
  getRequests,
  taskStats,
  yearlyTaskList,
} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';

const ReportsStatistics = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const token = useSelector(state => state?.auth?.user?.token);
  const userData = useSelector(state => state?.auth?.user?.worker);

  const [dashboardData, setDashboardData] = useState([]);
  const [hrRequestsApiData, setHrRequestsApiData] = useState([]);
  const [remunerationApiData, setRemunerationApiData] = useState([]);
  const [attendanceApiData, setAttendanceApiData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStatsData, setTaskStatsData] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Punch state data
  const [currentActionType, setCurrentActionType] = useState('');
  const [timerValue, setTimerValue] = useState(0);
  const [BreakTimer, setBreakTimer] = useState(0);
  const [breakIn, setBreakIn] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchMonthlyStats(),
        fetchHrRequests(),
        fetchRemunerationData(),
        fetchAttendanceData(),
        fetchLastPunchDetails(),
        fetchTasks(),
      ]);
    } catch (error) {
      console.log('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const monthlyDataResponse = await attendanceMonthly(token);
      if (monthlyDataResponse?.data) {
        const stats = monthlyDataResponse.data;

        const totalDays =
          stats?.statistics.total_days ?? stats?.statistics.totalDays ?? 0;
        const presentDays =
          stats?.statistics.present_days ?? stats?.statistics.presentDays ?? 0;
        const absentDays =
          stats?.statistics.absent_days ?? stats?.statistics.absentDays ?? 0;
        const lateMarks =
          stats?.statistics.late_marks ?? stats?.statistics.lateMarks ?? 0;
        const totalHours =
          stats?.statistics.total_hours ?? stats?.statistics.totalHours ?? 0;

        setDashboardData([
          {
            title: t('Total Days'),
            value: totalDays || '-',
            subText: t('Working days'),
            progress: 100,
          },
          {
            title: t('Present Days'),
            value: presentDays || '-',
            subText: t('Days attended'),
            progress: totalDays
              ? Math.round((presentDays / totalDays) * 100)
              : 0,
          },
          {
            title: t('Absent Days'),
            value: absentDays || '-',
            subText: t('Days missed'),
            progress: totalDays
              ? Math.round((absentDays / totalDays) * 100)
              : 0,
          },
          {
            title: t('Late Marks'),
            value: lateMarks || '-',
            subText: t('Late arrivals'),
            progress: totalDays ? Math.round((lateMarks / totalDays) * 100) : 0,
          },
          {
            title: t('Total Hours'),
            value: totalHours || '-',
            subText: t('Worked hours'),
            progress: totalDays ? 100 : 0,
          },
        ]);
      }
    } catch (error) {
      console.log('Error fetching monthly stats:', error);
    }
  };

  const fetchRemunerationData = async () => {
    if (!token) return;
    try {
      const response = await getRemunerations(token);
      if (response?.data && Array.isArray(response.data)) {
        const transformedData = response.data.slice(0, 5).map(item => {
          const recordDate = new Date(item.paid_at);
          const day = String(recordDate.getDate()).padStart(2, '0');
          const month = String(recordDate.getMonth() + 1).padStart(2, '0');
          const year = recordDate.getFullYear();
          const formattedDate = `${day}-${month}-${year}`;

          return {
            id: item.id,
            name: item.note || t('Remuneration'),
            date: formattedDate,
            time: new Date(item.paid_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            status: item.status,
            amount: `${item.amount} ${item.currency}`,
            type: 'remuneration',
            ...item,
          };
        });
        setRemunerationApiData(transformedData);
      }
    } catch (error) {
      console.log('Error fetching remuneration data:', error);
    }
  };

  const fetchAttendanceData = async () => {
    if (!token) return;
    try {
      const response = await attendanceMonthly(token);
      if (
        response?.data &&
        response.data.records &&
        Array.isArray(response.data.records)
      ) {
        const attendanceData = response.data.records
          .filter(
            record =>
              record.punches &&
              record.punches.length > 0 &&
              record.status !== 'Absent',
          )
          .slice(0, 5)
          .map(record => {
            const recordDate = new Date(record.date);
            const day = String(recordDate.getDate()).padStart(2, '0');
            const month = String(recordDate.getMonth() + 1).padStart(2, '0');
            const year = recordDate.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;

            const checkInPunch = record.punches.find(
              punch => punch.action_type === 'CLOCK_IN',
            );
            const checkOutPunch = record.punches.find(
              punch => punch.action_type === 'CLOCK_OUT',
            );

            return {
              id: record.punches[0]?.id || `record-${recordDate.getTime()}`,
              name: t('Attendance Record'),
              date: formattedDate,
              checkInTime: checkInPunch
                ? new Date(checkInPunch.occurred_at).toLocaleTimeString(
                    'en-US',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    },
                  )
                : t('N/A'),
              checkOutTime: checkOutPunch
                ? new Date(checkOutPunch.occurred_at).toLocaleTimeString(
                    'en-US',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    },
                  )
                : t('N/A'),
              firstCheckIn: record.first_check_in,
              lastCheckOut: record.last_check_out,
              workingHours: record.working_hours,
              status: record.status,
              totalPunches: record.total_punches,
              type: 'attendance',
              punches: record.punches,
              ...record,
            };
          });

        setAttendanceApiData(attendanceData);
      }
    } catch (error) {
      console.log('Error fetching attendance data:', error);
    }
  };

  const fetchHrRequests = async () => {
    if (!token) return;
    try {
      const response = await getRequests(token);
      if (response?.data && Array.isArray(response.data)) {
        const transformedData = response.data
          .filter(item => !item.type?.toLowerCase().includes('attendance'))
          .slice(0, 5)
          .map(item => ({
            id: item.id,
            name: item.name || t('HR Request'),
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
        setHrRequestsApiData(transformedData);
      }
    } catch (error) {
      console.log('Error fetching HR requests:', error);
    }
  };

  const fetchTasks = async () => {
    if (!token) return;

    try {
      setTasksLoading(true);
      setTasksError(null);

      const currentYear = new Date().getFullYear();
      const from = `${currentYear}-01-01`;
      const to = `${currentYear}-12-31`;

      const response = await yearlyTaskList(from, to, token);
      const statsResponse = await taskStats(token);

      if (response?.data?.tasks) {
        const limitedTasks = response.data.tasks.slice(0, 5);
        setTasks(limitedTasks);
      }

      if (statsResponse?.data?.counters) {
        const c = statsResponse.data.counters;
        setTaskStatsData([
          {
            title: t('Assigned'),
            value: c.assigned,
            subText: t('Tasks assigned'),
          },
          {
            title: t('In Progress'),
            value: c.in_progress,
            subText: t('Active tasks'),
          },
          {
            title: t('Completed'),
            value: c.completed,
            subText: t('Done tasks'),
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasksError(error.message || t('Failed to fetch tasks'));
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchLastPunchDetails = async () => {
    if (!token) return;
    try {
      const response = await getLastPunchDetails(token);
      if (response.data && response.data.records) {
        const records = response.data.records;
        if (records.length > 0) {
          const sortedRecords = records.sort(
            (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
          );
          const latestRecord = sortedRecords[0];
          const latestActionType = latestRecord.action_type;

          setCurrentActionType(getStateFromActionType(latestActionType));

          if (latestActionType === 'CLOCK_IN') {
            const clockInTime = new Date(latestRecord.occurred_at).getTime();
            const currentTime = Date.now();
            const elapsedTime = Math.max(0, currentTime - clockInTime);
            setTimerValue(elapsedTime);
          }
        }
      }
    } catch (error) {
      console.log('Error fetching last punch details:', error);
    }
  };

  const getStateFromActionType = actionType => {
    switch (actionType) {
      case 'CLOCK_IN':
        return 'CLOCKED_IN';
      case 'CLOCK_OUT':
        return 'CLOCKED_OUT';
      case 'BREAK_START':
        return 'BREAK_START';
      case 'BREAK_END':
        return 'BREAK_END';
      default:
        return '';
    }
  };

  const formatTimeSmooth = milliseconds => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const ListSection = ({title, data, loading, onViewAll, type}) => {
    if (!loading && (!data || data.length === 0)) {
      return (
        <View style={styles.listSectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={onViewAll}>
              <Svgs.ChevronFilled />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('No {{type}} data available', {type: type})}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.listSectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity onPress={onViewAll}>
            <Svgs.ChevronFilled />
          </TouchableOpacity>
        </View>
        <View style={[styles.rowSb, styles.workerStatusContainer]}>
          <Text style={styles.SubHeading}>
            {type === 'attendance' ? t('From - To') : t('Name')}
          </Text>
          <Text style={styles.SubHeading}>{t('Date')}</Text>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('Loading...')}</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {data.map((item, index) => (
              <WorkerStatus
                key={item.id || index.toString()}
                name={item.name}
                status={item.status}
                date={item.date}
                time={item.checkInTime + '-' + item.checkOutTime}
                amount={item.amount}
                type={type}
                onPress={() => {
                  if (type === 'remuneration') {
                    navigation.navigate(SCREENS.REMUNERATIONREQUESTDETAILS, {
                      requestTypes: 'Remuneration',
                      item,
                    });
                  } else if (type === 'attendance') {
                    navigation.navigate(SCREENS.ATTENDENCEREQUESTDETAILS, {
                      requestTypes: 'Attendance',
                      item,
                    });
                  } else {
                    navigation.navigate(SCREENS.REQUESTREQUESTDETAILS, {
                      requestTypes: item.type,
                      item,
                    });
                  }
                }}
                containerStyle={styles.listItem}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const TaskListSection = ({title, data, loading, onViewAll}) => {
    if (!loading && (!data || data.length === 0)) {
      return (
        <View style={styles.listSectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={onViewAll}>
              <Svgs.ChevronFilled />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('No tasks available')}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.listSectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity onPress={onViewAll}>
            <Svgs.ChevronFilled />
          </TouchableOpacity>
        </View>

        <View style={[styles.rowSb, styles.workerStatusContainer]}>
          <Text style={styles.SubHeading}>{t('Task Name')}</Text>
          <Text style={styles.SubHeading}>{t('Status')}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('Loading tasks...')}</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {data.map((item, index) => {
              const formattedItem = {
                ...item,
                id: item.id || `TASK-${index + 1}`,
                title: item.title || `TASK-${index + 1}`,
                date:
                  item.date ||
                  item.task_date ||
                  item.created_at?.split('T')[0] ||
                  new Date().toISOString().split('T')[0],
                status: item.status,
              };
              return (
                <WorkerStatus
                  key={item.id || index.toString()}
                  name={formattedItem.title}
                  status={formattedItem.status}
                  date={formattedItem.date}
                  type={'task'}
                  onPress={() => {
                    navigation.navigate(SCREENS.TASKDETAIL, {
                      task: formattedItem,
                    });
                  }}
                  containerStyle={styles.listItem}
                />
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const Row = ({label, value, valueComponent}) => {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{t(label)}</Text>
        {valueComponent ? (
          <View style={styles.value}>{valueComponent}</View>
        ) : (
          <Text style={styles.valueText}>{value}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Reports & Statistics')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.2),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{
          paddingVertical: hp(2),
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : Colors.lightTheme.backgroundColor,
        }}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Monthly Statistics Section with Dashboard Cards */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('Monthly Statistics')}</Text>
          </View>
          <FlatList
            data={[...taskStatsData, ...dashboardData]}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            renderItem={({item}) => (
              <DashboardCard
                title={item.title}
                value={item.value}
                subText={item.subText}
                progress={item.progress}
                compact={true}
              />
            )}
          />
        </View>

        <TaskListSection
          title={t('Recent Tasks')}
          data={tasks}
          loading={tasksLoading}
          onViewAll={() => navigation.navigate(SCREENS.TASKS)}
        />

        {/* Remuneration Section */}
        <ListSection
          title={t('Recent Remuneration')}
          data={remunerationApiData}
          loading={loading}
          type="remuneration"
          onViewAll={() =>
            navigation.navigate(SCREENS.REQUESTMANAGEMENT, {
              initialTab: 'Remuneration',
            })
          }
        />

        {/* Attendance Section */}
        <ListSection
          title={t('Recent Attendance')}
          data={attendanceApiData}
          loading={loading}
          type="attendance"
          onViewAll={() =>
            navigation.navigate(SCREENS.REQUESTMANAGEMENT, {
              initialTab: 'Attendance',
            })
          }
        />

        {/* Requests Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('Recent Requests')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(SCREENS.REQUESTMANAGEMENT)}>
              <Svgs.ChevronFilled />
            </TouchableOpacity>
          </View>
          <View style={[styles.rowSb, styles.workerStatusContainer]}>
            <Text style={styles.SubHeading}>{t('Request Name')}</Text>
            <Text style={styles.SubHeading}>{t('Status')}</Text>
          </View>
          {hrRequestsApiData.map((item, index) => (
            <WorkerStatus
              key={index.toString()}
              name={item.type}
              status={item.status}
              type={'request'}
              onPress={() => {
                navigation.navigate(SCREENS.REQUESTREQUESTDETAILS, {
                  requestType: item.type,
                  item,
                });
              }}
            />
          ))}
        </View>

        {/* Upcoming Schedules */}
        {/* <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('Upcoming Schedules')}</Text>
          </View>
          <FlatList
            data={remindersData}
            horizontal
            keyExtractor={item => item.id}
            renderItem={({item}) => <ReminderCard {...item} compact={true} />}
            contentContainerStyle={styles.remindersContainer}
            showsHorizontalScrollIndicator={false}
          />
        </View> */}
      </ScrollView>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    scrollContent: {
      paddingBottom: hp(12),
    },
    headerSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(5),
      marginTop: hp(2),
      borderRadius: wp(3),
    },
    userInfo: {
      flex: 1,
    },
    greetingText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    nameText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(0.5),
    },
    dateContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      borderRadius: wp(2),
    },
    dateText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: Colors.lightTheme.backgroundColor,
    },
    sectionContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      marginTop: hp(2),
      marginHorizontal: wp(5),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    punchStatusContainer: {
      padding: wp(4),
      borderRadius: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    activePunchStatus: {
      alignItems: 'center',
    },
    completedPunchStatus: {
      alignItems: 'center',
    },
    pendingPunchStatus: {
      alignItems: 'center',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    statusDot: {
      width: wp(2),
      height: wp(2),
      borderRadius: wp(1),
      marginRight: wp(2),
    },
    activeDot: {
      backgroundColor: '#4BCE97',
    },
    completedDot: {
      backgroundColor: '#006EC2',
    },
    pendingDot: {
      backgroundColor: '#FF6B6B',
    },
    statusText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    timerText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(20)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginVertical: hp(0.5),
    },
    breakText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    pendingText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    cardsContainer: {
      paddingHorizontal: wp(1),
    },
    remindersContainer: {
      paddingHorizontal: wp(1),
    },
    listSectionContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      marginTop: hp(2),
      marginHorizontal: wp(5),
    },
    rowSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    workerStatusContainer: {
      marginBottom: hp(1),
      paddingHorizontal: wp(2),
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    listContent: {
      // Additional styling for list content
    },
    listItem: {
      marginVertical: hp(0.5),
    },
    loadingContainer: {
      padding: hp(2),
      alignItems: 'center',
    },
    loadingText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    emptyContainer: {
      padding: hp(3),
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.5),
    },
    label: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    valueText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    value: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
  });

export default ReportsStatistics;
