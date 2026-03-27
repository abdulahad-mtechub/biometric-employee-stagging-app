// CustomCalendar.js
import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  FlatList,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import Icon from 'react-native-vector-icons/Feather';
import {Svgs} from '../../assets/Svgs/Svgs';
import {useSelector} from 'react-redux';
import {pxToPercentage} from '../../utils/responsive';

const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month, year) => {
  return new Date(year, month, 1).getDay();
};

const isSameDate = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const CustomCalendar = ({onCalenderIconPress}) => {
  const {isDarkMode} = useSelector(store => store.theme);

  const theme = Colors[isDarkMode ? 'darkTheme' : 'lightTheme'];

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [rangeMode, setRangeMode] = useState(false);

  const dates = useMemo(() => {
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const firstWeekDay = (startOfMonth.getDay() + 6) % 7; // Adjust for Monday start
    const daysInCurrentMonth = getDaysInMonth(
      currentDate.getMonth(),
      currentDate.getFullYear(),
    );

    const days = [];
    // Previous month's trailing days
    const prevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0,
    );
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = firstWeekDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          daysInPrevMonth - i,
        ),
        currentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        currentMonth: true,
      });
    }

    // Next month's leading days
    while (days.length % 7 !== 0) {
      const nextDay = days.length - firstWeekDay + 1;
      days.push({
        date: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          nextDay,
        ),
        currentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const onDayPress = date => {
    if (rangeMode && rangeStart && !rangeEnd) {
      if (date < rangeStart) {
        setRangeStart(date);
        setRangeEnd(null);
      } else {
        setRangeEnd(date);
      }
    } else {
      setSelectedDate(date);
      setRangeStart(null);
      setRangeEnd(null);
      setRangeMode(false);
    }
  };

  const onDayLongPress = date => {
    setRangeStart(date);
    setRangeEnd(null);
    setRangeMode(true);
  };

  const isInRange = date => {
    if (!rangeStart || !rangeEnd) return false;
    return date >= rangeStart && date <= rangeEnd;
  };

  const isStart = date => rangeStart && isSameDate(date, rangeStart);
  const isEnd = date => rangeEnd && isSameDate(date, rangeEnd);

  const changeMonth = amount => {
    const newDate = new Date(
      currentDate.setMonth(currentDate.getMonth() + amount),
    );
    setCurrentDate(new Date(newDate));
  };

  const changeYear = amount => {
    const newDate = new Date(
      currentDate.setFullYear(currentDate.getFullYear() + amount),
    );
    setCurrentDate(new Date(newDate));
  };

  const renderDay = ({item}) => {
    const date = item.date;
    const isToday = isSameDate(date, today);
    const isSelected = selectedDate && isSameDate(date, selectedDate);
    const inRange = isInRange(date);
    const start = isStart(date);
    const end = isEnd(date);

    let containerStyle = [styles.dayContainer];
    let textStyle = [
      styles.dayText,
      {
        color: item.currentMonth
          ? theme.primaryTextColor
          : theme.QuaternaryText,
      },
    ];

    if (isSelected) {
      containerStyle.push(styles.selectedDay, {
        backgroundColor: theme.primaryColor,
      });
      textStyle.push({color: '#fff'});
    } else if (end) {
      containerStyle.push(styles.rangeEndPoint, {
        backgroundColor: theme.primaryColor,
      });
      textStyle.push({color: '#fff'});
    } else if (start) {
      containerStyle.push(styles.rangeStartPoint, {
        backgroundColor: theme.primaryColor,
      });
      textStyle.push({color: '#fff'});
    } else if (inRange) {
      containerStyle.push(styles.inRange, {
        backgroundColor: theme.primaryColor + '33',
      });
    }

    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={() => onDayPress(date)}
        onLongPress={() => onDayLongPress(date)}>
        <Text style={textStyle}>{date.getDate()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : Colors.lightTheme.backgroundColor,
        },
      ]}>
      <View style={styles.header}>
        <View style={{alignItems: 'center'}}>
          <View
            style={{flexDirection: 'row', alignItems: 'center', gap: wp(3)}}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Icon
                name="chevron-left"
                size={RFPercentage(2.5)}
                color={theme.iconColor}
              />
            </TouchableOpacity>
            <Text style={[styles.monthText, {color: theme.primaryTextColor}]}>
              {currentDate.toLocaleString('default', {month: 'long'})}
            </Text>

            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Icon
                name="chevron-right"
                size={RFPercentage(2.5)}
                color={theme.iconColor}
              />
            </TouchableOpacity>
          </View>
          <View
            style={{flexDirection: 'row', alignItems: 'center', gap: wp(3)}}>
            <TouchableOpacity onPress={() => changeYear(-1)}>
              <Icon
                name="chevrons-left"
                size={RFPercentage(2.5)}
                color={theme.iconColor}
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.yearText,
                {
                  color: isDarkMode
                    ? Colors.darkTheme.primaryTextColor
                    : Colors.lightTheme.secondryTextColor,
                },
              ]}>
              {currentDate.getFullYear()}
            </Text>

            <TouchableOpacity onPress={() => changeYear(1)}>
              <Icon
                name="chevrons-right"
                size={RFPercentage(2.5)}
                color={theme.iconColor}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flexDirection: 'row', gap: wp(3)}}>
          <TouchableOpacity onPress={onCalenderIconPress}>
            <Svgs.calenderMonthlyView height={hp(3.5)} width={hp(3.5)} />
          </TouchableOpacity>

          <Svgs.SearchL />
        </View>

        {/*
         */}
      </View>

      <View style={styles.weekHeader}>
        {weekDays.map(day => (
          <Text
            key={day}
            style={[styles.weekDayText, {color: theme.secondryTextColor}]}>
            {day}
          </Text>
        ))}
      </View>

      <FlatList
        data={dates}
        numColumns={7}
        scrollEnabled={false}
        renderItem={renderDay}
        keyExtractor={(item, index) => item.date.toISOString() + index}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(3),
    paddingTop: hp(2),
    borderRadius: wp(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  monthText: {
    fontFamily: Fonts.PoppinsBold,
    fontSize: RFPercentage(pxToPercentage(16)),
    textAlign: 'center',
  },
  yearText: {
    fontFamily: Fonts.PoppinsRegular,
    fontSize: RFPercentage(pxToPercentage(16)),
    textAlign: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(1),
  },
  weekDayText: {
    fontFamily: Fonts.PoppinsMedium,
    fontSize: RFPercentage(1.8),
    width: wp(12),
    textAlign: 'center',
  },
  dayContainer: {
    width: wp(12),
    height: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: wp(2),
    marginVertical: hp(0.5),
  },
  dayText: {
    fontFamily: Fonts.PoppinsRegular,
    fontSize: RFPercentage(1.8),
  },
  selectedDay: {
    borderRadius: wp(6),
  },
  inRange: {
    borderRadius: wp(0),
  },
  rangeEndPoint: {
    borderRadius: wp(0),
    borderEndEndRadius: wp(6),
    borderTopEndRadius: wp(6),

    // borderEndStartRadius: wp(6),
  },
  rangeStartPoint: {
    borderRadius: wp(0),
    // borderEndStartRadius: wp(6),
    borderStartStartRadius: wp(6),
    borderBottomStartRadius: wp(6),
  },
});

export default CustomCalendar;
