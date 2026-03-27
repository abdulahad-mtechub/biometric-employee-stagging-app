import {useFocusEffect} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import moment from 'moment';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import * as Progress from 'react-native-progress';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {statusStyles} from '../../Constants/DummyData';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {getLastPunchDetails} from '../../Constants/api';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {Images} from '../../assets/Images/Images';
import {Svgs} from '../../assets/Svgs/Svgs';
import {attendancePollingManager} from '../../utils/AttendancePollingManager';
import {formatSecondsToHourMin} from '../../utils/Helpers';
import {pxToPercentage} from '../../utils/responsive';
import CustomButton from '../Buttons/customButton';
import StatusBox from './StatusBox';

const TodaysPunchCard = ({navigation, containerStyle}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const lottieRef = useRef();
  const lottieLoaderRef = useRef();
  const [checkin, setCheckin] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [CheckOut, setCheckOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [BreakProgress, setBreakProgress] = useState(0);
  const [timerValue, setTimerValue] = useState(0);
  const timerIntervalRef = useRef(null);
  const [BreakTimer, setBreakTimer] = useState(0);
  const BreakTimerIntervalRef = useRef(null);
  const [earlyOut, setEarlyOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const token = useSelector(state => state?.auth?.user?.token);
  const [currentActionType, setCurrentActionType] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const {showAlert} = useAlert();
  const [breakIn, setBreakIn] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [workStartTime, setWorkStartTime] = useState(null);
  const isUpdatingRef = useRef(false);
  const componentIdRef = useRef(Math.random().toString(36).substr(2, 9));

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
      console.log('⚠️ Missing required parameters in processAPIActionType');
      return;
    }

    try {
      switch (latestActionType) {
        case 'CLOCK_IN':
          const clockInTime = new Date(latestRecord.occurred_at).getTime();
          const currentTime = Date.now();
          const elapsedTime = Math.max(0, currentTime - clockInTime);

          setCurrentActionType('CLOCKED_IN');
          setCheckin(false);
          setConnecting(false);
          setCheckOut(false);
          setBreakIn(false);
          setWorkStartTime(clockInTime);
          setTimerValue(elapsedTime);
          setTotalBreakTime(0);
          setBreakTimer(0);
          break;

        case 'CLOCK_OUT':
          const clockInRecord = sortedRecords.find(
            record => record && record.action_type === 'CLOCK_IN',
          );
          const clockOutTime = new Date(latestRecord.occurred_at).getTime();

          let workDuration = 0;
          let calculatedBreakTime = 0;

          if (clockInRecord) {
            const clockInStart = new Date(clockInRecord.occurred_at).getTime();
            workDuration = clockOutTime - clockInStart;

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
          setCheckOut(true);
          setConnecting(false);
          setBreakIn(false);
          setCheckin(false);
          setWorkStartTime(
            clockInRecord
              ? new Date(clockInRecord.occurred_at).getTime()
              : null,
          );
          setTimerValue(workDuration);
          setTotalBreakTime(calculatedBreakTime);
          setBreakTimer(0);
          break;

        case 'BREAK_START':
          const workClockIn = sortedRecords.find(
            record => record && record.action_type === 'CLOCK_IN',
          );
          const breakStart = new Date(latestRecord.occurred_at).getTime();

          setCurrentActionType('BREAK_START');
          setBreakIn(true);
          setCheckin(false);
          setConnecting(false);
          setCheckOut(false);
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
          setCheckin(false);
          setConnecting(false);
          setCheckOut(false);
          setBreakStartTime(null);
          setBreakTimer(0);

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
          console.log('❌ Unknown action type from API:', latestActionType);
          setCurrentActionType('');
          setCheckin(true);
          setConnecting(false);
          setCheckOut(false);
          setBreakIn(false);
          setBreakTimer(0);
          break;
      }
    } catch (error) {
      console.error('❌ Error in processAPIActionType:', error);
    }
  };

  const handleAttendanceAction = actionType => {
    console.log('Starting attendance action:', actionType);

    navigation.navigate(SCREENS.ATTENDANCEFACESCANNING, {
      onVerificationSuccess: imageUrl => {
        setSelfieUrl(imageUrl);
        navigation.navigate(SCREENS.MAPSCREENATTENDANCE, {
          actionType,
          selfieUrl: imageUrl,
          onAttendanceSuccess: () => {
            console.log('Attendance success callback called for:', actionType);
            updateUIForAction(actionType);
          },
        });
      },
    });
  };

  const updateUIForAction = actionType => {
    console.log(
      `🎯 [${componentIdRef.current}] Manual UI update for:`,
      actionType,
    );

    if (isUpdatingRef.current) {
      console.log('Already updating, skipping...');
      return;
    }

    isUpdatingRef.current = true;
    const currentTime = Date.now();

    switch (actionType) {
      case 'CLOCK_IN':
        setCheckin(false);
        setConnecting(false);
        setCheckOut(false);
        setBreakIn(false);
        setWorkStartTime(currentTime);
        setTotalBreakTime(0);
        setTimerValue(0);
        setBreakTimer(0);
        setCurrentActionType('CLOCKED_IN');
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
              ? `You took ${breakMinutes} minutes ${
                  breakSeconds > 0 ? `and ${breakSeconds} seconds` : ''
                } of break.`
              : `You took ${breakSeconds} seconds of break.`;
          showAlert(breakMessage, 'success');
        }
        setBreakIn(false);
        setBreakStartTime(null);
        setBreakTimer(0);
        setCurrentActionType('CLOCKED_IN');
        break;

      case 'CLOCK_OUT':
        console.log('Processing CLOCK_OUT update');
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

        setCheckOut(true);
        setBreakIn(false);
        setCheckin(false);
        setBreakTimer(0);
        setCurrentActionType('CLOCKED_OUT');
        break;

      default:
        console.log('Unknown action type:', actionType);
        break;
    }

    const manualState = {
      actionType: getStateFromActionType(actionType),
      data: {
        isManualUpdate: true,
        actionType,
        timestamp: currentTime,
      },
      timestamp: currentTime,
    };

    if (
      attendancePollingManager &&
      typeof attendancePollingManager.updateState === 'function'
    ) {
      attendancePollingManager.updateState(manualState);
    }

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 500);
  };

  const handleSimpleAttendanceAction = async actionType => {
    // Navigate to attendance face scanning for all actions (same as Home screen)
    navigation.navigate(SCREENS.ATTENDANCEFACESCANNING, {
      onVerificationSuccess: imageUrl => {
        setSelfieUrl(imageUrl);
        // Navigate to attendance map screen
        navigation.navigate(SCREENS.MAPSCREENATTENDANCE, {
          actionType,
          selfieUrl: imageUrl,
          onAttendanceSuccess: () => {
            console.log('Attendance success callback called for:', actionType);
            updateUIForAction(actionType);
          },
        });
      },
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
    if (timerIntervalRef.current) {
      BackgroundTimer.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (currentActionType === 'CLOCKED_IN' && !breakIn && workStartTime) {
      console.log('🕐 Starting work timer');
      timerIntervalRef.current = BackgroundTimer.setInterval(() => {
        const now = Date.now();
        const elapsed = now - workStartTime;
        setTimerValue(elapsed);
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        BackgroundTimer.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentActionType, breakIn, workStartTime]);

  useEffect(() => {
    if (BreakTimerIntervalRef.current) {
      BackgroundTimer.clearInterval(BreakTimerIntervalRef.current);
      BreakTimerIntervalRef.current = null;
    }

    if (currentActionType === 'BREAK_START' && breakIn && breakStartTime) {
      console.log('🕐 Starting break timer');
      setBreakTimer(0);

      BreakTimerIntervalRef.current = BackgroundTimer.setInterval(() => {
        const now = Date.now();
        const breakElapsed = now - breakStartTime;
        setBreakTimer(breakElapsed);
      }, 1000);
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

  const fetchAttendanceData = useCallback(
    async onDataUpdate => {
      if (!token) return;

      try {
        console.log('🔄 Fetching attendance data...');
        const response = await getLastPunchDetails(token);

        if (!response || response.error) {
          console.log('❌ API error:', response?.error);
          onDataUpdate(null);
          return;
        }

        console.log('✅ API response received:', {
          message: response.message,
          recordCount: response.data?.records?.length || 0,
        });

        onDataUpdate(response);
      } catch (error) {
        console.error('❌ Fetch error:', error);
        onDataUpdate(null);
      }
    },
    [token],
  );

  const processAttendanceResponse = useCallback(response => {
    if (!response?.data?.records?.length) {
      console.log('📭 No attendance records found');
      setCurrentActionType('');
      setCheckin(true);
      setConnecting(false);
      setCheckOut(false);
      setBreakIn(false);
      setWorkStartTime(null);
      setBreakStartTime(null);
      setTotalBreakTime(0);
      setTimerValue(0);
      setBreakTimer(0);
      return;
    }

    const records = response.data.records;
    const validRecords = records.filter(
      record => record && record.action_type && record.occurred_at,
    );

    if (!validRecords.length) {
      console.log('📭 No valid records found');
      return;
    }

    const sortedRecords = validRecords.sort(
      (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
    );
    const latestRecord = sortedRecords[0];

    console.log('🔍 Latest record:', latestRecord.action_type);
    processAPIActionType(latestRecord.action_type, latestRecord, sortedRecords);
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log(
        `📱 [${componentIdRef.current}] Screen focused - fetching attendance data`,
      );

      if (!token) return;

      setIsLoading(true);

      // Fetch data with callback
      fetchAttendanceData(response => {
        setIsLoading(false);
        if (response) {
          processAttendanceResponse(response);
        }
      });

      return () => {
        console.log(`📱 [${componentIdRef.current}] Screen unfocused`);
      };
    }, [token, fetchAttendanceData, processAttendanceResponse]),
  );

  const LoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      <LottieView
        style={styles.loadingAnimation}
        source={require('../../assets/Animations/connectingLoader.json')}
        autoPlay={true}
        loop={true}
        speed={1}
      />
      <Text style={styles.loadingText}>{t('Loading punch data...')}</Text>
    </View>
  );

  const style = statusStyles[earlyOut ? t('Early Out') : t('On Time')];

  if (isLoading) {
    return (
      <View style={[styles.requestContainer, containerStyle]}>
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.requestContainer, containerStyle]}>
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.sectionHeading,
            {fontSize: RFPercentage(pxToPercentage(16))},
          ]}>
          {t("Today's Punch")}
        </Text>
        <View style={styles.todayDate}>
          <Text style={styles.dateText}>{moment().format('DD MMM, YY')}</Text>
        </View>
      </View>

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
            style={[{position: 'absolute', top: hp(10.4), right: wp(20.5)}]}
            progress={progress}
            indeterminate={false}
            size={157}
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
        currentActionType === 'ON_BREAK' ||
        currentActionType === 'BREAK_START' ? (
        <ImageBackground
          source={
            currentActionType === 'ON_BREAK' ||
            currentActionType === 'BREAK_START'
              ? Images.checkoutEarlyOut
              : Images.connected
          }
          style={styles.checkinImage}>
          {breakIn && (
            <Progress.Circle
              style={[{position: 'absolute', top: hp(4.9), right: wp(10.3)}]}
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
                currentActionType === 'ON_BREAK' ||
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
            {breakIn ? <Svgs.breakCupOutline /> : <Svgs.clockCheckinWhite />}

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
          source={earlyOut ? Images.checkoutEarlyOut : Images.checkoutOntime}
          style={styles.checkinImage}>
          <View
            style={[
              styles.checkinBtn,
              earlyOut
                ? {backgroundColor: '#9F8FEF'}
                : {backgroundColor: '#4BCE97'},
            ]}>
            <Svgs.clockCheckinWhite />
            <Text style={[styles.checkin, {color: '#FFFFFF'}]}>
              {formatTimeSmooth(timerValue)}
            </Text>
          </View>
        </ImageBackground>
      ) : (
        <ImageBackground source={Images.checkin1} style={styles.checkinImage}>
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
        currentActionType === 'ON_BREAK' ||
        currentActionType === 'BREAK_START') && (
        <View style={styles.breakBtnContainer}>
          {!breakIn ? (
            <>
              <CustomButton
                text={'Break Start'}
                onPress={() => toggleTimer()}
                svg={<Svgs.breakCupFilled />}
                textStyle={styles.breakInBtnText}
                containerStyle={[styles.breakInBtn]}
              />
              <CustomButton
                text={'Check Out'}
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
                text={'Check Out'}
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
            value={formatSecondsToHourMin(Math.floor(timerValue / 1000))}
          />
          <Row
            label={'Status'}
            valueComponent={
              <StatusBox
                status={style?.name}
                backgroundColor={style?.backgroundColor}
                color={style?.color}
                icon={style?.icon}
              />
            }
          />
          <Row
            label={'Break'}
            value={formatSecondsToHourMin(Math.floor(totalBreakTime / 1000))}
          />

          <CustomButton
            text={t('View Details')}
            textStyle={styles.CheckOutBtnText}
            containerStyle={[
              styles.breakInBtn,
              {
                backgroundColor: Colors.lightTheme.primaryColor,
                width: '100%',
                marginTop: hp(2),
              },
            ]}
            contentContainer={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: wp(3.5),
            }}
            rightSvg={<Svgs.chevronRight />}
            onPress={() => navigation.navigate(SCREENS.VIEWATTENDANCEDETAILS)}
          />
        </View>
      )}
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    sectionHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
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
    breakBtnContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
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
    },
    CheckOutBtnText: {
      color: '#ffffff',
      fontSize: RFPercentage(pxToPercentage(15)),
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
    skeletonHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    skeletonTitle: {
      width: wp(40),
      height: hp(2.5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
    },
    skeletonDate: {
      width: wp(25),
      height: hp(2),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(1),
    },
    skeletonCircle: {
      width: wp(70),
      height: wp(70),
      borderRadius: wp(35),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      alignSelf: 'center',
      marginVertical: hp(3),
      alignItems: 'center',
      justifyContent: 'center',
    },
    skeletonInnerCircle: {
      width: wp(20),
      height: wp(20),
      borderRadius: wp(10),
      backgroundColor: isDarkMode ? '#444' : '#F0F0F0',
    },
    skeletonButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: hp(2),
    },
    skeletonButton: {
      width: wp(35),
      height: hp(5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: wp(2),
    },
  });

export default TodaysPunchCard;
