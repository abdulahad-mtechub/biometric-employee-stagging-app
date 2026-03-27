import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useCallback, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {Calendar} from 'react-native-big-calendar';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {getAbsenceCalendar} from '../../Constants/api';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useTranslation} from 'react-i18next';

export default function AbsenceCalendar({showDailyView = false}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [dailyAbsences, setDailyAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const navigation = useNavigation();
  const {isDarkMode} = useSelector(store => store?.theme);
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  console.log(
    'Rendering AbsenceCalendar with showDailyView:',
    JSON.stringify(absences, null, 2),
  );
  // Get date range for calendar view
  const getDateRange = date => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return {
      startDate: startOfMonth.toISOString().split('T')[0], // YYYY-MM-DD
      endDate: endOfMonth.toISOString().split('T')[0], // YYYY-MM-DD
    };
  };

  // Get date range for daily view
  const getDailyDateRange = date => {
    const dateStr = date.toISOString().split('T')[0];
    return {
      startDate: dateStr,
      endDate: dateStr,
    };
  };

  // Fetch daily absences for a specific date
  const fetchDailyAbsences = async date => {
    try {
      setLoading(true);
      const {startDate, endDate} = getDailyDateRange(date);

      const response = await getAbsenceCalendar(startDate, endDate, token);
      console.log(
        '📅 Daily Absence API Response:',
        JSON.stringify(response, null, 2),
      );

      if (response?.data?.calendar?.calendar) {
        const transformedAbsences = transformApiAbsences(
          response.data.calendar.calendar,
          'daily',
        );
        setDailyAbsences(transformedAbsences);
      } else {
        setDailyAbsences([]);
      }
    } catch (error) {
      console.error('❌ Error fetching daily absences:', error);
      setDailyAbsences([]);
    } finally {
      setLoading(false);
    }
  };

  // Transform API data to calendar events
  const transformApiAbsences = (apiCalendarData, mode) => {
    const absencesByDate = {};

    // Process calendar data
    apiCalendarData.forEach(dateData => {
      const dateStr = dateData.date;
      if (dateData.absences && Array.isArray(dateData.absences)) {
        dateData.absences.forEach(absence => {
          const absenceDate = new Date(dateStr);

          const absenceObj = {
            id: absence.id.toString(),
            title: absence.name,
            description: absence.comment || absence.name,
            start: new Date(dateStr),
            end: new Date(dateStr),
            color: absence.color,
            type: absence.type,
            name: absence.name,
            comment: absence.comment,
            isPaid: absence.isPaid,
            isPartial: absence.isPartial,
            worker: absence.worker,
            date: dateStr,
          };

          if (!absencesByDate[dateStr]) {
            absencesByDate[dateStr] = [];
          }
          absencesByDate[dateStr].push(absenceObj);
        });
      }
    });

    const calendarEvents = [];
    Object.entries(absencesByDate).forEach(([date, dateAbsences]) => {
      if (showDailyView && mode === 'month') {
        // For month view in daily mode, show dots for days with absences
        const firstAbsence = dateAbsences[0];
        calendarEvents.push({
          id: `dot_${date}`,
          title: '',
          start: firstAbsence.start,
          end: firstAbsence.end,
          color: 'transparent',
          isDot: true,
          absenceCount: dateAbsences.length,
          absences: dateAbsences,
          date: date,
        });
      } else if (mode === 'daily' || dateAbsences.length === 1) {
        // For daily view or single absence, show individual events
        dateAbsences.forEach(absence => {
          calendarEvents.push(absence);
        });
      } else {
        // For multiple absences on same day, group them
        const firstAbsence = dateAbsences[0];
        calendarEvents.push({
          id: `group_${date}`,
          title: `${dateAbsences.length} ${t('Absences')}`,
          description: `${dateAbsences.length} ${t('absences scheduled')}`,
          start: firstAbsence.start,
          end: firstAbsence.end,
          color: '#4A90E2',
          isGroup: true,
          absences: dateAbsences,
          date: date,
        });
      }
    });

    console.log('📅 Transformed Calendar Events:', calendarEvents);
    return calendarEvents;
  };

  // Fetch absences for calendar view
  const fetchAbsences = async date => {
    try {
      setCalendarLoading(true);
      const {startDate, endDate} = getDateRange(date);

      console.log('📅 Fetching absences for date range:', {startDate, endDate});

      const response = await getAbsenceCalendar(startDate, endDate, token);
      console.log(
        '📅 Absence Calendar API Response:',
        JSON.stringify(response, null, 2),
      );

      if (response?.data?.calendar?.calendar) {
        const transformedAbsences = transformApiAbsences(
          response.data.calendar.calendar,
          'month',
        );
        setAbsences(transformedAbsences);
      } else {
        console.log('❌ No calendar data found in response');
        setAbsences([]);
      }
    } catch (error) {
      console.error('❌ Error fetching absence calendar:', error);
      setAbsences([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAbsences(currentDate);
    }, [token, currentDate]),
  );

  // Navigation functions
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

  // Event handlers
  const handlePressEvent = event => {
    if (showDailyView && event.isDot) {
      const eventDate = new Date(event.date);
      handleDatePress(eventDate);
      return;
    }

    if (event.isGroup) {
      // Handle group click - show all absences for that day
      console.log('Group absences:', event.absences);
      setSelectedDate(new Date(event.date));
      setDailyAbsences(event.absences);
    } else {
      // Navigate to absence details
      navigation.navigate(SCREENS.ABSENCEDETAILS, {
        absence: event,
        calendarMode: true,
      });
    }
  };

  const handleDatePress = date => {
    if (showDailyView) {
      setSelectedDate(date);
      fetchDailyAbsences(date);
    }
  };

  // Render month navigation
  const renderMonthNavigation = () => {
    const monthYear = currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return (
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navButton} onPress={goToPrevMonth}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{monthYear}</Text>

        <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render daily absences section
  const renderDailyAbsencesSection = () => {
    if (!showDailyView || !selectedDate) return null;

    return (
      <View style={styles.dailySection}>
        <View style={styles.dailySectionHeader}>
          <Text style={styles.dailySectionTitle}>
            {t('Absences for')} {selectedDate.toLocaleDateString()}
          </Text>
          <TouchableOpacity
            style={styles.closeDailyButton}
            onPress={() => setSelectedDate(null)}>
            <Text style={styles.closeDailyButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.dailyAbsencesList}
          showsVerticalScrollIndicator={true}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={Colors.lightTheme.primaryColor}
              />
              <Text style={styles.loadingText}>{t('Loading absences...')}</Text>
            </View>
          ) : dailyAbsences.length === 0 ? (
            <Text style={styles.noAbsencesText}>
              {t('No absences for this date')}
            </Text>
          ) : (
            dailyAbsences.map((absence, index) => (
              <TouchableOpacity
                key={`${absence.id}_${index}`}
                style={[
                  styles.dailyAbsenceItem,
                  {borderLeftColor: absence.color},
                ]}
                onPress={() =>
                  navigation.navigate(SCREENS.ABSENCEDETAILS, {absence})
                }>
                <View style={styles.dailyAbsenceContent}>
                  <Text style={styles.dailyAbsenceTitle}>{absence.name}</Text>
                  <Text style={styles.dailyAbsenceType}>{absence.type}</Text>
                  {absence.comment && (
                    <Text style={styles.dailyAbsenceComment}>
                      {absence.comment}
                    </Text>
                  )}
                  <View style={styles.dailyAbsenceMeta}>
                    <Text
                      style={[
                        styles.dailyAbsenceMetaText,
                        {color: absence.isPaid ? '#22C55E' : '#EF4444'},
                      ]}>
                      {absence.isPaid ? t('Paid') : t('Unpaid')}
                    </Text>
                    <Text style={styles.dailyAbsenceMetaText}>
                      {absence.isPartial ? t('Partial Day') : t('Full Day')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('Absence Calendar')}</Text>
      </View>

      {renderMonthNavigation()}

      {calendarLoading ? (
        <View style={styles.calendarLoadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.lightTheme.primaryColor}
          />
          <Text style={styles.loadingText}>{t('Loading calendar...')}</Text>
        </View>
      ) : (
        <Calendar
          events={absences}
          height={showDailyView ? (selectedDate ? hp(55) : hp(55)) : hp(55)}
          mode={'month'}
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
          headerStyle={{height: 0}} // Hide default header since we have custom navigation
          showTime={false}
          renderEvent={event => {
            if (event.isDot) {
              return (
                <View style={styles.dotContainer} pointerEvents="none">
                  <View
                    style={[styles.absenceDot, {backgroundColor: '#EF4444'}]}
                  />
                  {event.absenceCount > 1 && (
                    <Text style={styles.dotCount}>{event.absenceCount}</Text>
                  )}
                </View>
              );
            }
            return (
              <View style={styles.eventWrapper} pointerEvents="box-none">
                <View
                  style={[
                    styles.eventContainer,
                    {backgroundColor: event.color},
                  ]}
                  pointerEvents="none">
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {event.title}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {renderDailyAbsencesSection()}
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
      borderRadius: 12,
      marginVertical: hp(1),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
      paddingHorizontal: wp(2),
    },
    title: {
      fontSize: RFPercentage(2.2),
      fontWeight: 'bold',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    monthNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
      paddingHorizontal: wp(2),
    },
    navButton: {
      padding: wp(0.3),
      backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
      borderRadius: 8,
      minWidth: wp(10),
      alignItems: 'center',
    },
    navButtonText: {
      fontSize: RFPercentage(4),
      marginBottom: 6,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontWeight: 'bold',
    },
    monthLabel: {
      fontSize: RFPercentage(2),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    calendarLoadingContainer: {
      height: hp(40),
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      padding: wp(4),
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventContainer: {
      borderRadius: 6,
      padding: hp(0.8),
      marginBottom: 2,
      minHeight: hp(4),
      justifyContent: 'center',
    },
    eventTitle: {
      color: '#fff',
      fontWeight: '600',
      fontSize: RFPercentage(1.4),
      textAlign: 'center',
    },
    eventWrapper: {
      position: 'relative',
    },
    dotContainer: {
      position: 'absolute',
      top: 2,
      right: 2,
      alignItems: 'center',
      flexDirection: 'row',
    },
    absenceDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    dotCount: {
      fontSize: RFPercentage(1.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontWeight: 'bold',
      marginLeft: 2,
    },
    dailySection: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      maxHeight: hp(50),
      flex: 1,
    },
    dailySectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: wp(3),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.1)',
    },
    dailySectionTitle: {
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
    },
    closeDailyButton: {
      width: hp(3.5),
      height: hp(3.5),
      borderRadius: hp(1.75),
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: wp(2),
    },
    closeDailyButtonText: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontWeight: 'bold',
    },
    dailyAbsencesList: {
      flex: 1,
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
    },
    dailyAbsenceItem: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      padding: wp(3),
      marginVertical: hp(0.5),
      borderRadius: 8,
      borderLeftWidth: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    dailyAbsenceContent: {
      flex: 1,
    },
    dailyAbsenceTitle: {
      fontSize: RFPercentage(1.7),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.3),
    },
    dailyAbsenceType: {
      fontSize: RFPercentage(1.5),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
      textTransform: 'capitalize',
    },
    dailyAbsenceComment: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? Colors.darkTheme.secondaryTextColor : '#666',
      fontStyle: 'italic',
      marginBottom: hp(0.5),
    },
    dailyAbsenceMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dailyAbsenceMetaText: {
      fontSize: RFPercentage(1.3),
      fontWeight: '500',
    },
    loadingText: {
      textAlign: 'center',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.6),
      marginTop: hp(1),
    },
    noAbsencesText: {
      textAlign: 'center',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.6),
      padding: wp(4),
      fontStyle: 'italic',
    },
  });
