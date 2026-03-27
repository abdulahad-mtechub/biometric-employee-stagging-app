import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Svg, {Circle} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';

const cardStyles = {
  Employees: {
    icon: <Icon name="person" size={hp(3)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  'Assigned Task': {
    icon: <Icon name="assignment" size={hp(3)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  'Pending Task': {
    icon: <Icon name="schedule" size={hp(3)} color="#fff" />,
    backgroundColor: '#F87168',
    subTextIcon: <Icon name="trending-down" size={hp(2)} color="#F87168" />,
  },
  'Start Task': {
    icon: <Icon name="play-arrow" size={hp(3)} color="#fff" />,
    backgroundColor: '#9F8FEF',
    subTextIcon: <Icon name="autorenew" size={hp(2)} color="#9F8FEF" />,
  },
  'On-Time Start Task': {
    icon: <Icon name="check-circle" size={hp(3)} color="#fff" />,
    backgroundColor: '#4BCE97',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  'Late Start Task': {
    icon: <Icon name="schedule" size={hp(3)} color="#fff" />,
    backgroundColor: '#F87168',
    subTextIcon: <Icon name="trending-down" size={hp(2)} color="#F87168" />,
  },
  'End Task': {
    icon: <Icon name="stop" size={hp(3)} color="#fff" />,
    backgroundColor: '#9F8FEF',
    subTextIcon: <Icon name="autorenew" size={hp(2)} color="#9F8FEF" />,
  },
  'On-Time End Task': {
    icon: <Icon name="check-circle" size={hp(3)} color="#fff" />,
    backgroundColor: '#4BCE97',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  'Late End Task': {
    icon: <Icon name="schedule" size={hp(3)} color="#fff" />,
    backgroundColor: '#F87168',
    subTextIcon: <Icon name="trending-down" size={hp(2)} color="#F87168" />,
  },
  'Not Done': {
    icon: <Icon name="error" size={hp(3)} color="#fff" />,
    backgroundColor: '#FEA362',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Cancelled Task': {
    icon: <Icon name="cancel" size={hp(3)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  'Urgent Priority': {
    icon: <Icon name="priority-high" size={hp(3)} color="#fff" />,
    backgroundColor: '#F87168',
    subTextIcon: <Icon name="trending-down" size={hp(2)} color="#F87168" />,
  },
  'High Priority': {
    icon: <Icon name="keyboard-arrow-up" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Medium Priority': {
    icon: <Icon name="remove" size={hp(3)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Low Priority': {
    icon: <Icon name="keyboard-arrow-down" size={hp(3)} color="#fff" />,
    backgroundColor: '#4BCE97',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  'Unvalidated Tasks': {
    icon: <Icon name="help" size={hp(3)} color="#fff" />,
    backgroundColor: '#FEA362',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Unread Reimbursements': {
    icon: <Icon name="attach-money" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Unread Payroll': {
    icon: <Icon name="account-balance-wallet" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Unread Requests': {
    icon: <Icon name="request-page" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Unread Messages': {
    icon: <Icon name="message" size={hp(3)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Unread Documents': {
    icon: <Icon name="description" size={hp(3)} color="#fff" />,
    backgroundColor: '#9F8FEF',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Unread Notifications': {
    icon: <Icon name="notifications" size={hp(3)} color="#fff" />,
    backgroundColor: '#FEA362',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Assigned Tasks': {
    icon: <Icon name="assignment" size={hp(3)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  'Pending Tasks': {
    icon: <Icon name="schedule" size={hp(3)} color="#fff" />,
    backgroundColor: '#F87168',
    subTextIcon: <Icon name="trending-down" size={hp(2)} color="#F87168" />,
  },
  'Reimbursement Received': {
    icon: <Icon name="payment" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Salary Received': {
    icon: <Icon name="download" size={hp(2.5)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Total Requests': {
    icon: <Icon name="list-alt" size={hp(2.5)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Total Documents': {
    icon: <Icon name="description" size={hp(3)} color="#fff" />,
    backgroundColor: '#9F8FEF',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Total Messages': {
    icon: <Icon name="send" size={hp(2.5)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Total Notifications': {
    icon: <Icon name="notifications" size={hp(2.5)} color="#fff" />,
    backgroundColor: '#FEA362',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  Departments: {
    icon: <Icon name="group" size={hp(3)} color="#fff" />,
    backgroundColor: '#9F8FEF',
  },
  Request: {
    icon: <Icon name="request-page" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
  },
  'Ongoing Projects': {
    icon: <Icon name="work" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  Today: {
    icon: <Icon name="today" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
  },
  'Completed Projects': {
    icon: <Icon name="check-circle" size={hp(3)} color="#fff" />,
    backgroundColor: '#4BCE97',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  Completed: {
    icon: <Icon name="check-circle" size={hp(3)} color="#fff" />,
    backgroundColor: '#4BCE97',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  'Completed Task': {
    icon: <Icon name="check-circle" size={hp(3)} color="#fff" />,
    backgroundColor: '#4BCE97',
    subTextIcon: <Icon name="trending-up" size={hp(2)} color="#4BCE97" />,
  },
  Ongoing: {
    icon: <Icon name="hourglass-top" size={hp(3)} color="#fff" />,
    backgroundColor: '#9F8FEF',
    subTextIcon: <Icon name="autorenew" size={hp(2)} color="#9F8FEF" />,
  },
  'In Progress': {
    icon: <Icon name="hourglass-top" size={hp(3)} color="#fff" />,
    backgroundColor: '#9F8FEF',
    subTextIcon: <Icon name="autorenew" size={hp(2)} color="#9F8FEF" />,
  },
  Requests: {
    icon: <Icon name="request-page" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Assigned Projects': {
    icon: <Icon name="assignment" size={hp(3)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  Assigned: {
    icon: <Icon name="assignment" size={hp(3)} color="#fff" />,
    backgroundColor: '#579DFF',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  Delayed: {
    icon: <Icon name="schedule" size={hp(3)} color="#fff" />,
    backgroundColor: '#F87168',
    subTextIcon: <Icon name="trending-down" size={hp(2)} color="#F87168" />,
  },
  Overdue: {
    icon: <Icon name="schedule" size={hp(3)} color="#fff" />,
    backgroundColor: '#F87168',
    subTextIcon: <Icon name="trending-down" size={hp(2)} color="#F87168" />,
  },
  Issue: {
    icon: <Icon name="report-problem" size={hp(3)} color="#fff" />,
    backgroundColor: '#FEA362',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  Hold: {
    icon: <Icon name="pause" size={hp(3)} color="#fff" />,
    backgroundColor: '#F5CD47',
    subTextIcon: <Icon name="event" size={hp(2)} color="#579DFF" />,
  },
  'Half Leave': {
    subTextIcon: <Icon name="check-circle" size={hp(2)} color="#4BCE97" />,
  },
  'Sick Leave': {
    subTextIcon: <Icon name="check-circle" size={hp(2)} color="#4BCE97" />,
  },
  'Urgent Leave': {
    subTextIcon: <Icon name="check-circle" size={hp(2)} color="#4BCE97" />,
  },
  'Annual Leave': {
    subTextIcon: <Icon name="check-circle" size={hp(2)} color="#4BCE97" />,
  },
};

export default function DashboardCard({title, value, subText, progress}) {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {icon, backgroundColor, subTextIcon} = cardStyles[title] || {
    icon: <Icon name="dashboard" size={hp(3)} color="#fff" />,
    backgroundColor: '#9CA3AF',
    subTextIcon: null,
  };

  const getNavigationTarget = title => {
    const navigationMap = {
      'Assigned Tasks': SCREENS.TASKS,
      'Pending Tasks': SCREENS.TASKS,
      'Assigned Task': SCREENS.TASKS,
      'Pending Task': SCREENS.TASKS,
      'Completed Task': SCREENS.TASKS,
      'Completed Tasks': SCREENS.TASKS,
      'In Progress': SCREENS.TASKS,
      Ongoing: SCREENS.TASKS,
      'Start Task': SCREENS.TASKS,
      'End Task': SCREENS.TASKS,
      'On-Time Start Task': SCREENS.TASKS,
      'Late Start Task': SCREENS.TASKS,
      'On-Time End Task': SCREENS.TASKS,
      'Late End Task': SCREENS.TASKS,
      Completed: SCREENS.TASKS,
      'Not Done': SCREENS.TASKS,
      'Cancelled Task': SCREENS.TASKS,
      Delayed: SCREENS.TASKS,
      Overdue: SCREENS.TASKS,
      'Unvalidated Tasks': SCREENS.TASKS,
      'Reimbursement Received': SCREENS.PAYMENTS,
      'Salary Received': SCREENS.PAYMENTS,
      'Total Requests': SCREENS.REQUESTMANAGEMENT,
      'Total Documents': SCREENS.MYDOCUMENTS,
      'Total Messages': SCREENS.MESSAGES,
      'Total Notifications': SCREENS.NOTIFICATIONS,
      'Total Days': SCREENS.ATTENDANCE,
      'Working Days': SCREENS.ATTENDANCE,
      'Present Days': SCREENS.ATTENDANCE,
      'Total Punches': SCREENS.ATTENDANCE,
      'Late Arrivals': SCREENS.ATTENDANCE,
      'Early Outs': SCREENS.ATTENDANCE,
      'Working Hours': SCREENS.ATTENDANCE,
      'Days with Issues': SCREENS.ATTENDANCE,
    };

    // First try to find exact match
    const exactMatch = navigationMap[title];
    if (exactMatch) {
      return exactMatch;
    }

    // Check if title contains task-related keywords
    const taskKeywords = [
      'task',
      'assigned',
      'pending',
      'completed',
      'progress',
    ];
    const titleLower = title.toLowerCase();
    if (taskKeywords.some(keyword => titleLower.includes(keyword))) {
      return SCREENS.TASKS;
    }

    // Check if this is an attendance card based on subText
    const attendanceKeywords = [
      'month days',
      'scheduled days',
      'days attended',
      'clock in/out',
      'late arrivals',
      'left early',
      'total hours',
      'require review',
    ];
    const subTextStr = String(subText || '').toLowerCase();
    const isAttendanceCard = attendanceKeywords.some(keyword =>
      subTextStr.includes(keyword),
    );

    if (isAttendanceCard) {
      return SCREENS.ATTENDANCE;
    }

    // Default fallback
    return SCREENS.ATTENDANCE;
  };

  return (
    <Pressable
      style={[styles.card]}
      onPress={() => {
        const targetScreen = getNavigationTarget(title);
        navigation.navigate(targetScreen);
      }}>
      {typeof progress === 'number' ? (
        <View style={styles.circleWrapper}>
          <Svg height={hp(5)} width={hp(5)} viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="#E5E7EB"
              strokeWidth="10"
              fill="none"
            />
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="#0074D9"
              strokeWidth="10"
              fill="none"
              strokeDasharray={Math.PI * 2 * 45}
              strokeDashoffset={Math.PI * 2 * 45 * (1 - progress / 100)}
              strokeLinecap="round"
              rotation="-90"
              origin="50, 50"
            />
          </Svg>
        </View>
      ) : (
        <View style={[styles.iconContainer, {backgroundColor}]}>{icon}</View>
      )}

      <Text style={styles.title}>{t(title)}</Text>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.subTextRow}>
        {subTextIcon && <View style={styles.subTextIcon}>{subTextIcon}</View>}
        <Text style={[styles.subText, subTextIcon && {marginLeft: wp('1%')}]}>
          {subText}
        </Text>
      </View>
    </Pressable>
  );
}

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    card: {
      width: wp('48%'),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp('3%'),
      paddingLeft: wp('4%'),
      paddingTop: hp('2%'),
      paddingBottom: hp('1%'),
      marginRight: wp('4%'),
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,

      // height: hp('23%'),
    },
    iconContainer: {
      width: wp('10%'),
      height: wp('10%'),
      borderRadius: wp('100%'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: hp('1.5%'),
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    value: {
      fontSize: RFPercentage(pxToPercentage(28)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    subTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: hp('0.5%'),
      paddingRight: wp('3%'),
    },
    subTextIcon: {
      marginRight: wp('1%'),
    },
    subText: {
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    progressBackground: {
      height: hp(5),
      backgroundColor: '#ddd',
      borderRadius: wp(100),
      width: '40%',
      overflow: 'hidden',
      marginRight: hp(2),
    },
    circleWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      width: hp(6),
      height: hp(6),
      marginBottom: hp(1.5),
    },
    progressValue: {
      position: 'absolute',
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsSemiBold,
      color: '#111',
    },
    progressFill: {
      height: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
  });
