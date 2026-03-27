import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import StackHeader from '../../components/Header/StackHeader';
import {pxToPercentage} from '../../utils/responsive';

const AttendenceRequestDetails = ({route, navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const item = route?.params?.item;
  const [expandedPunch, setExpandedPunch] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState(null);
  const styles = dynamicStyles(isDarkMode, theme);
  console.log('item', JSON.stringify(item, null, 2));
  // Format date for display
  const formatDisplayDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get user's timezone
  const userTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Helper: Convert UTC time string to local timezone time string
  const convertUtcToLocal = (timeString, userTimezone) => {
    if (!timeString) return 'N/A';
    // Convert UTC time string to user's timezone
    try {
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      const now = new Date();
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
      const tz = userTimezone || 'UTC';
      const localHours = String(
        utcDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          hour12: false,
          timeZone: tz,
        }),
      ).padStart(2, '0');
      const localMinutes = String(
        utcDate.toLocaleTimeString('en-US', {minute: '2-digit', timeZone: tz}),
      ).padStart(2, '0');
      const localSeconds = String(
        utcDate.toLocaleTimeString('en-US', {second: '2-digit', timeZone: tz}),
      ).padStart(2, '0');
      return `${localHours}:${localMinutes}:${localSeconds}`;
    } catch (e) {
      return timeString;
    }
  };

  // Format time for display (12-hour format)
  const formatTime = timeString => {
    if (!timeString) return 'N/A';
    // Handle both "HH:MM:SS" and "HH:MM AM/PM" formats
    if (timeString.includes(' ')) return timeString;

    // Convert UTC time to local time first, then format
    const localTimeString = convertUtcToLocal(timeString, userTimezone);
    const [hours, minutes] = localTimeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get status color
  const getStatusColor = status => {
    switch (status) {
      case t('Present'):
        return '#10B981';
      case t('Has Issues'):
        return '#F59E0B';
      case t('Absent'):
        return '#EF4444';
      case t('Late'):
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  // Get punch type display text
  const getPunchTypeText = actionType => {
    switch (actionType) {
      case 'CLOCK_IN':
        return t('Clock In');
      case 'CLOCK_OUT':
        return t('Clock Out');
      case 'BREAK_START':
        return t('Break Start');
      case 'BREAK_END':
        return t('Break End');
      default:
        return actionType;
    }
  };

  // Get punch status color
  const getPunchStatusColor = punchStatus => {
    switch (punchStatus) {
      case 'Valid':
        return '#10B981';
      case 'Location Issue':
        return '#F59E0B';
      case 'Face Match Failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Calculate total break time
  const calculateBreakTime = () => {
    const breakMinutes = item?.break_time_minutes || 0;
    const hours = Math.floor(breakMinutes / 60);
    const minutes = breakMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Attendance Details Data
  const attendanceDetails = [
    {label: t('Date'), value: formatDisplayDate(item?.date)},
    {
      label: t('Clock in'),
      value: formatTime(item?.first_check_in || item?.firstCheckIn),
    },
    {
      label: t('Clock out'),
      value: formatTime(item?.last_check_out || item?.lastCheckOut),
    },
    {
      label: t('Working Hours'),
      value: `${(item?.working_hours || item?.workingHours || 0).toFixed(2)}h`,
    },
    {
      label: t('Total Punches'),
      value: item?.total_punches || item?.totalPunches || 0,
    },
    {label: t('Break Time'), value: calculateBreakTime()},
  ];

  const Row = ({label, value, isLast = false}) => (
    <View style={[styles.row, isLast && {marginBottom: 0}]}>
      <Text style={styles.label}>{t(label)}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );

  const PunchRow = ({punch}) => {
    const isExpanded = expandedPunch === punch.id;

    return (
      <View style={styles.punchContainer}>
        <TouchableOpacity
          style={styles.punchHeader}
          onPress={() => setExpandedPunch(isExpanded ? null : punch.id)}>
          <View style={styles.punchInfo}>
            <Text style={styles.punchTime}>{formatTime(punch.punch_time)}</Text>
            <Text style={styles.punchType}>
              {getPunchTypeText(punch.action_type)}
            </Text>
          </View>
          <View style={styles.punchStatus}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: getPunchStatusColor(
                    punch.verification?.punch_status,
                  ),
                },
              ]}
            />
            <Text style={styles.punchStatusText}>
              {t(punch.verification?.punch_status)}
            </Text>
            <Svgs.ChevronDownFilled
              height={wp(4)}
              width={wp(4)}
              style={{transform: [{rotate: isExpanded ? '180deg' : '0deg'}]}}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.punchDetails}>
            {/* Location Details */}
            {/* <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{t('Location')}</Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color: punch.location?.location_validated
                      ? '#10B981'
                      : '#EF4444',
                  },
                ]}>
                {punch.location?.location_validated
                  ? t('Valid Location')
                  : t('Invalid Location')}
              </Text>
              {punch.location?.distance_from_office !== null &&
                punch.location?.distance_from_office !== undefined && (
                  <Text style={styles.detailSubtext}>
                    {Math.round(punch.location.distance_from_office)}m{' '}
                    {t('from office')}
                  </Text>
                )}
            </View> */}

            {/* Verification Details */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{t('Verification')}</Text>
              <Text style={styles.detailValue}>
                {punch.verification?.face_matched
                  ? t('Face Matched')
                  : t('Face Not Matched')}
              </Text>
              {punch.verification?.face_match_score && (
                <Text style={styles.detailSubtext}>
                  {t('Match Score')}:{' '}
                  {(
                    parseFloat(punch.verification.face_match_score) * 100
                  ).toFixed(1)}
                  %
                </Text>
              )}
              {punch.verification?.review_status && (
                <Text style={styles.detailSubtext}>
                  {t('Review Status')}: {t(punch.verification.review_status)}
                </Text>
              )}
            </View>

            {/* Device Info */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{t('Device')}</Text>
              <Text style={styles.detailValue}>
                {punch.device_info?.source === 'mobile'
                  ? t('Mobile App')
                  : t('Web')}
              </Text>
              <Text style={styles.detailSubtext}>
                {t('Version')}: {punch.device_info?.app_version}
              </Text>
              {punch.device_info?.device_id && (
                <Text style={styles.detailSubtext}>
                  {t('Device ID')}:{' '}
                  {punch.device_info.device_id.substring(0, 12)}...
                </Text>
              )}
            </View>

            {/* Timestamp Info */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{t('Timestamp')}</Text>
              <Text style={styles.detailValue}>
                {new Date(punch.occurred_at).toLocaleString()}
              </Text>
              {punch.timestamps?.created_at && (
                <Text style={styles.detailSubtext}>
                  {t('Recorded')}:{' '}
                  {new Date(punch.timestamps.created_at).toLocaleString()}
                </Text>
              )}
            </View>

            {/* GPS Coordinates */}
            {punch.location?.gps_latitude && punch.location?.gps_longitude && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>{t('GPS Coordinates')}</Text>
                <Text style={styles.detailValue}>
                  {parseFloat(punch.location.gps_latitude).toFixed(6)},{' '}
                  {parseFloat(punch.location.gps_longitude).toFixed(6)}
                </Text>
                {punch.location?.gps_accuracy && (
                  <Text style={styles.detailSubtext}>
                    {t('Accuracy')}: {punch.location.gps_accuracy}m
                  </Text>
                )}
              </View>
            )}

            {/* Selfie Evidence */}
            {punch.evidence?.selfie_url && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>{t('Selfie')}</Text>
                {imageErrors[punch.id] ? (
                  <Icon
                    name="broken-image"
                    size={60}
                    color="gray"
                    style={styles.selfieImage}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setImageViewerUrl(punch.evidence.selfie_url);
                      setImageViewerVisible(true);
                    }}>
                    <Image
                      source={{uri: punch.evidence.selfie_url}}
                      style={styles.selfieImage}
                      resizeMode="cover"
                      onError={() =>
                        setImageErrors(prev => ({...prev, [punch.id]: true}))
                      }
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        <StackHeader
          title={item?.name || t('Attendance Details')}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />

        {/* Status Card */}
        <View style={styles.statusContainer}>
          <WorkerStatus
            name={t('Status')}
            status={t(item?.status)}
            nameTextStyle={styles.statusText}
          />
          <View style={styles.rowSb}>
            <Text
              style={[
                styles.statusText,
                {color: getStatusColor(item?.status)},
              ]}>
              {t(item?.status)}
            </Text>
            <Text style={styles.dateText}>{formatDisplayDate(item?.date)}</Text>
          </View>
        </View>

        {/* Attendance Summary */}
        <View style={styles.cardContainer}>
          <Text style={styles.title}>{t('Attendance Summary')}</Text>
          {attendanceDetails.map((detail, index) => (
            <Row
              key={detail.label}
              label={detail.label}
              value={detail.value}
              isLast={index === attendanceDetails.length - 1}
            />
          ))}
        </View>

        {/* Punch History */}
        <View style={styles.cardContainer}>
          <View style={styles.rowSb}>
            <Text style={styles.title}>{t('Punch History')}</Text>
            <Text style={styles.punchCount}>
              {item?.punches?.length || 0} {t('punches')}
            </Text>
          </View>

          <View style={styles.punchesList}>
            {item?.punches && item.punches.length > 0 ? (
              item.punches.map((punch, index) => (
                <PunchRow key={punch.id} punch={punch} />
              ))
            ) : (
              <Text style={styles.noPunchesText}>
                {t('No punch records available')}
              </Text>
            )}
          </View>
        </View>

        {/* Issues Section - Only show if there are issues */}
        {(item?.status === 'Has Issues' ||
          item?.status === t('Has Issues')) && (
          <View style={[styles.cardContainer, styles.issuesContainer]}>
            <View style={styles.issuesHeader}>
              <Svgs.alertOutline height={wp(5)} width={wp(5)} />
              <Text style={styles.issuesTitle}>{t('Attendance Issues')}</Text>
            </View>
            <Text style={styles.issuesText}>
              {t(
                'Some punches have location validation issues. Please review the punch history for details.',
              )}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {/* <View style={styles.btnContainer}>
        {item?.status === 'Has Issues' ? (
          <CustomButton
            text={'Request Review'}
            onPress={() => {}}
            textStyle={styles.continueButtonText}
            containerStyle={[styles.continueButton]}
          />
        ) : (
          <CustomButton
            text={'Export Report'}
            onPress={() => {}}
            textStyle={styles.continueButtonText}
            containerStyle={[styles.continueButton]}
          />
        )}
      </View> */}

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        onRequestClose={() => setImageViewerVisible(false)}>
        <ImageViewer
          imageUrls={[{url: imageViewerUrl || ''}]}
          enableSwipeDown={true}
          onSwipeDown={() => setImageViewerVisible(false)}
          onCancel={() => setImageViewerVisible(false)}
          saveToLocalByLongPress={false}
          backgroundColor="rgba(0, 0, 0, 0.95)"
          renderHeader={() => (
            <TouchableOpacity
              style={styles.imageViewerCloseButton}
              onPress={() => setImageViewerVisible(false)}>
              <Icon
                name="close"
                size={RFPercentage(4)}
                color={theme.backgroundColor}
              />
            </TouchableOpacity>
          )}
          loadingRender={() => (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{color: theme.backgroundColor}}>
                {t('Loading...')}
              </Text>
            </View>
          )}
          enableImageZoom={true}
          doubleClickInterval={250}
          maxOverflow={300}
        />
      </Modal>
    </View>
  );
};

export default AttendenceRequestDetails;

const dynamicStyles = (isDarkMode, theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    headerTxtStyle: {
      textAlign: 'left',
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      paddingVertical: wp(3),
      paddingHorizontal: wp(4),
      marginTop: wp(2),
      borderRadius: wp(2),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: theme.primaryTextColor,
      fontSize: RFPercentage(pxToPercentage(16)),
    },
    dateText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    rowSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(0.5),
    },
    cardContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
      marginHorizontal: wp(4),
      marginBottom: hp(2),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      marginTop: hp(1),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.5),
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    valueContainer: {
      flex: 1.2,
      alignItems: 'flex-end',
    },
    value: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'right',
    },
    title: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
    },
    punchCount: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    punchesList: {
      marginTop: hp(1),
    },
    punchContainer: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    punchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1.2),
    },
    punchInfo: {
      flex: 1,
    },
    punchTime: {
      fontFamily: Fonts.NunitoSemiBold,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: 2,
    },
    punchType: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    punchStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: wp(2),
      height: wp(2),
      borderRadius: wp(1),
      marginRight: wp(1.5),
    },
    punchStatusText: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginRight: wp(2),
    },
    punchDetails: {
      padding: wp(3),
      backgroundColor: isDarkMode
        ? `${Colors.darkTheme.backgroundColor}50`
        : `${Colors.lightTheme.secondryColor}50`,
      borderRadius: wp(2),
      marginBottom: hp(1),
    },
    detailSection: {
      marginBottom: hp(1.5),
    },
    detailLabel: {
      fontFamily: Fonts.NunitoSemiBold,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: 2,
    },
    detailValue: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    detailSubtext: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(10)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      opacity: 0.7,
    },
    selfieImage: {
      width: wp(20),
      height: wp(20),
      borderRadius: wp(2),
      marginTop: hp(0.5),
      resizeMode: 'contain',
    },
    issuesContainer: {
      borderLeftWidth: 3,
      borderLeftColor: '#F59E0B',
    },
    issuesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    issuesTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: '#F59E0B',
      marginLeft: wp(2),
    },
    issuesText: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(12)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      lineHeight: hp(2),
    },
    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      paddingBottom: hp(2),
      paddingTop: wp(4),
      paddingHorizontal: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
    },
    continueButtonText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    noPunchesText: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(13)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      paddingVertical: hp(2),
      fontStyle: 'italic',
    },
  });
