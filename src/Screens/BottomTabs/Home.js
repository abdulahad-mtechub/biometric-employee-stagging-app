import Geolocation from '@react-native-community/geolocation';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import * as Progress from 'react-native-progress';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from 'react-redux';
import { statusStyles } from '../../Constants/DummyData';
import { Fonts } from '../../Constants/Fonts';
import { SCREENS } from '../../Constants/Screens';
import {
  attendanceMonthly,
  getLastPunchDetails,
  getRemunerations,
  getRequests,
  taskStats,
  yearlyTaskList,
} from '../../Constants/api';
import { useButtonColors } from '../../Constants/colorHelper';
import { Colors } from '../../Constants/themeColors';
import { useAlert } from '../../Providers/AlertContext';
import { Images } from '../../assets/Images/Images';
import { Svgs } from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import DashboardCard from '../../components/Cards/DashboardCard';
import StatusBox from '../../components/Cards/StatusBox';
import DashboardHeader from '../../components/Header/DashboardHeader';
import UniversalCardTable from '../../components/UniversalCardTable/UniversalCardTable';
import { logout } from '../../redux/Slices/authSlice';
import { attendancePollingManager } from '../../utils/AttendancePollingManager';
import { formatSecondsToHourMin } from '../../utils/Helpers';
import { fetchButtonColors } from '../../utils/LocationHelpers';
import { pxToPercentage } from '../../utils/responsive';

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

