import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Fonts} from '../../Constants/Fonts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import AttendanceDetailsCard from '../../components/Cards/AttendanceDetailsCard';
import CustomButton from '../../components/Buttons/customButton';
import {Svgs} from '../../assets/Svgs/Svgs';

const WorkerAttendenceDetails = ({navigation, route}) => {
  const status = route?.params?.status;
  const valid = route?.params?.valid;
  const item = route?.params?.item;
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  // Calculate attendance data from the actual punch records
  const calculateAttendanceData = () => {
    if (!item || !item.punches || item.punches.length === 0) {
      return {
        checkIn: 'N/A',
        checkOut: 'N/A',
        workingHours: '0h 0m',
        breakTime: 'N/A',
        totalBreak: '0h 0m',
        netWorkTime: '0h 0m',
        status: status || 'Unknown',
      };
    }

    const punches = [...item.punches].sort(
      (a, b) => new Date(a.occurred_at) - new Date(b.occurred_at),
    );

    // Find check-in and check-out times
    const clockInPunch = punches.find(p => p.action_type === 'CLOCK_IN');
    const clockOutPunch = punches.find(p => p.action_type === 'CLOCK_OUT');

    const checkInTime = clockInPunch
      ? new Date(clockInPunch.occurred_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : 'N/A';

    const checkOutTime = clockOutPunch
      ? new Date(clockOutPunch.occurred_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : 'N/A';

    // Calculate total work duration
    let totalWorkMs = 0;
    if (clockInPunch && clockOutPunch) {
      totalWorkMs =
        new Date(clockOutPunch.occurred_at).getTime() -
        new Date(clockInPunch.occurred_at).getTime();
    } else if (clockInPunch) {
      // If only clocked in, calculate until now
      totalWorkMs = Date.now() - new Date(clockInPunch.occurred_at).getTime();
    }

    // Calculate break time
    let totalBreakMs = 0;
    let breakStartTime = null;
    const breakPeriods = [];

    punches.forEach(punch => {
      if (punch.action_type === 'BREAK_START') {
        breakStartTime = new Date(punch.occurred_at).getTime();
      } else if (punch.action_type === 'BREAK_END' && breakStartTime) {
        const breakEndTime = new Date(punch.occurred_at).getTime();
        const breakDuration = breakEndTime - breakStartTime;
        totalBreakMs += breakDuration;
        breakPeriods.push({
          start: new Date(breakStartTime),
          end: new Date(breakEndTime),
        });
        breakStartTime = null;
      }
    });

    // Calculate net work time (total work - break time)
    const netWorkMs = Math.max(0, totalWorkMs - totalBreakMs);

    // Format hours and minutes
    const totalWorkHours = Math.floor(totalWorkMs / (1000 * 60 * 60));
    const totalWorkMinutes = Math.floor(
      (totalWorkMs % (1000 * 60 * 60)) / (1000 * 60),
    );

    const totalBreakHours = Math.floor(totalBreakMs / (1000 * 60 * 60));
    const totalBreakMinutes = Math.floor(
      (totalBreakMs % (1000 * 60 * 60)) / (1000 * 60),
    );

    const netWorkHours = Math.floor(netWorkMs / (1000 * 60 * 60));
    const netWorkMinutes = Math.floor(
      (netWorkMs % (1000 * 60 * 60)) / (1000 * 60),
    );

    // Format break periods for display
    let breakTimeDisplay = 'N/A';
    if (breakPeriods.length > 0) {
      breakTimeDisplay = breakPeriods
        .map(period => {
          const start = period.start.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const end = period.end.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          return `${start} - ${end}`;
        })
        .join(', ');
    }

    return {
      checkIn: checkInTime,
      checkOut: checkOutTime,
      workingHours: `${totalWorkHours}h ${totalWorkMinutes}m`,
      breakTime: breakTimeDisplay,
      totalBreak: `${totalBreakHours}h ${totalBreakMinutes}m`,
      netWorkTime: `${netWorkHours}h ${netWorkMinutes}m`,
      status: status || item.status || 'Present',
    };
  };

  const attendanceData = calculateAttendanceData();

  console.log({item});

  return (
    <View style={styles.container}>
      <View style={{flex: 7}}>
        <View style={styles.headerContainer}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={30}
                color={Colors.lightTheme.iconColor}
              />
            </TouchableOpacity>

            {/* <Image source={Images.artist1} style={styles.image} /> */}
            <Text style={styles.ScreenHeading}>{item.date}, 2025</Text>
          </View>
          <TouchableOpacity>
            <Svgs.Delete />
          </TouchableOpacity>
        </View>

        <View style={styles.statusContainer}>
          <WorkerStatus
            name={'Status'}
            status={item?.status || 'Absent'}
            nameTextStyle={styles.statusText}
          />

          <WorkerStatus
            name={'Punch'}
            status={valid ? 'Valid' : 'Invalid'}
            nameTextStyle={styles.statusText}
          />
        </View>

        <AttendanceDetailsCard details={attendanceData} />
      </View>

      <View style={styles.btnContainer}>
        <CustomButton
          text={'Apply Manual Punch'}
          onPress={() => {}}
          textStyle={styles.continueButtonText}
          containerStyle={[styles.continueButton]}
        />
      </View>
    </View>
  );
};

export default WorkerAttendenceDetails;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      marginBottom: hp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      justifyContent: 'space-between',
    },
    image: {
      width: wp(10),
      height: hp(5),
      borderRadius: 100,
      marginRight: wp(2),
      marginLeft: wp(6),
    },
    ScreenHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(5),
      textAlignVertical: 'center',
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      paddingVertical: wp(2),
      paddingHorizontal: wp(3),
      marginVertical: wp(1.5),
      borderRadius: wp(2),
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.9),
    },
    value: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: hp(0.5),
      marginBottom: hp(1),
    },
    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,

      paddingVertical: wp(4),
      paddingHorizontal: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      flex: 0.5,
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(1),
    },
    continueButtonText: {
      fontSize: RFPercentage(1.9),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
  });
