import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {statusStyles} from '../../../../Constants/DummyData';
import {Fonts} from '../../../../Constants/Fonts';
import {Colors} from '../../../../Constants/themeColors';
import TodaysPunchCard from '../../../../components/Cards/TodaysPunchCard';
import MapComponent from '../../../../components/Maps/LeafLetMap';
import {pxToPercentage} from '../../../../utils/responsive';
import {getLastPunchDetails} from '../../../../Constants/api';

const TodaysPunch = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const lottieRef = useRef();
  const lottieLoaderRef = useRef();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const timerIntervalRef = useRef(null);
  const [initialMarkers, setInitialMarkers] = useState([]);
  const BreakTimerIntervalRef = useRef(null);
  const [earlyOut, setEarlyOut] = useState(false);
  const mapRef = useRef(null);
  const token = useSelector(state => state?.auth?.user?.token);
  const hasInitializedRef = useRef(false);

  const Row = ({label, value, valueComponent, containerStyle}) => {
    return (
      <View style={[styles.row, containerStyle]}>
        <Text style={styles.label}>{t(label)}</Text>
        {valueComponent ? (
          <View style={styles.value}>{valueComponent}</View>
        ) : (
          <Text style={styles.valueText}>{value}</Text>
        )}
      </View>
    );
  };

  const transformPunchDataToMarkers = useCallback(responseData => {
    if (!responseData?.data?.records) return [];

    const latestRecord = responseData.data.records[0];
    const {locationData, actionType, timeData} = latestRecord;

    return [
      {
        lat: locationData.gps.latitude,
        lng: locationData.gps.longitude,
        title: `Latest: ${actionType.replace('_', ' ')} - ${timeData.time}`,
        id: latestRecord.punchId,
        actionType: actionType,
        time: timeData.time,
        date: timeData.date,
        address: locationData.textDescription,
        accuracy: locationData.gps.accuracy,
        status: latestRecord.validation.overallStatus,
        reviewStatus: latestRecord.validation.reviewStatus,
        phone: responseData.data.worker.employeeId,
        type: actionType,
        country: locationData.textDescription,
      },
    ];
  }, []);

  const fetchLastPunchDetails = useCallback(async () => {
    if (!token || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    try {
      const response = await getLastPunchDetails(token);
      const markers = transformPunchDataToMarkers(response);
      setInitialMarkers(markers);
    } catch (error) {
      console.error('Error fetching last punch details:', error);
      hasInitializedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (token && !hasInitializedRef.current) {
      fetchLastPunchDetails();
    }
  }, []);

  useEffect(() => {
    if (connecting) {
      lottieRef.current?.play();
      lottieLoaderRef.current?.play();

      const timer = setTimeout(() => {
        const interval = setInterval(() => {}, 800);
      }, 1500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, []);

  useEffect(() => {
    if (connected && !breakIn) {
      timerIntervalRef.current = BackgroundTimer.setInterval(() => {}, 1000);
    }

    return () => {
      BackgroundTimer.clearInterval(timerIntervalRef.current);
    };
  }, []);

  const [breakIn, setBreakIn] = useState(false);

  const MAX_BREAK_SECONDS = 3600; // 1 hour

  const toggleTimer = () => {
    if (breakIn) {
      // Resume main work timer
      timerIntervalRef.current = BackgroundTimer.setInterval(() => {}, 1000);

      setBreakIn(false);

      // Stop break timer
      BackgroundTimer.clearInterval(BreakTimerIntervalRef.current);
    } else {
      // setBreakTimer(0);
      // Start break
      BreakTimerIntervalRef.current = BackgroundTimer.setInterval(() => {},
      1000);

      setBreakIn(true);

      BackgroundTimer.clearInterval(timerIntervalRef.current);
    }
  };

  const style = statusStyles[earlyOut ? 'Early Out' : 'On Time'];

  return (
    <View style={styles.container}>
      <MapComponent
        ref={mapRef}
        initialLat={initialMarkers.length > 0 ? initialMarkers[0].lat : 51.505}
        initialLng={initialMarkers.length > 0 ? initialMarkers[0].lng : -0.09}
        initialZoom={15}
        markers={initialMarkers}
        style={styles.mapImage}
        initialMarkerTitle="Latest Punch Location"
        showSearch={false}
        scrollEnabled={false}
        searchPlaceholder={t('Find a place...')}
        onLocationFound={result => {
          console.log('Found:', result);
        }}
      />
      <TodaysPunchCard
        navigation={navigation}
        containerStyle={{marginHorizontal: 10}}
      />
      <View style={styles.requestContainer}>
        <View style={[styles.rowSb, styles.workerStatusContainer]}>
          <Text style={styles.SubHeading}>{t('Request Name')}</Text>
          <Text style={styles.SubHeading}>{t('Status')}</Text>
        </View>
        <Row
          label={'Task Assigned'}
          value={'03:48 PM'}
          containerStyle={{marginBottom: hp(1.5)}}
        />
        <Row
          label={'Break End'}
          value={'2:01 PM'}
          containerStyle={{marginBottom: hp(1.5)}}
        />
        <Row
          label={'Break Start'}
          value={'01:03 PM'}
          containerStyle={{marginBottom: hp(1.5)}}
        />
        <Row
          label={'Received Message'}
          value={'10:28 AM'}
          containerStyle={{marginBottom: hp(1.5)}}
        />
        <Row
          label={'Document Downloaded'}
          value={'09:35 AM'}
          containerStyle={{marginBottom: hp(1.5)}}
        />
        <Row
          label={'Clock-In'}
          value={'09:12 AM'}
          containerStyle={{marginBottom: hp(1.5)}}
        />
      </View>
    </View>
  );
};

export default TodaysPunch;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    mapImage: {
      width: wp(100),
      height: hp(40),
      marginTop: -hp(1.4),
      position: 'relative',
    },
    mapDateContainer: {
      position: 'absolute',
      bottom: hp(2),
      right: wp(0),
      backgroundColor: '#003149',
      padding: hp(1),
      borderRadius: hp(100),
    },
    requestContainer: {
      paddingHorizontal: wp(4),
      // paddingBottom: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(5),
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
    sectionHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
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
      //   marginHorizontal: wp(3),
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
      // flex: 1,
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
      // backgroundColor: 'red'
      // marginHorizontal: hp(4),
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
      // paddingHorizontal: wp(5),
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

      //   width: "40%",
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
    breakBtnContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(3),
    },
    workerStatusContainer: {
      marginTop: hp(2),
      paddingBottom: hp(0.5),
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderBottomWidth: 1,
      marginBottom: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });
