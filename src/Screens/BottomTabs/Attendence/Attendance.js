import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
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
import {Svgs} from '../../../assets/Svgs/Svgs';
import AttendanceListCard from '../../../components/Cards/AttendanceListCard';
import UnifiedExportComponent from '../../../components/ExportComponent/UnifiedExportComponent';
import MapComponent from '../../../components/Maps/LeafLetMap';
import {attendanceMonthly, getLastPunchDetails} from '../../../Constants/api';
import {useButtonColors} from '../../../Constants/colorHelper';
import {Fonts} from '../../../Constants/Fonts';
import {SCREENS} from '../../../Constants/Screens';
import {Colors} from '../../../Constants/themeColors';
import {pxToPercentage} from '../../../utils/responsive';

const TodaysPunch = ({navigation, attendanceData}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const [initialMarkers, setInitialMarkers] = useState([]);
  const mapRef = useRef(null);
  const token = useSelector(state => state?.auth?.user?.token);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyAttendance, setmonthlyAttendance] = useState([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [selectedDateFrom, setSelectedDateFrom] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [mapCenter, setMapCenter] = useState({lat: 40.7128, lng: -74.006});
  const [mapZoom, setMapZoom] = useState(13);
  const {language} = useSelector(store => store?.auth);
  const [scroll, setScroll] = useState(true);
  const languageCode = language === 'Español' ? 'es' : 'en';
  const fetchAttendanceData = useCallback(
    async (filters = {}) => {
      try {
        const apiFilters = {};

        // Handle month filter directly
        if (filters.month) {
          apiFilters.month = filters.month;
        }

        if (filters.dateFrom) {
          apiFilters.dateFrom = filters.dateFrom;
        }
        if (filters.dateTo) {
          apiFilters.dateTo = filters.dateTo;
        }

        // Add timezone parameter
        const userTimezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        apiFilters.tz = userTimezone;

        const response = await attendanceMonthly(token, apiFilters);
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
            .map(record => {
              console.log('record', JSON.stringify(record, null, 3));
              const recordDate = new Date(record.date);
              const day = String(recordDate.getDate()).padStart(2, '0');
              const month = String(recordDate.getMonth() + 1).padStart(2, '0');
              const year = recordDate.getFullYear();
              const formattedDate = `${day}-${month}-${year}`;

              const convertUtcToLocal = (timeString, userTimezone) => {
                if (!timeString) return t('N/A');
                // API returns UTC times, convert to user's timezone
                try {
                  const [hours, minutes, seconds] = timeString
                    .split(':')
                    .map(Number);
                  const now = new Date();
                  // Create UTC date from the time components
                  const utcDate = new Date(
                    Date.UTC(
                      now.getUTCFullYear(),
                      now.getUTCMonth(),
                      now.getUTCDate(),
                      hours,
                      minutes,
                      seconds || 0,
                    ),
                  );
                  // Format to local timezone using JavaScript's built-in methods
                  const tz = userTimezone || 'UTC';
                  const localTimeStr = utcDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZone: tz,
                  });
                  // Parse the result back to HH:mm:ss format
                  const [lh, lm, ls] = localTimeStr.split(':');
                  return `${String(lh).padStart(2, '0')}:${String(lm).padStart(
                    2,
                    '0',
                  )}:${String(ls || 0).padStart(2, '0')}`;
                } catch (e) {
                  return timeString;
                }
              };

              const formatApiTime = timeString => {
                if (!timeString) return t('N/A');
                const localTimeString = convertUtcToLocal(
                  timeString,
                  userTimezone,
                );
                const parts = localTimeString.split(':');
                const hh = parseInt(parts[0], 10);
                const mm = parts[1] || '00';
                const ampm = hh >= 12 ? t('PM') : t('AM');
                const displayHour = hh % 12 || 12;
                return `${displayHour}:${mm} ${ampm}`;
              };

              const punchesWithTimes = (record.punches || []).filter(
                p => p.punch_time || p.occurred_at,
              );
              let earliestPunch = null;
              let latestPunch = null;
              if (punchesWithTimes.length > 0) {
                const sorted = punchesWithTimes.slice().sort((a, b) => {
                  const ta = a.occurred_at
                    ? new Date(a.occurred_at).getTime()
                    : 0;
                  const tb = b.occurred_at
                    ? new Date(b.occurred_at).getTime()
                    : 0;
                  return ta - tb;
                });
                earliestPunch = sorted[0];
                latestPunch = sorted[sorted.length - 1];
              }
              console.log(
                'Fetched monthly attendance records:',
                (latestPunch && latestPunch.punch_time) ||
                  (record.last_check_out &&
                    convertUtcToLocal(record.last_check_out, userTimezone)) ||
                  null,
              );
              return {
                id: record.punches[0]?.id || `record-${recordDate.getTime()}`,
                name: t('Attendance Record'),
                date: formattedDate,
                checkInTime:
                  earliestPunch && earliestPunch.punch_time
                    ? formatApiTime(earliestPunch.punch_time)
                    : record.first_check_in
                    ? formatApiTime(record.first_check_in)
                    : t('N/A'),
                checkOutTime: record.last_check_out
                  ? formatApiTime(record.last_check_out)
                  : (() => {
                      // Find the latest non-break punch (CLOCK_IN or CLOCK_OUT)
                      const nonBreakPunches = punchesWithTimes.filter(
                        p =>
                          p.action_type === 'CLOCK_IN' ||
                          p.action_type === 'CLOCK_OUT',
                      );
                      if (nonBreakPunches.length > 1) {
                        const sorted = nonBreakPunches.slice().sort((a, b) => {
                          const ta = a.occurred_at
                            ? new Date(a.occurred_at).getTime()
                            : 0;
                          const tb = b.occurred_at
                            ? new Date(b.occurred_at).getTime()
                            : 0;
                          return ta - tb;
                        });
                        const lastClockPunch =
                          sorted[sorted.length - 1];
                        return lastClockPunch && lastClockPunch.punch_time
                          ? formatApiTime(lastClockPunch.punch_time)
                          : t('N/A');
                      }
                      return t('N/A');
                    })(),
                firstCheckIn:
                  (earliestPunch && earliestPunch.punch_time) ||
                  (record.first_check_in &&
                    convertUtcToLocal(record.first_check_in, userTimezone)) ||
                  null,
                lastCheckOut:
                  (latestPunch && latestPunch.punch_time) ||
                  (record.last_check_out &&
                    convertUtcToLocal(record.last_check_out, userTimezone)) ||
                  null,
                workingHours: record.working_hours,
                status: record.status,
                totalPunches: record.total_punches,
                type: 'attendance',
                punches: record.punches,
                ...record,
              };
            });

          setmonthlyAttendance(attendanceData);
        } else {
          setmonthlyAttendance([]);
        }
      } catch (error) {
        // logging removed
      } finally {
        setLoading(false);
      }
    },
    [token, t],
  );

  const handleMonthSelect = useCallback(
    async (monthValue, monthLabel) => {
      setSelectedMonth(monthLabel);
      setSelectedDateFrom(monthValue);
      setFiltersApplied(true);
      setShowMonthPicker(false);

      await fetchAttendanceData({
        month: monthValue,
      });
    },
    [fetchAttendanceData],
  );

  const clearFilters = useCallback(async () => {
    setFiltersApplied(false);
    setSelectedDateFrom(null);
    setSelectedMonth(null);

    await fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Calculate map bounds to fit all markers
  const calculateMapBounds = useCallback(markers => {
    if (!markers || markers.length === 0) {
      return null;
    }

    // Get all latitudes and longitudes
    const lats = markers.map(m => m.lat);
    const lngs = markers.map(m => m.lng);

    // Find min and max
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate span/delta
    const latDelta = maxLat - minLat;
    const lngDelta = maxLng - minLng;

    // Add padding (20% on each side)
    const paddedLatDelta = latDelta * 1.4;
    const paddedLngDelta = lngDelta * 1.4;

    let zoom = 13;
    if (markers.length === 1) {
      zoom = 15;
    } else {
      const maxDelta = Math.max(paddedLatDelta, paddedLngDelta);

      if (maxDelta > 10) zoom = 5;
      else if (maxDelta > 5) zoom = 6;
      else if (maxDelta > 2) zoom = 7;
      else if (maxDelta > 1) zoom = 8;
      else if (maxDelta > 0.5) zoom = 9;
      else if (maxDelta > 0.25) zoom = 10;
      else if (maxDelta > 0.1) zoom = 11;
      else if (maxDelta > 0.05) zoom = 12;
      else if (maxDelta > 0.01) zoom = 13;
      else if (maxDelta > 0.005) zoom = 14;
      else zoom = 15;
    }

    return {
      bounds: {
        minLat,
        maxLat,
        minLng,
        maxLng,
      },
      center: {
        lat: centerLat,
        lng: centerLng,
      },
      zoom,
      latDelta: paddedLatDelta,
      lngDelta: paddedLngDelta,
    };
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [token]);

  useEffect(() => {
    if (attendanceData && attendanceData.records) {
      const today = new Date().toDateString();
      const todayRecord = attendanceData.records.find(
        record => new Date(record.date).toDateString() === today,
      );
      setTodayData(todayRecord);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [attendanceData]);

  useEffect(() => {
    if (todayData && todayData.punches && todayData.punches.length > 0) {
      const markers = transformTodayPunchesToMarkers(todayData.punches);

      if (markers.length > 0) {
        setInitialMarkers(markers);

        const bounds = calculateMapBounds(markers);
        if (bounds) {
          setMapCenter(bounds.center);
          setMapZoom(bounds.zoom);

          if (mapRef.current && mapRef.current.fitBounds) {
            try {
              mapRef.current.fitBounds([
                [bounds.bounds.minLat, bounds.bounds.minLng],
                [bounds.bounds.maxLat, bounds.bounds.maxLng],
              ]);
            } catch (error) {
              // logging removed
            }
          }
        }
      } else {
        // logging removed
      }
    } else {
      setInitialMarkers([]);
    }
  }, [todayData, calculateMapBounds]);

  const transformTodayPunchesToMarkers = useCallback(punches => {
    if (!punches || punches.length === 0) {
      return [];
    }

    const markers = [];
    const punchColorMap = {
      CLOCK_IN: '#2196F3',
      CLOCK_OUT: '#F44336',
      BREAK_START: '#9C27B0',
      BREAK_END: '#4CAF50',
    };

    const punchIconMap = {
      CLOCK_IN: 'login',
      CLOCK_OUT: 'log-out',
      BREAK_START: 'cup',
      BREAK_END: 'check',
    };

    punches.forEach((punch, punchIndex) => {
      if (
        punch.location &&
        punch.location.gps_latitude &&
        punch.location.gps_longitude
      ) {
        const actionType = punch.action_type;
        const formattedDate = new Date(punch.occurred_at).toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          },
        );

        const formatPunchTime = timeString => {
          if (!timeString) return '--:--';
          const [hours, minutes] = timeString.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? t('PM') : t('AM');
          const formattedHour = hour % 12 || 12;
          return `${formattedHour}:${minutes} ${ampm}`;
        };

        const marker = {
          lat: parseFloat(punch.location.gps_latitude),
          lng: parseFloat(punch.location.gps_longitude),
          title: `${actionType.replace(/_/g, ' ')}`,
          subtitle: `${formatPunchTime(punch.punch_time)} - ${formattedDate}`,
          id: punch.id,
          actionType: actionType,
          time: punch.punch_time,
          date: punch.punch_date,
          color: punchColorMap[actionType] || '#757575',
          icon: punchIconMap[actionType] || 'location',
          accuracy: punch.location.gps_accuracy,
          status: punch.verification.punch_status,
          distance: punch.location.distance_from_office,
          locationValidated: punch.location.location_validated,
          faceMatched: punch.verification.face_matched,
          type: actionType,
        };

        markers.push(marker);
      } else {
        // logging removed for missing location
      }
    });

    return markers;
  }, []);

  const transformPunchDataToMarkers = useCallback(responseData => {
    if (
      !responseData?.data?.records ||
      responseData.data.records.length === 0
    ) {
      return [];
    }

    const markers = [];
    const punchColorMap = {
      CLOCK_IN: '#2196F3',
      CLOCK_OUT: '#F44336',
      BREAK_START: '#9C27B0',
      BREAK_END: '#4CAF50',
    };

    const punchIconMap = {
      CLOCK_IN: 'login',
      CLOCK_OUT: 'log-out',
      BREAK_START: 'cup',
      BREAK_END: 'check',
    };

    const coordinateMap = new Map();
    responseData.data.records.forEach((record, index) => {
      if (
        record.locationData?.gps?.latitude &&
        record.locationData?.gps?.longitude
      ) {
        const actionType = record.actionType;
        const formattedDate = new Date(record.occurredAt).toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          },
        );

        const formatPunchTime = timeString => {
          if (!timeString) return '--:--';
          const [hours, minutes] = timeString.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? t('PM') : t('AM');
          const formattedHour = hour % 12 || 12;
          return `${formattedHour}:${minutes} ${ampm}`;
        };

        let lat = parseFloat(record.locationData.gps.latitude);
        let lng = parseFloat(record.locationData.gps.longitude);

        const coordKey = `${lat},${lng}`;
        if (coordinateMap.has(coordKey)) {
          const offsetCount = coordinateMap.get(coordKey);
          lat += offsetCount * 0.0001;
          lng += offsetCount * 0.0001;
          coordinateMap.set(coordKey, offsetCount + 1);
        } else {
          coordinateMap.set(coordKey, 1);
        }

        const marker = {
          lat: lat,
          lng: lng,
          title: `${actionType.replace(/_/g, ' ')}`,
          subtitle: `${formatPunchTime(
            record.timeData.time,
          )} - ${formattedDate}`,
          id: record.punchId || record.id,
          actionType: actionType,
          time: record.timeData.time,
          date: record.timeData.date,
          color: punchColorMap[actionType] || '#757575',
          icon: punchIconMap[actionType] || 'location',
          accuracy: record.locationData.gps.accuracy,
          status: record.validation.overallStatus,
          reviewStatus: record.validation.reviewStatus,
          locationValidated: record.location_validated,
          faceMatched: record.face_matched,
          type: actionType,
          address: record.locationData.textDescription,
        };

        markers.push(marker);
      } else {
        // logging removed for missing location
      }
    });

    return markers;
  }, []);

  const fetchLastPunchDetails = useCallback(
    async (dateFrom = null) => {
      try {
        setLoading(true);
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await getLastPunchDetails(
          token,
          dateFrom,
          userTimezone,
        );
        const markers = transformPunchDataToMarkers(response);

        if (markers.length > 0) {
          setInitialMarkers(markers);

          const bounds = calculateMapBounds(markers);
          if (bounds) {
            setMapCenter(bounds.center);
            setMapZoom(bounds.zoom);
          }

          if (response.data?.records) {
            const deriveUtcTime = isoString => {
              if (!isoString) return null;
              try {
                const d = new Date(isoString);
                const hh = String(d.getUTCHours()).padStart(2, '0');
                const mm = String(d.getUTCMinutes()).padStart(2, '0');
                const ss = String(d.getUTCSeconds()).padStart(2, '0');
                return `${hh}:${mm}:${ss}`;
              } catch (e) {
                return null;
              }
            };

            const todayRecord = {
              date: response.data.date,
              punches: response.data.records.map(record => ({
                id: record.punchId || record.id,
                action_type: record.actionType,
                // Prefer timeData.time (already in local timezone) over UTC-derived time.
                // The API provides timeData.time formatted for the user's timezone.
                punch_time:
                  record.timeData?.time ||
                  deriveUtcTime(record.occurredAt) ||
                  null,
                punch_date: record.timeData.date,
                occurred_at: record.occurredAt,
                location: {
                  gps_latitude: record.locationData?.gps?.latitude,
                  gps_longitude: record.locationData?.gps?.longitude,
                  gps_accuracy: record.locationData?.gps?.accuracy,
                  distance_from_office:
                    record.locationData?.distanceAnalysis?.fromOffice?.distance,
                  location_validated: record.location_validated,
                },
                verification: {
                  punch_status: record.validation.overallStatus,
                  face_matched: record.face_matched,
                },
              })),
              working_hours:
                response.data.dailySummary?.workingHours?.hours || 0,
              break_time_minutes: 0,
              total_punches: response.data.dailySummary?.totalPunches || 0,
              status:
                response.data.dailySummary?.totalPunches > 0
                  ? 'Present'
                  : 'Absent',
              // Use timeData.time (already in local timezone) for first/last punch.
              // The API provides times formatted for the user's timezone.
              first_check_in:
                response.data.dailySummary?.firstPunch?.timeData?.time ||
                deriveUtcTime(
                  response.data.dailySummary?.firstPunch?.timeData?.occurredAt,
                ),
              last_check_out:
                response.data.dailySummary?.lastPunch?.timeData?.time ||
                deriveUtcTime(
                  response.data.dailySummary?.lastPunch?.timeData?.occurredAt,
                ),
            };

            setTodayData(todayRecord);
          }
        } else {
          setInitialMarkers([]);
          setTodayData(null);
        }
      } catch (error) {
        // logging removed
      } finally {
        setLoading(false);
      }
    },
    [token, transformPunchDataToMarkers, calculateMapBounds],
  );

  useEffect(() => {
    if (token) {
      fetchLastPunchDetails(selectedDateFrom);
    }
  }, [token, selectedDateFrom]);

  const formatTime = timeString => {
    if (!timeString) return '--:--';

    const [hours, minutes, seconds] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? t('PM') : t('AM');
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatWorkingHours = hours => {
    if (!hours && hours !== 0) return `0${t('h')} 0${t('m')}`;

    const totalMinutes = hours * 60;
    const workHours = Math.floor(totalMinutes / 60);
    const workMinutes = Math.round(totalMinutes % 60);

    return `${workHours}${t('h')} ${workMinutes}${t('m')}`;
  };

  const formatBreakTime = minutes => {
    if (!minutes) return `0${t('m')}`;

    const breakHours = Math.floor(minutes / 60);
    const breakMinutes = minutes % 60;

    if (breakHours > 0) {
      return `${breakHours}${t('h')} ${breakMinutes}${t('m')}`;
    }
    return `${breakMinutes}${t('m')}`;
  };

  const getColumnConfig = () => {
    return [
      {key: 'date', label: t('Date')},
      {key: 'checkInTime', label: t('Clock In')},
      {key: 'checkOutTime', label: t('Clock Out')},
      {key: 'workingHours', label: t('Working Hours')},
      {key: 'status', label: t('Status')},
      {key: 'totalPunches', label: t('Total Punches')},
    ];
  };

  const getExportData = () => {
    return monthlyAttendance.map(item => ({
      date: item.date,
      checkInTime: item.checkInTime,
      checkOutTime: item.checkOutTime,
      workingHours: formatWorkingHours(item.workingHours),
      status: item.status,
      totalPunches: item.totalPunches,
    }));
  };

  const getExportTitle = () => {
    const baseTitle = t('Attendance Export');
    if (filtersApplied) {
      return `${baseTitle} (${t('Filtered')})`;
    }
    return baseTitle;
  };

  const getExportFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = filtersApplied ? '-filtered' : '';
    return `attendance-export-${timestamp}${filterSuffix}`;
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator
        size="large"
        color={
          isDarkMode
            ? Colors.darkTheme.primaryColor
            : Colors.lightTheme.primaryColor
        }
      />
      <Text style={styles.loadingText}>{t("Loading today's data...")}</Text>
    </View>
  );

  const renderTodayPunchEvents = () => {
    const punchColorMap = {
      CLOCK_IN: '#2196F3',
      CLOCK_OUT: '#F44336',
      BREAK_START: '#9C27B0',
      BREAK_END: '#4CAF50',
    };

    const punchIconMap = {
      CLOCK_IN: 'login',
      CLOCK_OUT: 'log-out',
      BREAK_START: 'cup',
      BREAK_END: 'check',
    };

    const punchLabelMap = {
      CLOCK_IN: t('Clock In'),
      CLOCK_OUT: t('Clock Out'),
      BREAK_START: t('Break Start'),
      BREAK_END: t('Break End'),
    };

    const allPunchTypes = ['CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END'];

    const existingPunches = {};
    if (todayData && todayData.punches) {
      todayData.punches.forEach(punch => {
        existingPunches[punch.action_type] = punch;
      });
    }

    return (
      <View style={styles.todayEventsContainer}>
        <View style={styles.sectionTitleContainer}>
          <Entypo
            name="location-pin"
            size={RFPercentage(2.5)}
            color={
              isDarkMode
                ? Colors.darkTheme.primaryColor
                : Colors.lightTheme.primaryColor
            }
          />
          <Text style={styles.sectionTitle}>{t("Today's Punches")}</Text>
        </View>

        <View style={styles.punchBadgesContainer}>
          {allPunchTypes.map((punchType, index) => {
            const punch = existingPunches[punchType];
            const isAvailable = !!punch;
            const eventColor = punchColorMap[punchType];
            const eventIcon = punchIconMap[punchType];
            const eventLabel = punchLabelMap[punchType];
            const disabledColor = isDarkMode ? '#dcdcdc' : '#a0a0a0';

            return (
              <View
                key={punchType}
                style={[
                  styles.punchBadge,
                  {
                    backgroundColor: isAvailable
                      ? eventColor + '15'
                      : disabledColor + '30',
                    borderColor: isAvailable ? eventColor : disabledColor,
                    opacity: isAvailable ? 1 : 0.5,
                  },
                ]}>
                <View
                  style={[
                    styles.punchBadgeIconCircle,
                    {
                      backgroundColor: isAvailable
                        ? eventColor + '25'
                        : disabledColor + '50',
                    },
                  ]}>
                  <Entypo
                    name={eventIcon}
                    size={RFPercentage(2)}
                    color={isAvailable ? eventColor : disabledColor}
                  />
                </View>
                <View style={styles.punchBadgeContent}>
                  <Text
                    style={[
                      styles.punchBadgeLabel,
                      {
                        color: isAvailable
                          ? isDarkMode
                            ? Colors.darkTheme.primaryTextColor
                            : Colors.lightTheme.primaryTextColor
                          : disabledColor,
                      },
                    ]}>
                    {eventLabel}
                  </Text>
                  <Text
                    style={[
                      styles.punchBadgeTime,
                      {color: isAvailable ? eventColor : disabledColor},
                    ]}>
                    {isAvailable ? formatTime(punch.punch_time) : '--:--'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const ListSection = ({title, data, loading, onViewAll, type}) => {
    if (!loading && (!data || data.length === 0)) {
      return (
        <View
          style={styles.listSectionContainer}
          onTouchStart={() => {
            setScroll(true);
          }}
          onTouchEnd={() => {
            setScroll(true);
          }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={onViewAll}>
              <Svgs.ChevronFilled />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filtersApplied
                ? t('No records match your filters')
                : t('No data available', {type: t(type)})}
            </Text>
            {filtersApplied && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearFilters}>
                <Text style={styles.clearFilterText}>{t('Clear Filters')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.listSectionContainer}>
        <View style={styles.sectionHeaderMain}>
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {data && data.length > 0 && (
              <View style={styles.recordCountBadge}>
                <Text style={styles.recordCountText}>{data.length}</Text>
              </View>
            )}
          </View>
          <View style={styles.actionButtonsContainer}>
            <View
              style={[
                styles.exportButtonWrapper,
                {
                  backgroundColor: primaryButtonColors.backgroundColor,
                },
              ]}>
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
                maxColumns={6}
                isDarkMode={isDarkMode}>
                <TouchableOpacity style={styles.exportButton}>
                  <Entypo
                    name="export"
                    size={RFPercentage(2.2)}
                    color={'#FFF'}
                  />
                </TouchableOpacity>
              </UnifiedExportComponent>
            </View>
            <View style={{flexDirection: 'row', gap: wp(2)}}>
              <TouchableOpacity
                style={styles.dateRangeButton}
                onPress={() => setShowMonthPicker(true)}>
                <Ionicons
                  name="calendar-outline"
                  size={RFPercentage(1.8)}
                  color="#FFF"
                />
                <Text style={styles.dateRangeButtonText}>
                  {selectedMonth || t('Select Month')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {filtersApplied && selectedMonth && (
          <View style={styles.activeFilterBanner}>
            <Entypo name="calendar" size={RFPercentage(2)} color="#2196F3" />
            <Text style={styles.activeFilterText}>{selectedMonth}</Text>
            <TouchableOpacity
              style={styles.clearFilterIconButton}
              onPress={clearFilters}>
              <Entypo name="cross" size={RFPercentage(2)} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('Loading...')}</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {data.map((item, index) => (
              <AttendanceListCard
                key={item.id || index.toString()}
                item={item}
                onPress={() => {
                  navigation.navigate(SCREENS.ATTENDENCEREQUESTDETAILS, {
                    requestTypes: 'Attendance',
                    item,
                  });
                }}
                containerStyle={styles.listItem}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scroll}
        onTouchStart={() => {
          setScroll(true);
        }}>
        <View style={styles.headerContainer}>
          <Text style={styles.greetingText}>{t('Attendance')}</Text>
          <View style={styles.iconContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate(SCREENS.MESSAGES);
              }}
              style={{marginRight: wp(4)}}>
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
        <View
          style={{marginHorizontal: 10, overflow: 'hidden', borderRadius: 10}}
          onTouchStart={e => {
            e.stopPropagation();
            setScroll(true);
          }}
          onTouchEnd={() => {
            setTimeout(() => setScroll(true), 100);
          }}>
          <View style={styles.mapFilterContainer}>
            <View style={styles.mapFilterHeader}>
              <View style={styles.mapFilterTitleSection}>
                <Text style={styles.mapFilterTitle}>
                  {t('Attendance Locations')}
                </Text>
              </View>
            </View>

            {/* Pin Legend */}
            <View style={styles.pinLegendContainer}>
              <View style={styles.pinLegendItem}>
                <View
                  style={[styles.pinLegendDot, {backgroundColor: '#2196F3'}]}
                />
                <Text style={styles.pinLegendText}>{t('Clock In')}</Text>
              </View>
              <View style={styles.pinLegendItem}>
                <View
                  style={[styles.pinLegendDot, {backgroundColor: '#F44336'}]}
                />
                <Text style={styles.pinLegendText}>{t('Clock Out')}</Text>
              </View>
              <View style={styles.pinLegendItem}>
                <View
                  style={[styles.pinLegendDot, {backgroundColor: '#9C27B0'}]}
                />
                <Text style={styles.pinLegendText}>{t('Break In')}</Text>
              </View>
              <View style={styles.pinLegendItem}>
                <View
                  style={[styles.pinLegendDot, {backgroundColor: '#4CAF50'}]}
                />
                <Text style={styles.pinLegendText}>{t('Break Out')}</Text>
              </View>
            </View>
          </View>

          <View
            onTouchStart={e => {
              e.stopPropagation();
              setScroll(false);
            }}>
            <MapComponent
              ref={mapRef}
              initialLat={mapCenter.lat}
              initialLng={mapCenter.lng}
              initialZoom={mapZoom}
              markers={initialMarkers}
              style={styles.mapImage}
              initialMarkerTitle={t('Attendance Locations')}
              showSearch={false}
              scrollEnabled={true}
              searchPlaceholder={t('Find a place...')}
              onLocationFound={result => {
                // logging removed
              }}
            />
          </View>
          {loading ? renderLoading() : renderTodayPunchEvents()}
        </View>
        <ListSection
          title={t('Monthly Attendance')}
          data={monthlyAttendance}
          loading={loading}
          type="attendance"
          onViewAll={() =>
            navigation.navigate(SCREENS.REQUESTMANAGEMENT, {
              initialTab: 'Attendance',
            })
          }
        />
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.monthPickerContainer}>
            <View style={styles.monthPickerHeader}>
              <Text style={styles.monthPickerTitle}>{t('Select Month')}</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Entypo name="cross" size={RFPercentage(2.5)} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.monthList}>
              {Array.from({length: 12}, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const monthValue = `${year}-${month}`;
                const monthLabel = date.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                });
                return (
                  <TouchableOpacity
                    key={monthValue}
                    style={[
                      styles.monthItem,
                      selectedMonth === monthLabel && styles.monthItemSelected,
                    ]}
                    onPress={() => handleMonthSelect(monthValue, monthLabel)}>
                    <Text
                      style={[
                        styles.monthItemText,
                        selectedMonth === monthLabel &&
                          styles.monthItemTextSelected,
                      ]}>
                      {monthLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TodaysPunch;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors?.lightTheme.secondryColor,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: hp(2),
    },
    mapImage: {
      width: wp(100),
      height: hp(40),
      marginTop: hp(0),
      position: 'relative',
    },
    mapFilterContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.backgroundColor,
      marginTop: hp(2),
      padding: wp(4),
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    mapFilterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1.5),
    },
    mapFilterTitleSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
      flex: 1,
    },
    mapFilterTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    markerCountBadge: {
      backgroundColor: isDarkMode
        ? 'rgba(33, 150, 243, 0.15)'
        : 'rgba(33, 150, 243, 0.1)',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: 10,
    },
    markerCountText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: '#2196F3',
    },
    fitBoundsButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    pinLegendContainer: {
      flexDirection: 'row',

      marginTop: hp(1.5),
      flexWrap: 'wrap',
      gap: wp(3),
      paddingTop: hp(1),
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    pinLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
    },
    pinLegendDot: {
      width: wp(3),
      height: wp(3),
      borderRadius: 10,
    },
    pinLegendText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    loadingContainer: {
      padding: hp(5),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      marginHorizontal: wp(4),
      marginVertical: hp(2),
      borderRadius: 10,
    },
    loadingText: {
      marginTop: hp(2),
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(13)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    noDataContainer: {
      padding: hp(5),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      marginHorizontal: wp(4),
      marginVertical: hp(2),
      borderRadius: 10,
    },
    noDataText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(13)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
    summaryContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      marginHorizontal: wp(4),
      marginTop: hp(2),
      marginBottom: hp(1.5),
      padding: wp(4),
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    summaryTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    summaryBadge: {
      backgroundColor: isDarkMode
        ? 'rgba(33, 150, 243, 0.15)'
        : 'rgba(33, 150, 243, 0.1)',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#2196F3',
    },
    summaryBadgeText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: '#2196F3',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: wp(3),
    },
    statItem: {
      width: '47%',
      alignItems: 'center',
      padding: wp(3),
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    statItemPrimary: {
      backgroundColor: isDarkMode
        ? 'rgba(33, 150, 243, 0.05)'
        : 'rgba(33, 150, 243, 0.03)',
    },
    statItemSecondary: {
      backgroundColor: isDarkMode
        ? 'rgba(255, 152, 0, 0.05)'
        : 'rgba(255, 152, 0, 0.03)',
    },
    statIconContainer: {
      width: wp(12),
      height: wp(12),
      borderRadius: 10,
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(1),
    },
    statValue: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(20)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.3),
    },
    statLabel: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
    presentStatus: {
      color: '#4CAF50',
    },
    absentStatus: {
      color: '#F44336',
    },
    punchTimesContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      marginHorizontal: wp(4),
      marginBottom: hp(1.5),
      padding: wp(4),
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(2),
      gap: wp(2),
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    punchTimeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(3),
      marginBottom: hp(1),
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 10,
      borderLeftWidth: 3,
      borderLeftColor: '#2196F3',
    },
    punchTimeIconWrapper: {
      width: wp(10),
      height: wp(10),
      borderRadius: 10,
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
    },
    punchTimeContent: {
      flex: 1,
    },
    punchTimeLabel: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0.3),
    },
    punchTimeValue: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    punchRow: {
      marginBottom: hp(1),
    },
    punchHistoryContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      marginHorizontal: wp(4),
      marginBottom: hp(2),
      padding: wp(4),
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    todayEventsContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.backgroundColor,
      marginBottom: hp(2),
      padding: wp(4),
      borderBottomEndRadius: 10,
      borderBottomStartRadius: 10,
      // shadowColor: '#000',
      // shadowOffset: {width: 0, height: 2},
      // shadowOpacity: 0.08,
      // shadowRadius: 4,
      // elevation: 3,
    },
    punchBadgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(3),
      justifyContent: 'space-between',
    },
    punchBadge: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(3),
      borderRadius: 10,
      borderWidth: 1.5,
      gap: wp(2),
    },
    punchBadgeIconCircle: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      alignItems: 'center',
      justifyContent: 'center',
    },
    punchBadgeContent: {
      flex: 1,
    },
    punchBadgeLabel: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(11)),
      marginBottom: hp(0.2),
    },
    punchBadgeTime: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(14)),
    },
    historyBadge: {
      backgroundColor: isDarkMode
        ? 'rgba(33, 150, 243, 0.15)'
        : 'rgba(33, 150, 243, 0.1)',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: 10,
      marginLeft: 'auto',
    },
    historyBadgeText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: '#2196F3',
    },
    punchHistoryList: {
      paddingLeft: wp(2),
    },
    punchHistoryItem: {
      flexDirection: 'row',
      marginBottom: hp(0.5),
    },
    punchHistoryIconContainer: {
      alignItems: 'center',
      marginRight: wp(3),
      position: 'relative',
    },
    punchHistoryDot: {
      width: wp(3),
      height: wp(3),
      borderRadius: 10,
      zIndex: 1,
    },
    punchHistoryLine: {
      width: 2,
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      position: 'absolute',
      top: wp(3),
      bottom: -hp(2),
      left: wp(1.5) - 1,
    },
    punchHistoryContent: {
      flex: 1,
      paddingBottom: hp(1.5),
    },
    punchInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.02)',
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(3),
      borderRadius: 10,
    },
    punchType: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(13)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    punchTime: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(13)),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    punchSeparator: {
      height: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginTop: hp(1),
      marginBottom: hp(0.5),
    },
    requestContainer: {
      paddingHorizontal: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 10,
      marginTop: hp(2),
      marginBottom: hp(2),
      marginHorizontal: wp(5),
      paddingTop: hp(1),
    },
    rowSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
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
    workerStatusContainer: {
      paddingTop: hp(1),
      paddingBottom: hp(1.5),
      borderBottomColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.08)',
      borderBottomWidth: 1.5,
      marginBottom: hp(1.5),
      backgroundColor: 'transparent',
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    listSectionContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2.5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.backgroundColor,
      borderRadius: 10,
      marginTop: hp(2),
      marginBottom: hp(3),
      marginHorizontal: wp(2),
    },
    sectionHeaderMain: {
      marginBottom: hp(1.5),
    },
    sectionTitleWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
      marginBottom: hp(1.5),
    },
    recordCountBadge: {
      backgroundColor: isDarkMode
        ? 'rgba(33, 150, 243, 0.15)'
        : 'rgba(33, 150, 243, 0.1)',
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.3),
      borderRadius: 10,
      marginLeft: wp(2),
    },
    recordCountText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: '#2196F3',
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: wp(2),
    },
    exportButtonWrapper: {
      borderRadius: 10,
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
    },
    filterButton: {
      padding: wp(2),
      borderRadius: 10,
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
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
    activeFilterBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(33, 150, 243, 0.1)'
        : 'rgba(33, 150, 243, 0.08)',
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      borderRadius: 10,
      marginBottom: hp(1.5),
      gap: wp(2),
    },
    activeFilterText: {
      flex: 1,
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    clearFilterIconButton: {
      padding: wp(1),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    viewAllText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    listContent: {},
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingTop: hp(1),
      justifyContent: 'space-between',
      paddingBottom: hp(1),
      backgroundColor: isDarkMode ? Colors.darkTheme.backgroundColor : '#FFF',
    },
    greetingText: {
      paddingTop: hp(1.5),
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    nameText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(20)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      width: wp(50),
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileImage: {
      width: wp(13),
      height: wp(13),
      borderRadius: 10,
      marginLeft: wp(5),
    },
    listItem: {
      marginVertical: hp(0.8),
      borderRadius: 10,
      overflow: 'hidden',
    },
    tabHeaderBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2),
      gap: wp(2),
      padding: wp(2),
      borderRadius: 10,
      backgroundColor: '#006EC2',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(5),
      paddingHorizontal: wp(4),
    },
    emptyText: {
      fontSize: RFPercentage(pxToPercentage(13)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      marginBottom: hp(2.5),
      lineHeight: RFPercentage(pxToPercentage(20)),
    },
    clearFilterButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(6),
      paddingVertical: hp(1.5),
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    clearFilterText: {
      color: '#fff',
      fontSize: RFPercentage(pxToPercentage(13)),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    tabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: '#FFF',
    },
    // Month Picker Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    monthPickerContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.backgroundColor,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: hp(3),
      maxHeight: hp(60),
    },
    monthPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: wp(4),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.1)',
    },
    monthPickerTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    monthList: {
      padding: wp(2),
    },
    monthItem: {
      padding: wp(4),
      borderRadius: 10,
      marginBottom: wp(2),
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
    },
    monthItemSelected: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    monthItemText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    monthItemTextSelected: {
      color: '#FFF',
    },
  });
