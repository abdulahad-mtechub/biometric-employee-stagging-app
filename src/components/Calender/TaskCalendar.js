import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useCallback, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import {Calendar} from 'react-native-big-calendar';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {workerTaskList} from '../../Constants/api';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function TaskCalendar({showDailyView = false}) {
  const [calendarMode, setCalendarMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDate, setExpandedDate] = useState(null);
  const navigation = useNavigation();
  const {isDarkMode} = useSelector(store => store?.theme);
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const getDateRange = (date, mode) => {
    if (mode === 'month') {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get the day of week for the first day of the month (0 = Sunday, 6 = Saturday)
      const firstDayOfWeek = startOfMonth.getDay();

      // Calculate the actual start date (including previous month's days visible in calendar)
      const calendarStartDate = new Date(startOfMonth);
      calendarStartDate.setDate(startOfMonth.getDate() - firstDayOfWeek);

      // Get the day of week for the last day of the month
      const lastDayOfWeek = endOfMonth.getDay();

      // Calculate the actual end date (including next month's days visible in calendar)
      const calendarEndDate = new Date(endOfMonth);
      const daysToAdd = lastDayOfWeek === 6 ? 0 : 6 - lastDayOfWeek;
      calendarEndDate.setDate(endOfMonth.getDate() + daysToAdd);

      return {
        fromDate: calendarStartDate.toISOString().split('T')[0],
        toDate: calendarEndDate.toISOString().split('T')[0],
      };
    } else {
      const dayStart = new Date(date);
      return {
        fromDate: dayStart.toISOString().split('T')[0],
        toDate: dayStart.toISOString().split('T')[0],
      };
    }
  };

  const fetchDailyTasks = async date => {
    try {
      setLoading(true);
      const dateStr = date.toISOString().split('T')[0];

      const getTasksListApi = await workerTaskList(dateStr, dateStr, token);
      if (getTasksListApi?.data) {
        const transformedTasks = transformApiTasks(
          getTasksListApi.data,
          'Daily',
        );
        setDailyTasks(transformedTasks);
      } else {
        setDailyTasks([]);
      }
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      setDailyTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const transformApiTasks = (apiData, mode) => {
    const tasksByDate = {};

    if (apiData.calendar) {
      Object.values(apiData.calendar).forEach(dateData => {
        if (dateData.tasks && Array.isArray(dateData.tasks)) {
          dateData.tasks.forEach(task => {
            // Convert UTC time from API to local timezone
            const startDate = new Date(task.start_at);
            const endDate = new Date(task.end_at);

            // Extract time components in local time
            const startHour = startDate.getHours();
            const startMinute = startDate.getMinutes();
            const endHour = endDate.getHours();
            const endMinute = endDate.getMinutes();

            // For grouping, use the date part from API string
            const taskDate = task.start_at.split('T')[0];

            const taskObj = {
              id: task.task_id.toString(),
              title: task.title,
              description: task.title,
              taskNo: `T-${task.task_id.toString().padStart(3, '0')}`,
              start: task.start_at, // Keep as ISO string
              end: task.end_at, // Keep as ISO string
              startHour,
              startMinute,
              endHour,
              endMinute,
              color:
                task.priority === 'high'
                  ? '#DC143C'
                  : task.priority === 'medium'
                  ? '#FF8C00'
                  : '#32CD32',
              priority: task.priority,
              status: task.status,
              my_status: task.my_status,
              location: task.location_address,
              face_required: task.face_required,
              location_required: task.location_required,
              evidence_required: task.evidence_required,
            };

            if (!tasksByDate[taskDate]) {
              tasksByDate[taskDate] = [];
            }
            tasksByDate[taskDate].push(taskObj);
          });
        }
      });
    }

    const calendarEvents = [];
    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      if (showDailyView && mode === 'month') {
        const firstTask = tasks[0];
        calendarEvents.push({
          id: `dot_${date}`,
          title: '',
          start: new Date(firstTask.start), // Convert to Date for Calendar component
          end: new Date(firstTask.end), // Convert to Date for Calendar component
          color: 'transparent',
          isDot: true,
          taskCount: tasks.length,
          tasks: tasks, // Keep original tasks with ISO strings
          date: date,
        });
      } else if (mode === 'Daily' || tasks.length === 1) {
        tasks.forEach(task => {
          calendarEvents.push({
            ...task,
            start: new Date(task.start), // Convert to Date for Calendar component
            end: new Date(task.end), // Convert to Date for Calendar component
            // Keep ISO string for timeline
            startISO: task.start,
            endISO: task.end,
          });
        });
      } else {
        const firstTask = tasks[0];
        calendarEvents.push({
          id: `group_${date}`,
          title: `${tasks.length} ${t('Tasks')}`,
          description: `${tasks.length} ${t('tasks scheduled')}`,
          start: new Date(firstTask.start), // Convert to Date for Calendar component
          end: new Date(firstTask.end), // Convert to Date for Calendar component
          color: '#4A90E2',
          isGroup: true,
          tasks: tasks, // Keep original tasks with ISO strings
          date: date,
          // Also keep ISO strings for consistency
          startISO: firstTask.start,
          endISO: firstTask.end,
        });
      }
    });

    return calendarEvents;
  };

  const fetchTasks = async (date, mode, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const {fromDate, toDate} = getDateRange(date, mode);

      const getTasksListApi = await workerTaskList(fromDate, toDate, token);
      if (getTasksListApi?.data) {
        const transformedTasks = transformApiTasks(getTasksListApi.data, mode);
        setTasks(transformedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks(currentDate, calendarMode);
    }, [token, currentDate, calendarMode]),
  );

  const onRefresh = useCallback(() => {
    fetchTasks(currentDate, calendarMode, true);
  }, [token, currentDate, calendarMode]);

  const goToNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const goToPrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const handlePressEvent = event => {
    if (showDailyView && event.isDot) {
      // The date string is in format like "2024-11-26"
      const eventDateStr = event.date;
      // Parse the date string to create a Date object for display
      const dateParts = eventDateStr.split('-');
      const eventDate = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
      );

      setSelectedDate(eventDate);
      // Use the tasks from the event directly instead of fetching again
      if (event.tasks && event.tasks.length > 0) {
        // Transform the tasks to match the expected format for timeline display
        const transformedTasks = event.tasks.map(task => ({
          ...task,
          startISO: task.start, // Keep ISO string for timeline
          endISO: task.end, // Keep ISO string for timeline
        }));
        setDailyTasks(transformedTasks);
      } else {
        // Fallback to API call if no tasks in event
        const dateObj = new Date(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2]),
        );
        fetchDailyTasks(dateObj);
      }
      return;
    }
    if (event.isGroup) {
      // Set selectedDate to show the timeline
      const eventDateStr = event.date;
      const dateParts = eventDateStr.split('-');
      const eventDate = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
      );
      setSelectedDate(eventDate);

      // Use the tasks from the event directly instead of fetching again
      if (event.tasks && event.tasks.length > 0) {
        const transformedTasks = event.tasks.map(task => ({
          ...task,
          startISO: task.start,
          endISO: task.end,
        }));
        setDailyTasks(transformedTasks);
      } else {
        fetchDailyTasks(eventDate);
      }

      // Also toggle expanded state for visual feedback
      setExpandedDate(event.date === expandedDate ? null : event.date);
    } else {
      // Show alert when clicking on a date without a dot
      Alert.alert(
        'Click on a Date with a Dot',
        `Please click on a date with a blue dot to view tasks scheduled for that date.`,
        [{text: 'OK', style: 'cancel'}],
      );
    }
  };

  const handleDatePress = date => {
    if (showDailyView) {
      setSelectedDate(date);
      fetchDailyTasks(date);
    }
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const goToPrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const renderDailyTasksSection = () => {
    if (!showDailyView || !selectedDate) return null;

    // Generate 24-hour timeline
    const timeSlots = [];

    // Filter tasks for the selected date - use local date to avoid timezone issues
    const selectedDateFull = selectedDate;
    const year = selectedDateFull.getFullYear();
    const month = String(selectedDateFull.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDateFull.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;

    const tasksForSelectedDate = dailyTasks.filter(task => {
      // Compare using the extracted date from ISO string or use the date property
      const taskDate = task.startISO ? task.startISO.split('T')[0] : task.date;
      return taskDate === selectedDateStr;
    });

    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = {
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        displayTime: hour.toString().padStart(2, '0') + ':00',
        tasks: tasksForSelectedDate.filter(task => {
          // Use the extracted hour value directly from API (raw time, no conversion)
          return task.startHour === hour;
        }),
      };
      timeSlots.push(timeSlot);
    }

    return (
      <View style={styles.dailySection}>
        <View style={styles.dailySectionHeader}>
          <Text style={styles.dailySectionTitle}>
            {t('Timeline for')} {selectedDate.toLocaleDateString()}
          </Text>
          <TouchableOpacity
            style={styles.closeDailyButton}
            onPress={() => setSelectedDate(null)}>
            <Icon
              name="close"
              size={RFPercentage(2.5)}
              color={
                isDarkMode
                  ? Colors.darkTheme.primaryTextColor
                  : Colors.lightTheme.primaryTextColor
              }
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.timelineContainer}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.timelineContent}>
          {loading ? (
            <Text style={styles.loadingText}>{t('Loading timeline...')}</Text>
          ) : tasksForSelectedDate.length === 0 ? (
            <View style={styles.noTasksContainer}>
              <Text style={styles.noTasksText}>
                {t('No tasks scheduled for this date')}
              </Text>
            </View>
          ) : (
            timeSlots.map((slot, index) => (
              <View key={slot.hour} style={styles.timeSlot}>
                <View style={styles.timeSlotHeader}>
                  <Text style={styles.timeSlotTime}>{slot.displayTime}</Text>
                  <View style={styles.timeSlotLine} />
                </View>
                <View style={styles.timeSlotContent}>
                  {slot.tasks.length === 0 ? (
                    <View style={styles.emptyTimeSlot}>
                      <Text style={styles.emptyTimeSlotText}>
                        {t('No tasks')}
                      </Text>
                    </View>
                  ) : (
                    slot.tasks.map((task, taskIndex) => (
                      <TouchableOpacity
                        key={task.id}
                        style={[
                          styles.timelineTaskItem,
                          {borderLeftColor: task.color},
                        ]}
                        onPress={() =>
                          navigation.navigate(SCREENS.TASKDETAIL, {task})
                        }>
                        <View style={styles.timelineTaskContent}>
                          <View style={styles.timelineTaskHeader}>
                            <Text
                              style={styles.timelineTaskTitle}
                              numberOfLines={2}>
                              {task.title}
                            </Text>
                            <View
                              style={[
                                styles.timelinePriorityBadge,
                                {backgroundColor: task.color},
                              ]}>
                              <Text style={styles.timelinePriorityText}>
                                {task.priority?.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.timelineTaskTimeRow}>
                            <Icon
                              name="schedule"
                              size={RFPercentage(1.8)}
                              color={
                                isDarkMode
                                  ? Colors.darkTheme.primaryTextColor
                                  : '#666'
                              }
                              style={styles.timelineTaskIcon}
                            />
                            <Text style={styles.timelineTaskTime}>
                              {String(task.startHour).padStart(2, '0')}:
                              {String(task.startMinute).padStart(2, '0')} -{' '}
                              {String(task.endHour).padStart(2, '0')}:
                              {String(task.endMinute).padStart(2, '0')}
                            </Text>
                          </View>
                          {task.location && (
                            <View style={styles.timelineTaskLocationRow}>
                              <Icon
                                name="location-on"
                                size={RFPercentage(1.8)}
                                color="#FF6B6B"
                                style={styles.timelineTaskIcon}
                              />
                              <Text
                                style={styles.timelineTaskLocation}
                                numberOfLines={1}>
                                {task.location}
                              </Text>
                            </View>
                          )}
                          <View style={styles.timelineTaskBadges}>
                            {task.face_required && (
                              <View style={styles.badge}>
                                <Icon
                                  name="face"
                                  size={RFPercentage(1.5)}
                                  color="#4A90E2"
                                />
                              </View>
                            )}
                            {task.location_required && (
                              <View style={styles.badge}>
                                <Icon
                                  name="my-location"
                                  size={RFPercentage(1.5)}
                                  color="#FF6B6B"
                                />
                              </View>
                            )}
                            {task.evidence_required && (
                              <View style={styles.badge}>
                                <Icon
                                  name="camera-alt"
                                  size={RFPercentage(1.5)}
                                  color="#50C878"
                                />
                              </View>
                            )}
                            <View
                              style={[
                                styles.statusBadge,
                                {backgroundColor: task.color},
                              ]}>
                              <Text style={styles.statusBadgeText}>
                                {t(task.status).charAt(0).toUpperCase() +
                                  t(task.status).slice(1)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('Task Calendar')}</Text>
        {!showDailyView && (
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                calendarMode === 'month' && styles.modeButtonActive,
              ]}
              onPress={() => setCalendarMode('month')}>
              <Text
                style={[
                  styles.modeButtonText,
                  calendarMode === 'month' && styles.modeButtonTextActive,
                ]}>
                {t('Month')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                calendarMode === 'day' && styles.modeButtonActive,
              ]}
              onPress={() => setCalendarMode('day')}>
              <Text
                style={[
                  styles.modeButtonText,
                  calendarMode === 'day' && styles.modeButtonTextActive,
                ]}>
                {t('Day')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {calendarMode === 'month' && (
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navButton} onPress={goToPrevMonth}>
            <Icon
              name="chevron-left"
              size={RFPercentage(3)}
              color={isDarkMode ? Colors.darkTheme.primaryTextColor : '#fff'}
            />
          </TouchableOpacity>
          <View style={styles.monthLabelContainer}>
            <Text style={styles.monthLabel}>
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                const today = new Date();
                setCurrentDate(today);
                fetchTasks(today, calendarMode);
              }}>
              <Text style={styles.todayButtonText}>{t('Today')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
            <Icon
              name="chevron-right"
              size={RFPercentage(3)}
              color={isDarkMode ? Colors.darkTheme.primaryTextColor : '#fff'}
            />
          </TouchableOpacity>
        </View>
      )}

      {calendarMode === 'day' && !showDailyView && (
        <View style={styles.dayNav}>
          <TouchableOpacity style={styles.navButton} onPress={goToPrevDay}>
            <Icon
              name="chevron-left"
              size={RFPercentage(3)}
              color={isDarkMode ? Colors.darkTheme.primaryTextColor : '#fff'}
            />
          </TouchableOpacity>
          <Text style={styles.dayLabel}>
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={goToNextDay}>
            <Icon
              name="chevron-right"
              size={RFPercentage(3)}
              color={isDarkMode ? Colors.darkTheme.primaryTextColor : '#fff'}
            />
          </TouchableOpacity>
        </View>
      )}

      <Calendar
        events={tasks}
        height={
          showDailyView
            ? selectedDate
              ? hp(55)
              : hp(55)
            : calendarMode === 'month'
            ? hp(40)
            : hp(67)
        }
        mode={
          showDailyView ? 'month' : calendarMode === 'month' ? 'month' : 'day'
        }
        date={currentDate}
        onPressEvent={handlePressEvent}
        onPressCell={handleDatePress}
        eventCellStyle={event => ({
          backgroundColor: event.isDot ? 'transparent' : event.color,
          borderRadius: 5,
          borderWidth: event.isDot ? 0 : 1,
          borderColor: isDarkMode
            ? Colors.darkTheme.primaryTextColor
            : Colors.lightTheme.primaryTextColor,
          padding: event.isDot ? 0 : hp(1.3),
        })}
        swipeEnabled={false}
        headerStyle={
          calendarMode === 'Daily' && !showDailyView
            ? {height: 0, display: 'none'}
            : styles.calendarHeader
        }
        dayHeaderStyle={styles.dayHeader}
        showTime={!showDailyView}
        dateCellStyle={{
          padding: wp(1.5),
        }}
        renderEvent={event => {
          if (event.isDot) {
            // Show only the task count badge (no small dot)
            return (
              <View
                style={[styles.dotContainer, {backgroundColor: '#4A90E2'}]}
                pointerEvents="none"></View>
            );
          }
          return (
            <View style={styles.eventWrapper} pointerEvents="box-none">
              <View
                style={[styles.eventContainer, {backgroundColor: event.color}]}
                pointerEvents="none">
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                {event.isGroup && (
                  <Text style={styles.groupIndicator}>
                    {expandedDate === event.date ? '▲' : '▼'}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {renderDailyTasksSection()}

      {!showDailyView && (
        <TouchableOpacity style={styles.fabButton} onPress={() => {}}>
          <Icon name="add" size={RFPercentage(4)} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      padding: wp(2),
      borderRadius: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
      paddingHorizontal: wp(2),
    },
    title: {
      fontSize: RFPercentage(2.5),
      fontWeight: 'bold',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    modeSelector: {
      flexDirection: 'row',
      backgroundColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      borderRadius: 8,
      padding: 4,
    },
    modeButton: {
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      borderRadius: 6,
    },
    modeButtonActive: {
      backgroundColor: '#006EC2',
    },
    modeButtonText: {
      fontSize: RFPercentage(1.6),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    modeButtonTextActive: {
      color: '#fff',
    },
    monthNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
      paddingHorizontal: wp(2),
    },
    monthLabelContainer: {
      alignItems: 'center',
    },
    monthLabel: {
      fontSize: RFPercentage(2.2),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    todayButton: {
      marginTop: hp(0.5),
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      backgroundColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      borderRadius: 6,
    },
    todayButtonText: {
      fontSize: RFPercentage(1.2),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    dayNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
      paddingHorizontal: wp(2),
    },
    navButton: {
      padding: 8,
      backgroundColor: '#006EC2',
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
      fontWeight: '600',
    },
    dayLabel: {
      fontSize: RFPercentage(2),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    calendarHeader: {
      backgroundColor: '#f0f0f0',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    dayHeader: {
      backgroundColor: '#a0a0a0',
      color: '#333',
      fontWeight: '600',
    },
    modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '85%',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      padding: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    colorIndicator: {
      height: 5,
      width: '100%',
      borderRadius: 2.5,
      marginBottom: 15,
    },
    modalTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: 'bold',
      marginBottom: 15,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    detailRow: {
      flexDirection: 'row',
      marginBottom: 10,
      alignItems: 'flex-start',
    },
    detailLabel: {
      fontWeight: '600',
      width: wp(25),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    detailValue: {
      flex: 1,
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#333',
    },
    closeButton: {
      marginTop: 20,
      backgroundColor: '#006EC2',
      padding: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    eventContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 5,
      padding: hp(1),
      marginBottom: 2,
    },
    eventTitle: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontWeight: '600',
      flex: 1,
      fontSize: RFPercentage(1.6),
    },
    groupIndicator: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontWeight: 'bold',
      fontSize: RFPercentage(1.4),
    },
    eventWrapper: {
      position: 'relative',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(4),
    },
    dropdownContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 20,
      width: wp(90),
      maxWidth: wp(95),
      maxHeight: hp(70),
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      paddingVertical: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    modalHeaderTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: '700',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
    },
    closeButton: {
      width: hp(4),
      height: hp(4),
      borderRadius: hp(2),
      backgroundColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: wp(2),
    },
    closeButtonText: {
      fontSize: RFPercentage(2),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    tasksDropdown: {
      maxHeight: hp(55),
      paddingHorizontal: wp(1),
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      borderLeftWidth: 4,
      marginHorizontal: wp(1),
      marginVertical: hp(0.5),
      borderRadius: 8,
    },
    taskContent: {
      flex: 1,
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1),
    },
    taskTitle: {
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
      marginRight: wp(2),
      lineHeight: RFPercentage(2.2),
    },
    priorityBadge: {
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: 12,
      minWidth: wp(16),
      alignItems: 'center',
    },
    priorityText: {
      fontSize: RFPercentage(1.1),
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    taskDetails: {
      gap: hp(0.5),
    },
    taskTime: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontWeight: '500',
    },
    taskLocation: {
      fontSize: RFPercentage(1.3),
      color: isDarkMode ? Colors.darkTheme.secondaryTextColor : '#888',
      fontStyle: 'italic',
    },
    taskArrow: {
      fontSize: RFPercentage(2.5),
      color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
      fontWeight: '300',
      marginLeft: wp(2),
    },
    dotContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
      borderRadius: 6,
      overflow: 'hidden',
      width: wp(10),
      height: hp(0.5),
      alignSelf: 'center',
    },
    taskDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 3,
    },
    dotCount: {
      fontSize: RFPercentage(1.6),
      color: '#006EC2',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: RFPercentage(1.5),
      flexShrink: 1,
    },
    dailySection: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      height: hp(50),
      flex: 1,
    },
    dailySectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: wp(4),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.1)',
    },
    dailySectionTitle: {
      fontSize: RFPercentage(2),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    closeDailyButton: {
      width: hp(4),
      height: hp(4),
      borderRadius: hp(2),
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dailyTasksList: {
      flex: 1,
      paddingHorizontal: wp(2),
      paddingVertical: wp(1),
    },
    dailyTaskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      padding: wp(3),
      marginVertical: hp(0.5),
      borderRadius: 8,
      borderLeftWidth: 4,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    dailyTaskContent: {
      flex: 1,
    },
    dailyTaskTitle: {
      fontSize: RFPercentage(1.7),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
    },
    dailyTaskTime: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.3),
    },
    dailyTaskLocation: {
      fontSize: RFPercentage(1.3),
      color: isDarkMode ? Colors.darkTheme.secondaryTextColor : '#888',
      fontStyle: 'italic',
    },
    dailyTaskPriority: {
      width: hp(3),
      height: hp(3),
      borderRadius: hp(1.5),
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: wp(2),
    },
    dailyTaskPriorityText: {
      fontSize: RFPercentage(1.2),
      fontWeight: 'bold',
      color: '#fff',
    },
    loadingText: {
      textAlign: 'center',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.6),
      padding: wp(4),
    },
    noTasksText: {
      textAlign: 'center',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.6),
      padding: wp(4),
      fontStyle: 'italic',
    },
    noTasksContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: hp(10),
    },
    timelineContainer: {
      flex: 1,
    },
    timelineContent: {
      paddingHorizontal: wp(2),
      paddingBottom: hp(2),
    },
    timeSlot: {
      marginBottom: hp(1),
    },
    timeSlotHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(0.5),
      paddingHorizontal: wp(2),
    },
    timeSlotTime: {
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      minWidth: wp(20),
    },
    timeSlotLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      marginLeft: wp(2),
    },
    timeSlotContent: {
      minHeight: hp(6),
      paddingLeft: wp(22),
      paddingRight: wp(2),
    },
    emptyTimeSlot: {
      height: hp(6),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(255,255,255,0.02)'
        : 'rgba(0,0,0,0.02)',
      borderRadius: 8,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    emptyTimeSlotText: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontStyle: 'italic',
    },
    timelineTaskItem: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 10,
      borderLeftWidth: 5,
      marginBottom: hp(1),
      padding: wp(3),
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    timelineTaskContent: {
      flex: 1,
    },
    timelineTaskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1),
    },
    timelineTaskTitle: {
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
      marginRight: wp(2),
      lineHeight: RFPercentage(2.2),
    },
    timelinePriorityBadge: {
      width: hp(3),
      height: hp(3),
      borderRadius: hp(1.5),
      justifyContent: 'center',
      alignItems: 'center',
    },
    timelinePriorityText: {
      fontSize: RFPercentage(1.2),
      fontWeight: 'bold',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    timelineTaskTime: {
      fontSize: RFPercentage(1.5),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontWeight: '500',
      marginBottom: hp(0.5),
      flex: 1,
    },
    timelineTaskLocation: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? Colors.darkTheme.secondryTextColor : '#888',
      fontStyle: 'italic',
      marginBottom: hp(0.5),
      flex: 1,
    },
    timelineTaskTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(0.5),
    },
    timelineTaskLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(0.5),
    },
    timelineTaskIcon: {
      marginRight: wp(1),
    },
    timelineTaskBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(1),
      marginTop: hp(0.5),
    },
    badge: {
      padding: wp(1),
      backgroundColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      borderRadius: 6,
    },
    statusBadge: {
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: 6,
      marginLeft: 'auto',
    },
    statusBadgeText: {
      fontSize: RFPercentage(1.1),
      fontWeight: '600',
      color: '#fff',
    },
    timelineTaskStatus: {
      paddingTop: hp(0.5),
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    timelineTaskStatusText: {
      fontSize: RFPercentage(1.3),
      fontWeight: '500',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    fabButton: {
      position: 'absolute',
      bottom: hp(4),
      right: wp(4),
      width: hp(7),
      height: hp(7),
      borderRadius: hp(3.5),
      backgroundColor: '#006EC2',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  });