const Home = ({navigation}) => {
  const dispatch = useDispatch();
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const styles = dynamicStyles(isDarkMode);
  const {language} = useSelector(store => store?.auth);
  const {t} = useTranslation();
  const lottieRef = useRef();
  const lottieLoaderRef = useRef();
  const lastSuccessfulStateRef = useRef('');
  const pollingIntervalRef = useRef(null);
  const lastFetchTimeRef = useRef(null);
  const [connecting, setConnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [BreakProgress, setBreakProgress] = useState(0);
  const [timerValue, setTimerValue] = useState(0);
  const timerIntervalRef = useRef(null);
  const [BreakTimer, setBreakTimer] = useState(0);
  const BreakTimerIntervalRef = useRef(null);
  const [earlyOut, setEarlyOut] = useState(false);
  const token = useSelector(state => state?.auth?.user?.token);
  const [currentActionType, setCurrentActionType] = useState('');
  const {showAlert} = useAlert();
  const [breakIn, setBreakIn] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [workStartTime, setWorkStartTime] = useState(null);
  const isUpdatingRef = useRef(false);
  const componentIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const unsubscribeRef = useRef(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hrRequestsApiData, setHrRequestsApiData] = useState([]);
  const [DashboardData, setDashboardData] = useState([]);
  const [attendanceApiData, setAttendanceApiData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingHrRequests, setLoadingHrRequests] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskStatsData, setTaskStatsData] = useState([]);
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
    if (!token) {
      dispatch(logout());
      showAlert(t('Session expired. Please log in again.'), 'error');
    }
  }, [token, dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchButtonColors();
    }, []),
  );
  const fetchMonthlyStats = async () => {
    try {
      const monthlyDataResponse = await attendanceMonthly(token);
      if (monthlyDataResponse?.data) {
        const stats = monthlyDataResponse.data;
        console.log(
          '📊 Monthly Stats:',
          JSON.stringify(monthlyDataResponse, null, 3),
        );
        const totalDays =
          stats?.statistics.total_days ?? stats?.statistics.totalDays ?? 31;
        const workingDays =
          stats?.statistics.working_days ?? stats?.statistics.workingDays ?? 4;
        const presentDays =
          stats?.statistics.present_days ?? stats?.statistics.presentDays ?? 2;
        const lateArrivals =
          stats?.statistics.late_arrivals ??
          stats?.statistics.lateArrivals ??
          0;
        const earlyOuts =
          stats?.statistics.early_outs ?? stats?.statistics.earlyOuts ?? 0;
        const totalPunches =
          stats?.statistics.total_punches ??
          stats?.statistics.totalPunches ??
          10;
        const totalWorkingHours =
          stats?.statistics.total_working_hours ??
          stats?.statistics.totalWorkingHours ??
          0.55;
        const daysWithIssues =
          stats?.statistics.days_with_issues ??
          stats?.statistics.daysWithIssues ??
          2;

        setDashboardData([
          // {
          //   title: 'Total Days',
          //   value: totalDays || '-',
          //   subText: t('Month days'),
          //   progress: 100,
          // },
          // {
          //   title: 'Working Days',
          //   value: workingDays || '-',
          //   subText: t('Scheduled days'),
          //   progress: totalDays
          //     ? Math.round((workingDays / totalDays) * 100)
          //     : 0,
          // },
          // {
          //   title: 'Present Days',
          //   value: presentDays || '-',
          //   subText: t('Days attended'),
          //   progress: workingDays
          //     ? Math.round((presentDays / workingDays) * 100)
          //     : 0,
          // },
          // {
          //   title: 'Total Punches',
          //   value: totalPunches || '-',
          //   subText: t('Clock in/out'),
          //   progress: totalPunches ? 100 : 0,
          // },
          // {
          //   title: 'Late Arrivals',
          //   value: lateArrivals || '-',
          //   subText: t('Late arrivals'),
          //   progress: workingDays
          //     ? Math.round((lateArrivals / workingDays) * 100)
          //     : 0,
          // },
          // {
          //   title: 'Early Outs',
          //   value: earlyOuts || '-',
          //   subText: t('Left early'),
          //   progress: workingDays
          //     ? Math.round((earlyOuts / workingDays) * 100)
          //     : 0,
          // },
          // {
          //   title: 'Working Hours',
          //   value: `${totalWorkingHours.toFixed(2)}h` || '-',
          //   subText: t('Total hours'),
          //   progress: workingDays ? 100 : 0,
          // },
          // {
          //   title: 'Days with Issues',
          //   value: daysWithIssues || '-',
          //   subText: t('Require review'),
          //   progress: workingDays
          //     ? Math.round((daysWithIssues / workingDays) * 100)
          //     : 0,
          // },
        ]);
      } else if (monthlyDataResponse?.error) {
        dispatch(logout());
        setDashboardData([]);
      } else {
        setDashboardData([]);
      }
    } catch (error) {
      setDashboardData([]);
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
            name: item.note || 'Remuneration',
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
      }
    } catch (error) {
    } finally {
    }
  };

  const fetchAttendanceData = async () => {
    if (!token) return;
    setLoadingAttendance(true);
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
              name: formattedDate,
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
                : 'N/A',
              checkOutTime: checkOutPunch
                ? new Date(checkOutPunch.occurred_at).toLocaleTimeString(
                    'en-US',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    },
                  )
                : 'N/A',
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
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchHrRequests = async () => {
    if (!token) return;
    setLoadingHrRequests(true);
    try {
      const response = await getRequests(token);
      if (response?.data && Array.isArray(response.data)) {
        const transformedData = response.data
          .filter(item => !item.type?.toLowerCase().includes('attendance'))
          .slice(0, 5)
          .map(item => ({
            id: item.id,
            name: item.name || 'HR Request',
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
    } finally {
      setLoadingHrRequests(false);
    }
  };
  const fetchTasks = async () => {
    if (!token) return;

    try {
      setTasksLoading(true);
      const currentYear = new Date().getFullYear();
      const from = `${currentYear}-01-01`;
      const to = `${currentYear}-12-31`;
      const response = await yearlyTaskList(from, to, token);
      const statsResponse = await taskStats(token);
     
      if (Array.isArray(response?.data?.tasks)) {
        const limitedTasks = sortTasksByRecent(response.data.tasks).slice(0, 5);
        setTasks(limitedTasks);
      }
      if (statsResponse?.data?.counters) {
        const c = statsResponse.data.counters;
        setTaskStatsData([
          {
            title: 'Assigned Tasks',
            value: c.assigned_task_until_today || 0,
            subText: t('Tasks assigned'),
          },
          {
            title: 'Pending Tasks',
            value: c.pending_task_until_today || 0,
            subText: t('Tasks pending'),
          },
          {
            title: 'Reimbursement Received',
            value: c.no_read_reimbursement_received_until_today || 0,
            subText: t('Reimbursements'),
          },
          {
            title: 'Salary Received',
            value: c.no_read_payroll_received_until_today || 0,
            subText: t('Payroll'),
          },
          {
            title: 'Total Requests',
            value: c.no_read_requests_answered_or_received_until_today || 0,
            subText: t('Requests'),
          },
          {
            title: 'Total Documents',
            value: c.no_read_received_documents_until_today || 0,
            subText: t('Documents'),
          },
          {
            title: 'Total Messages',
            value: c.no_read_received_messages_until_today || 0,
            subText: t('Messages'),
          },
          {
            title: 'Total Notifications',
            value: c.no_read_received_notifications_until_today || 0,
            subText: t('Notifications'),
          },
        ]);
      }
    } catch (error) {
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyStats();
    fetchHrRequests();
    fetchRemunerationData();
    fetchAttendanceData();
    fetchTasks();
  }, [token]);
  useFocusEffect(
    useCallback(() => {
      // Refresh cards when returning to Home (e.g. from Request Details)
      setLoadingHrRequests(true);
      setLoadingAttendance(true);
      setTasksLoading(true);
      fetchHrRequests();
      fetchAttendanceData();
      fetchTasks();
    }, [token]),
  );
  useEffect(() => {
    fetchHrRequests();
  }, [token]);

  const fetchLastPunchDetails = async (
    skipPollingDelay = false,
    isInitialFetch = false,
  ) => {
    const now = Date.now();
    if (!skipPollingDelay && now - lastFetchTimeRef.current < 8000) {
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      const response = await getLastPunchDetails(token);
      if (!response || response.error) {
        if (isInitialFetch) {
          setIsInitialLoading(false);
        }
        return;
      }

      if (response.data && response.data.records) {
        const records = response.data.records;

        if (records.length > 0) {
          const sortedRecords = records.sort(
            (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
          );

          const latestRecord = sortedRecords[0];
          const latestActionType = latestRecord.action_type;
          const expectedState = getStateFromActionType(latestActionType);

          if (
            currentActionType !== expectedState &&
            lastSuccessfulStateRef.current !== expectedState
          ) {
            lastSuccessfulStateRef.current = expectedState;
            processAPIActionType(latestActionType, latestRecord, sortedRecords);
          } else {
          }
        } else {
          if (
            currentActionType !== '' &&
            lastSuccessfulStateRef.current !== ''
          ) {
            lastSuccessfulStateRef.current = '';
            setCurrentActionType('');
            setConnecting(false);
            setBreakIn(false);
            setWorkStartTime(null);
            setBreakStartTime(null);
            setTotalBreakTime(0);
            setTimerValue(0);
          }
        }
      } else {
      }
    } catch (error) {
    } finally {
      if (isInitialFetch) {
        setIsInitialLoading(false);
      }
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

  const processAPIActionType = (
    latestActionType,
    latestRecord,
    sortedRecords,
  ) => {
    if (!latestActionType || !latestRecord || !sortedRecords) {
      return;
    }

    try {
      switch (latestActionType) {
        case 'CLOCK_IN':
          const clockInTime = new Date(latestRecord.occurred_at).getTime();
          const currentTime = Date.now();
          const elapsedTime = Math.max(0, currentTime - clockInTime);

          setCurrentActionType('CLOCKED_IN');
          setConnecting(false);
          setBreakIn(false);
          setWorkStartTime(clockInTime);
          setTimerValue(elapsedTime);
          setTotalBreakTime(0);
          setBreakTimer(0);
          setEarlyOut(false); // Reset earlyOut when clocking in

          break;

        case 'CLOCK_OUT':
          // Find the latest CLOCK_IN record to calculate work duration
          const clockInRecord = sortedRecords.find(
            record => record && record.action_type === 'CLOCK_IN',
          );
          const clockOutTime = new Date(latestRecord.occurred_at).getTime();

          let workDuration = 0;
          let calculatedBreakTime = 0;

          if (clockInRecord) {
            const clockInStart = new Date(clockInRecord.occurred_at).getTime();
            workDuration = clockOutTime - clockInStart;

            // Calculate break time from BREAK_START and BREAK_END records
            const breakRecords = sortedRecords
              .filter(
                record =>
                  record &&
                  (record.action_type === 'BREAK_START' ||
                    record.action_type === 'BREAK_END'),
              )
              .sort(
                (a, b) => new Date(a.occurred_at) - new Date(b.occurred_at),
              );

            let breakStartTime = null;
            for (const breakRecord of breakRecords) {
              if (breakRecord.action_type === 'BREAK_START') {
                breakStartTime = new Date(breakRecord.occurred_at).getTime();
              } else if (
                breakRecord.action_type === 'BREAK_END' &&
                breakStartTime
              ) {
                const breakEndTime = new Date(
                  breakRecord.occurred_at,
                ).getTime();
                calculatedBreakTime += breakEndTime - breakStartTime;
                breakStartTime = null;
              }
            }
          }

          setCurrentActionType('CLOCKED_OUT');
          setConnecting(false);
          setBreakIn(false);
          setWorkStartTime(
            clockInRecord
              ? new Date(clockInRecord.occurred_at).getTime()
              : null,
          );
          setTimerValue(workDuration);
          setTotalBreakTime(calculatedBreakTime);
          setBreakTimer(0);

          // Determine if worker left early based on work duration
          // 8 hours = 8 * 60 * 60 * 1000 = 28,800,000 ms
          // Minimum threshold: less than 1 minute = same-time check-in/out
          const workHours = workDuration / (1000 * 60 * 60);
          const isSameTimeCheckInOut = workDuration < 60000; // less than 1 minute
          setEarlyOut(workHours < 8 || isSameTimeCheckInOut);

          break;

        case 'BREAK_START':
          const workClockIn = sortedRecords.find(
            record => record && record.action_type === 'CLOCK_IN',
          );
          const breakStart = new Date(latestRecord.occurred_at).getTime();

          setCurrentActionType('BREAK_START');
          setBreakIn(true);
          setConnecting(false);
          setBreakStartTime(breakStart);

          if (workClockIn) {
            const workStartTime = new Date(workClockIn.occurred_at).getTime();
            setWorkStartTime(workStartTime);
            const workTimeUntilBreak = breakStart - workStartTime;
            setTimerValue(workTimeUntilBreak);
          }

          break;

        case 'BREAK_END':
          const endBreakTime = new Date(latestRecord.occurred_at).getTime();
          const workStart = sortedRecords.find(
            record => record && record.action_type === 'CLOCK_IN',
          );

          setCurrentActionType('CLOCKED_IN');
          setBreakIn(false);
          setConnecting(false);
          setBreakStartTime(null);
          setBreakTimer(0);
          setEarlyOut(false); // Reset earlyOut when clocking in

          if (workStart) {
            const workStartTime = new Date(workStart.occurred_at).getTime();
            setWorkStartTime(workStartTime);
            const totalTime = endBreakTime - workStartTime;
            const currentTime = Date.now();
            const additionalTime = currentTime - endBreakTime;
            setTimerValue(totalTime + additionalTime);
          }

          break;

        default:
          setCurrentActionType('');
          setConnecting(false);
          setBreakIn(false);
          setBreakTimer(0);
          break;
      }
    } catch (error) {
      console.error('❌ Error in processAPIActionType:', error);
    }
  };

  const handleAttendanceAction = actionType => {
    navigation.navigate(SCREENS.ATTENDANCEFACESCANNING, {
      onVerificationSuccess: imageUrl => {
        navigation.navigate(SCREENS.MAPSCREENATTENDANCE, {
          actionType,
          selfieUrl: imageUrl,
          onAttendanceSuccess: () => {
            updateUIForAction(actionType);
          },
        });
      },
      actionType,
    });
  };

  useEffect(() => {
    Geolocation.getCurrentPosition(info => {
      let latitude = info.coords.latitude;
      let longitude = info.coords.longitude;
    });
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (token) {
      fetchLastPunchDetails(true, true);
      const startPolling = () => {
        if (pollingIntervalRef.current) {
          return;
        }

        pollingIntervalRef.current = setInterval(() => {
          fetchLastPunchDetails();
        }, 45000);
      };

      setTimeout(() => {
        if (!pollingIntervalRef.current) {
          startPolling();
        }
      }, 45000);
    } else {
      setIsInitialLoading(false);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [token]);

  const updateUIForAction = actionType => {
    if (isUpdatingRef.current) {
      return;
    }

    isUpdatingRef.current = true;
    const currentTime = Date.now();

    switch (actionType) {
      case 'CLOCK_IN':
        setConnecting(false);
        setBreakIn(false);
        setWorkStartTime(currentTime);
        setTotalBreakTime(0);
        setTimerValue(0);
        setBreakTimer(0);
        setCurrentActionType('CLOCKED_IN');
        setEarlyOut(false); // Reset earlyOut when clocking in
        break;

      case 'BREAK_START':
        setBreakIn(true);
        setBreakStartTime(currentTime);
        setBreakTimer(0);
        setCurrentActionType('BREAK_START');
        break;

      case 'BREAK_END':
        if (breakStartTime) {
          const breakDuration = Math.floor(
            (currentTime - breakStartTime) / 1000,
          );
          const newTotalBreakTime = totalBreakTime + breakDuration * 1000;
          setTotalBreakTime(newTotalBreakTime);

          const breakMinutes = Math.floor(breakDuration / 60);
          const breakSeconds = breakDuration % 60;
          const breakMessage =
            breakMinutes > 0
              ? language === 'English'
                ? `You took ${breakMinutes} minutes ${
                    breakSeconds > 0 ? `and ${breakSeconds} seconds` : ''
                  } of break.`
                : `Tomó ${breakMinutes} minutos ${
                    breakSeconds > 0 ? `y ${breakSeconds} segundos` : ''
                  } de descanso.`
              : language === 'English'
              ? `You took ${breakSeconds} seconds of break.`
              : `Tomó ${breakSeconds} segundos de descanso.`;
          showAlert(breakMessage, 'success');
        }
        setBreakIn(false);
        setBreakStartTime(null);
        setBreakTimer(0);
        setCurrentActionType('CLOCKED_IN');
        setEarlyOut(false); // Reset earlyOut when clocking in after break
        break;

      case 'CLOCK_OUT':
        if (workStartTime) {
          const totalWorkTime = Math.floor(
            (currentTime - workStartTime) / 1000,
          );
          const actualWorkTime =
            totalWorkTime - Math.floor(totalBreakTime / 1000);

          const workHours = Math.floor(actualWorkTime / 3600);
          const workMinutes = Math.floor((actualWorkTime % 3600) / 60);

          const workMessage =
            workHours > 0
              ? `You worked for ${workHours} hours ${
                  workMinutes > 0 ? `and ${workMinutes} minutes` : ''
                } today. Thanks, see you tomorrow!`
              : `You worked for ${workMinutes} minutes today. Thanks, see you tomorrow!`;

          showAlert(workMessage, 'success');
        }

        setBreakIn(false);
        setBreakTimer(0);
        setCurrentActionType('CLOCKED_OUT');

        // Determine if worker left early based on work duration
        // 8 hours = 8 * 60 * 60 * 1000 = 28,800,000 ms
        // Minimum threshold: less than 1 minute = same-time check-in/out
        if (workStartTime) {
          const totalWorkTime = (currentTime - workStartTime) / 1000;
          const actualWorkTimeMs =
            (totalWorkTime - Math.floor(totalBreakTime / 1000)) * 1000;
          const workHours = actualWorkTimeMs / (1000 * 60 * 60);
          const isSameTimeCheckInOut = actualWorkTimeMs < 60000; // less than 1 minute
          setEarlyOut(workHours < 8 || isSameTimeCheckInOut);
        }
        break;

      default:
        break;
    }

    // Notify the polling manager
    const manualState = {
      actionType: getStateFromActionType(actionType),
      data: {
        isManualUpdate: true,
        actionType,
        timestamp: currentTime,
      },
      timestamp: currentTime,
    };

    attendancePollingManager.updateState(manualState);

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 500);
  };

  const handleSimpleAttendanceAction = async actionType => {
    // Navigate to attendance face scanning for all actions
    navigation.navigate(SCREENS.ATTENDANCEFACESCANNING, {
      onVerificationSuccess: imageUrl => {
        // Navigate to attendance map screen
        navigation.navigate(SCREENS.MAPSCREENATTENDANCE, {
          actionType,
          selfieUrl: imageUrl,
          onAttendanceSuccess: () => {
            updateUIForAction(actionType);
          },
        });
      },
      actionType, // Pass actionType param so AttendanceFaceScanning receives it
    });
  };

  const handleConnect = () => {
    handleAttendanceAction('CLOCK_IN');
  };

  const toggleTimer = () => {
    if (breakIn) {
      handleSimpleAttendanceAction('BREAK_END');
    } else {
      handleSimpleAttendanceAction('BREAK_START');
    }
  };

  const handleCheckOut = () => {
    handleSimpleAttendanceAction('CLOCK_OUT');
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

  useEffect(() => {
    if (connecting) {
      lottieRef.current?.play();
      lottieLoaderRef.current?.play();
      setProgress(0);

      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          setProgress(prev => {
            const next = Math.min(1, prev + Math.random() / 1.5);
            if (next >= 1) {
              clearInterval(interval);
              lottieRef.current?.pause();
              lottieLoaderRef.current?.pause();
              setConnecting(false);
            }
            return next;
          });
        }, 800);
      }, 1500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [connecting]);

  useEffect(() => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      BackgroundTimer.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Start work timer when clocked in and not on break
    if (currentActionType === 'CLOCKED_IN' && !breakIn && workStartTime) {
      timerIntervalRef.current = BackgroundTimer.setInterval(() => {
        const now = Date.now();
        const elapsed = now - workStartTime;
        setTimerValue(elapsed);
      }, 1000); // Update every second
    }

    return () => {
      if (timerIntervalRef.current) {
        BackgroundTimer.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentActionType, breakIn, workStartTime]);

  useEffect(() => {
    // Clear any existing break timer
    if (BreakTimerIntervalRef.current) {
      BackgroundTimer.clearInterval(BreakTimerIntervalRef.current);
      BreakTimerIntervalRef.current = null;
    }

    // Start break timer when on break
    if (currentActionType === 'BREAK_START' && breakIn && breakStartTime) {
      setBreakTimer(0);
      BreakTimerIntervalRef.current = BackgroundTimer.setInterval(() => {
        const now = Date.now();
        const breakElapsed = now - breakStartTime;
        setBreakTimer(breakElapsed);
      }, 1000); // Update every second
    } else {
      setBreakTimer(0);
    }

    return () => {
      if (BreakTimerIntervalRef.current) {
        BackgroundTimer.clearInterval(BreakTimerIntervalRef.current);
        BreakTimerIntervalRef.current = null;
      }
    };
  }, [currentActionType, breakIn, breakStartTime]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (token && !pollingIntervalRef.current) {
        fetchLastPunchDetails(true);
        pollingIntervalRef.current = setInterval(() => {
          fetchLastPunchDetails();
        }, 45000);
      }
    });

    return unsubscribe;
  }, [navigation, token]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    });

    return unsubscribe;
  }, [navigation]);

  const style = statusStyles[earlyOut ? 'Early Out' : 'On Time'];

  const handleAttendanceStateUpdate = useCallback(
    pollingState => {
      if (!pollingState.data) {
        if (currentActionType !== '') {
          setCurrentActionType('');
          setConnecting(false);
          setBreakIn(false);
          setWorkStartTime(null);
          setBreakStartTime(null);
          setTotalBreakTime(0);
          setTimerValue(0);
        }
        return;
      }

      // Add safety checks for data structure
      if (!pollingState.data.latestRecord || !pollingState.data.sortedRecords) {
        return;
      }

      // Process the state update only if it's different from current state
      const expectedState = pollingState.actionType;
      if (currentActionType !== expectedState) {
        const {latestRecord, sortedRecords} = pollingState.data;

        // Additional safety check
        if (latestRecord && latestRecord.action_type) {
          processAPIActionType(
            latestRecord.action_type,
            latestRecord,
            sortedRecords,
          );
        } else {
        }
      } else {
      }
    },
    [currentActionType],
  );

  useEffect(() => {
    if (token) {
      // Subscribe to the global polling manager
      unsubscribeRef.current = attendancePollingManager.subscribe(
        handleAttendanceStateUpdate,
        componentIdRef.current,
      );

      // Start polling (will only start if not already running)
      attendancePollingManager.startPolling(token);

      // Log status
      const status = attendancePollingManager.getStatus();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [token, handleAttendanceStateUpdate]);

  return (
    <View style={{flex: 1}}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{flexGrow: 1}}>
        <DashboardHeader navigation={navigation} />
        {/* <Image
          source={{
            uri: 'file:///data/user/0/com.biometricproworkerapp/cache/mrousavy394204382155323721.jpg',
          }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            alignSelf: 'center',
          }}
        /> */}
        <View style={[styles.requestContainer, {paddingTop: hp(1)}]}>
          <View className="rowSb">
            <Text
              style={[
                styles.sectionHeading,
                {fontSize: RFPercentage(pxToPercentage(16))},
              ]}>
              {t('Today’s Punch')}
            </Text>
            <View style={styles.todayDate}>
              <Text style={styles.dateText}>
                {moment().format('DD MMM, YY')}
              </Text>
            </View>
          </View>

          {/* Show loader while initial data is being fetched */}
          {isInitialLoading ? (
            <View style={styles.loadingContainer}>
              <LottieView
                style={styles.loadingAnimation}
                source={require('../../assets/Animations/connectingLoader.json')}
                autoPlay={true}
                loop={true}
                speed={1}
              />
              <Text style={styles.loadingText}>
                {t('Loading punch data...')}
              </Text>
            </View>
          ) : (
            <>
              {/* Existing punch UI - only show after data is loaded */}
              {connecting ? (
                <View>
                  <LottieView
                    ref={lottieRef}
                    style={styles.lottieConnectingView}
                    source={require('../../assets/Animations/checkin-RippleEffect.json')}
                    autoPlay={false}
                    loop={false}
                    speed={1}
                  />

                  <Progress.Circle
                    style={[
                      {position: 'absolute', top: hp(10.4), right: wp(20.5)},
                    ]}
                    progress={progress}
                    indeterminate={false}
                    size={157} // ⬅️ Increase this value to increase radius
                    unfilledColor="#DCE9F3"
                    borderColor="#D1D3D9"
                    borderWidth={0}
                    color="#006EC2"
                    thickness={5}
                  />

                  <TouchableOpacity
                    activeOpacity={1}
                    style={[styles.checkinBtn, styles.AnimationBtn]}>
                    {!currentActionType && (
                      <LottieView
                        ref={lottieLoaderRef}
                        style={styles.lottieloadingView}
                        source={require('../../assets/Animations/connectingLoader.json')}
                        autoPlay={false}
                        loop={false}
                        speed={1}
                      />
                    )}

                    <Text style={styles.checkin}>{t('Connecting')}</Text>
                  </TouchableOpacity>
                </View>
              ) : currentActionType === 'CLOCKED_IN' ||
                currentActionType === 'BREAK_START' ? (
                <ImageBackground
                  source={
                    currentActionType === 'BREAK_START'
                      ? Images.checkoutEarlyOut // Show break image when on break
                      : Images.connected // Show connected image when clocked in
                  }
                  style={styles.checkinImage}>
                  {breakIn && (
                    <Progress.Circle
                      style={[
                        {position: 'absolute', top: hp(4.9), right: wp(10.3)},
                      ]}
                      progress={BreakProgress}
                      indeterminate={false}
                      size={190}
                      unfilledColor="#DCE9F3"
                      borderColor="#D1D3D9"
                      borderWidth={0}
                      color="#006EC2"
                      thickness={5}
                    />
                  )}

                  <TouchableOpacity
                    activeOpacity={1}
                    style={[
                      styles.checkinBtn,
                      (currentActionType === 'CLOCKED_IN' ||
                        currentActionType === 'BREAK_START') && {
                        backgroundColor: isDarkMode
                          ? Colors.darkTheme.primaryColor
                          : Colors.lightTheme.primaryColor,
                      },
                      breakIn && {
                        backgroundColor: '#DCE9F3',
                        height: hp(22),
                        width: hp(22),
                        top: hp(5.5),
                      },
                    ]}>
                    {breakIn ? (
                      <Svgs.breakCupOutline />
                    ) : (
                      <Svgs.clockCheckinWhite />
                    )}

                    <Text
                      style={[
                        styles.checkin,
                        {color: breakIn ? '#44546F' : '#FFFFFF'},
                      ]}>
                      {breakIn
                        ? formatTimeSmooth(BreakTimer)
                        : formatTimeSmooth(timerValue)}
                    </Text>
                  </TouchableOpacity>
                </ImageBackground>
              ) : currentActionType === 'CLOCKED_OUT' ? (
                <ImageBackground
                  source={
                    earlyOut ? Images.checkoutEarlyOut : Images.checkoutOntime
                  }
                  style={styles.checkinImage}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.checkinBtn,
                      earlyOut
                        ? {backgroundColor: '#9F8FEF'}
                        : {backgroundColor: '#4BCE97'},
                    ]}
                    onPress={handleConnect}>
                    <Svgs.clockCheckinWhite />
                    <Text style={[styles.checkin, {color: '#FFFFFF'}]}>
                      {t('Clock-In')}
                    </Text>
                  </TouchableOpacity>
                </ImageBackground>
              ) : (
                <ImageBackground
                  source={Images.checkin1}
                  style={styles.checkinImage}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.checkinBtn}
                    onPress={handleConnect}>
                    <Svgs.clockCheckin />
                    <Text style={styles.checkin}>{t('Clock-In')}</Text>
                  </TouchableOpacity>
                </ImageBackground>
              )}

              {(currentActionType === 'CLOCKED_IN' ||
                currentActionType === 'BREAK_START') && (
                <View style={styles.breakBtnContainer}>
                  {!breakIn ? (
                    <>
                      <CustomButton
                        text={'Break Start'}
                        onPress={() => toggleTimer()}
                        // svg={<Svgs.breakCupFilled />}
                        textStyle={styles.breakInBtnText}
                        containerStyle={[styles.breakInBtn]}
                      />
                      <CustomButton
                        text={t('Clock Out')}
                        textStyle={styles.CheckOutBtnText}
                        containerStyle={[
                          styles.breakInBtn,
                          {backgroundColor: Colors.lightTheme.primaryColor},
                        ]}
                        onPress={() => handleCheckOut()}
                      />
                    </>
                  ) : (
                    <>
                      <CustomButton
                        text={'Stop Break'}
                        onPress={() => toggleTimer()}
                        textStyle={styles.CheckOutBtnText}
                        containerStyle={[
                          styles.breakInBtn,
                          {backgroundColor: Colors.lightTheme.primaryColor},
                        ]}
                      />
                      <CustomButton
                        text={t('Clock Out')}
                        textStyle={styles.CheckOutBtnText}
                        containerStyle={[
                          styles.breakInBtn,
                          {backgroundColor: '#FF6B6B'},
                        ]}
                        onPress={() => handleCheckOut()}
                      />
                    </>
                  )}
                </View>
              )}
              {currentActionType === 'CLOCKED_OUT' && (
                <View style={styles.checkoutDetails}>
                  <Row
                    label={'Working Hours'}
                    value={formatSecondsToHourMin(
                      Math.floor(timerValue / 1000),
                    )}
                  />
                  <Row
                    label={'Status'}
                    valueComponent={
                      <StatusBox
                        status={style.name}
                        backgroundColor={style.backgroundColor}
                        color={style.color}
                        icon={style.icon}
                      />
                    }
                  />
                  {/* <Row
                    label={'Break'}
                    value={formatSecondsToHourMin(
                      Math.floor(totalBreakTime / 1000),
                    )}
                  /> */}

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <CustomButton
                      text={t('View Details')}
                      textStyle={styles.CheckOutBtnText}
                      containerStyle={[
                        styles.breakInBtn,
                        {
                          backgroundColor: Colors.lightTheme.primaryColor,
                          width: '48%',
                          marginTop: hp(2),
                        },
                      ]}
                      contentContainer={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: wp(3.5),
                      }}
                      rightSvg={<Svgs.chevronRight />}
                      onPress={() =>
                        navigation.navigate(SCREENS.VIEWATTENDANCEDETAILS, {
                          currentWorkingHours: Math.floor(timerValue / 1000),
                          currentBreakTime: Math.floor(totalBreakTime / 1000),
                          workStartTime: workStartTime,
                          clockOutTime: Date.now(),
                          status: earlyOut ? 'Early Out' : 'On Time',
                        })
                      }
                    />
                    <CustomButton
                      text={t('Clock-In')}
                      textStyle={styles.CheckOutBtnText}
                      containerStyle={[
                        styles.breakInBtn,
                        {
                          backgroundColor: '#4BCE97',
                          width: '48%',
                          marginTop: hp(2),
                        },
                      ]}
                      contentContainer={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: wp(2),
                      }}
                      onPress={handleConnect}
                    />
                  </View>
                </View>
              )}
            </>
          )}
        </View>
        <FlatList
          data={[...taskStatsData, ...DashboardData]}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
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

        <View style={{height: hp(2)}} />
        <UniversalCardTable
          title="Recent Tasks"
          data={tasks}
          loading={tasksLoading}
          type="tasks"
          emptyMessage="No tasks available"
          onPressItem={item =>
            navigation.navigate(SCREENS.TASKDETAIL, {
              task: item,
              previousScreen: 'Home',
            })
          }
          fieldMapping={{
            customFields: {
              comments: item => `${item.comments_count || 0} comments`,
              attachments: item =>
                `${item.attachments?.length || 0} attachments`,
              location: item =>
                item.location_address ? '📍 Location' : '🌍 Remote',
            },
          }}
        />
        {/* 2. Attendance Section with Custom Styling */}
        <UniversalCardTable
          title="Monthly Attendance"
          data={attendanceApiData}
          loading={loadingAttendance}
          type="attendance"
          emptyMessage="No attendance records"
          showCount={false}
          onPressItem={item =>
            navigation.navigate(SCREENS.ATTENDENCEREQUESTDETAILS, {
              requestTypes: 'Attendance',
              item,
            })
          }
          cardStyle={{
            backgroundColor: isDarkMode ? '#2D3748' : '#F7FAFC',
          }}
        />
        <UniversalCardTable
          title={t('Recent Requests')}
          data={hrRequestsApiData}
          loading={loadingHrRequests}
          type="requests"
          emptyMessage={t('No requests available')}
          onPressItem={item =>
            navigation.navigate(SCREENS.REQUESTREQUESTDETAILS, {
              requestTypes: item.type,
              item,
            })
          }
          fieldMapping={{
            dateFormat: 'DD MMM, hh:mm A',
            customFields: {
              subject: 'subject',
              requester: item => item.assigned_by_name || t('System'),
            },
          }}
        />
      </ScrollView>
    </View>
  );
};

export default Home;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    mapImage: {
      width: wp(100),
      height: hp(40),
      marginTop: hp(2),
    },
    sectionHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    rowSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    breakBtnContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    listContainer: {
      paddingHorizontal: wp(3),
    },
    flatListContainer: {},
    requestContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      marginTop: hp(2),
      marginBottom: hp(2),
      marginHorizontal: wp(3),
    },
    ShiftsContianer: {
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,
      borderRadius: wp(3),
      marginTop: hp(0),
    },
    ChartPercentageText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.5),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    chartStatesText: {
      fontFamily: Fonts.NunitoBold,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    checkinBtn: {
      backgroundColor: '#D1D3D9',
      height: hp(21.2),
      width: hp(21.2),
      borderRadius: wp(100),
      position: 'absolute',
      top: hp(5.9),
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkin: {
      color: '#44546F',
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsSemiBold,
      marginTop: hp(1),
    },
    lottieConnectingView: {
      width: wp(155),
      height: hp(40),
      alignSelf: 'center',
    },
    lottieloadingView: {
      width: wp(20),
      height: wp(10),
      alignSelf: 'center',
    },
    checkinImage: {
      width: wp(70),
      height: wp(70),
      marginTop: hp(2),
      position: 'relative',
      alignItems: 'center',
      alignSelf: 'center',
      marginVertical: hp(2),
      resizeMode: 'contain',
    },
    AnimationBtn: {
      height: hp(18),
      width: hp(18),
      top: hp(11),
      alignSelf: 'center',
      backgroundColor: '#DCE9F3',
    },

    breakInBtn: {
      backgroundColor: '#091E420F',
      paddingVertical: hp(1.3),
      borderRadius: wp(2),
      width: wp(35),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    breakInBtnText: {
      color: '#172B4D',
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      marginLeft: wp(1.5),
      fontWeight: '700',
    },
    CheckOutBtnText: {
      color: '#ffffff',
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    checkoutDetails: {},
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.3),
      flexWrap: 'wrap',
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    valueText: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    value: {
      width: '67%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
    todayDate: {
      alignItems: 'center',
      paddingVertical: hp(1),
      paddingHorizontal: wp(4),
      borderRadius: wp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      alignSelf: 'center',
    },
    dateText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(8),
      minHeight: hp(35),
    },
    loadingAnimation: {
      width: wp(20),
      height: wp(20),
    },
    loadingText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(2),
      textAlign: 'center',
    },
    listSectionContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderTopStartRadius: wp(5),
      borderBottomLeftRadius: wp(5),
      marginTop: hp(2),
      marginBottom: hp(2),
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
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    viewAllText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    listContent: {
      // Additional styling for list content if needed
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
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    taskCard: {
      borderRadius: wp(2.5),
      paddingBottom: wp(2),
      marginVertical: hp(0.1),
      borderBottomWidth: 1,
      borderColor: isDarkMode ? Colors.darkTheme.BorderGrayColor : '#E5E7EB',
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    taskTitleContainer: {
      flex: 1,
      marginRight: wp(2),
    },
    taskTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
    },
    priorityBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: wp(1),
      borderWidth: 1,
      marginTop: hp(0.3),
    },
    priorityText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.3),
    },
    statusBadge: {
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.5),
      borderRadius: wp(1.5),
      alignSelf: 'flex-start',
    },
    statusBadgeText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.4),
    },
    taskDescription: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(1.7),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      lineHeight: RFPercentage(2.5),
      marginBottom: hp(1),
    },
    taskFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    taskDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
    },
    taskDate: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    taskCommentsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#E5E7EB',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.4),
      borderRadius: wp(1.5),
    },
    taskCommentsText: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });
