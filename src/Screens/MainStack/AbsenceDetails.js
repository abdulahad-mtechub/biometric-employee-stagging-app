import React from 'react';
import {useTranslation} from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import StackHeader from '../../components/Header/StackHeader';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';

const AbsenceDetails = ({navigation, route}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);

  // Safe access to absence data with fallbacks
  const absence = route.params?.absence || {};
  const calendarMode = route.params?.calendarMode || {};

  const getStatusColor = (status, source) => {
    // Use source to determine color if status is not available
    const actualStatus = status || source;

    switch (actualStatus?.toUpperCase()) {
      case 'APPROVED':
      case 'APPROVED_LEAVE':
        return '#4CAF50';
      case 'MANUAL':
      case 'MANUAL_ADMIN':
        return '#2196F3';
      case 'AUTO_GENERATED':
      case 'NO_SHOW':
        return '#FF9800';
      case 'PENDING':
        return '#FF9800';
      case 'REJECTED':
        return '#F44336';
      case 'CANCELLED':
        return '#9E9E9E';
      default:
        return '#4CAF50';
    }
  };

  const getStatusText = (status, source) => {
    const actualStatus = status || source;

    switch (actualStatus?.toUpperCase()) {
      case 'APPROVED':
      case 'APPROVED_LEAVE':
        return t('Approved');
      case 'MANUAL':
      case 'MANUAL_ADMIN':
        return t('Manual Entry');
      case 'AUTO_GENERATED':
      case 'NO_SHOW':
        return t('Auto Generated');
      case 'PENDING':
        return t('Pending');
      case 'REJECTED':
        return t('Rejected');
      case 'CANCELLED':
        return t('Cancelled');
      default:
        return actualStatus || t('Unknown');
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = dateString => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = timeString => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes, seconds] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  };

  // Calculate total days
  const calculateTotalDays = (start, end) => {
    if (!start || !end) return 0;
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const timeDiff = endDate.getTime() - startDate.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    } catch (error) {
      return 0;
    }
  };

  const totalDays = calculateTotalDays(absence.start_date, absence.end_date);

  // Safe check if absence data exists
  if (!absence.id) {
    return (
      <View style={styles.container}>
        <StackHeader
          title={t('Absence Details')}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={RFPercentage(8)}
            color={isDarkMode ? '#666' : '#999'}
          />
          <Text style={styles.errorText}>{t('No absence data found')}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>{t('Go Back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Absence Details')}
        headerTxtStyle={styles.headerTxtStyle}
        onBackPress={() => navigation.goBack()}
        headerStyle={styles.headerStyle}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {calendarMode !== true && (
          <View style={styles.statusBanner}>
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>{t('Current Status')}</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor: getStatusColor(
                        absence.status,
                        absence.source,
                      ),
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {t(getStatusText(absence.status, absence.source))}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('Basic Information')}</Text>

          <DetailRow
            label={t('Absence Type')}
            value={absence.type || t('N/A')}
          />
          <DetailRow
            label={t('Paid Leave')}
            value={absence.isPaid ? t('Yes') : t('No')}
          />
          <DetailRow
            label={t('Total Days')}
            value={`${totalDays} ${t('days')}`}
          />
          <DetailRow
            label={t('Partial Day')}
            value={absence.isPartial ? t('Yes') : t('No')}
          />
        </View>

        {/* Date Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('Date Information')}</Text>

          <DetailRow
            label={t('Start Date')}
            value={formatDate(absence.start_date)}
          />
          <DetailRow
            label={t('End Date')}
            value={formatDate(absence.end_date)}
          />
          <DetailRow
            label={t('Created On')}
            value={formatDateTime(absence.createdAt)}
          />
        </View>

        {/* Partial Time Information */}
        {/* {absence.isPartial && absence.partialTimes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('Partial Time Details')}</Text>

            <DetailRow
              label={t('Start Time')}
              value={formatTime(absence.partialTimes.start)}
            />
            <DetailRow
              label={t('End Time')}
              value={formatTime(absence.partialTimes.end)}
            />
          </View>
        )} */}

        {/* Comment Card */}
        {/* <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('Comment')}</Text>
          <View style={styles.commentContainer}>
            <Text style={styles.commentText}>
              {absence.comment || t('No comment provided')}
            </Text>
          </View>
        </View> */}

        {/* Source Information */}
        {/* <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('System Information')}</Text>

          <DetailRow label={t('Source')} value={absence.source || t('N/A')} />
          <DetailRow
            label={t('Absence ID')}
            value={absence.id?.toString() || t('N/A')}
          />
        </View> */}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const DetailRow = ({label, value}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
};

export default AbsenceDetails;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(10),
    },
    errorText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode ? '#CCCCCC' : '#666666',
      textAlign: 'center',
      marginTop: hp(2),
      marginBottom: hp(3),
    },
    backButton: {
      backgroundColor: Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(6),
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
    },
    backButtonText: {
      color: '#FFF',
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    statusBanner: {
      backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
      borderRadius: wp(3),
      padding: wp(4),
      marginBottom: hp(2),
    },
    statusContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusLabel: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicator: {
      width: wp(2),
      height: wp(2),
      borderRadius: wp(1),
      marginRight: wp(2),
    },
    statusText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    card: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
      marginBottom: hp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    cardTitle: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(2),
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.5),
    },
    detailLabel: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    detailValue: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
      textAlign: 'right',
    },
    commentContainer: {
      backgroundColor: isDarkMode ? '#3A3A3A' : '#F8F8F8',
      borderRadius: wp(2),
      padding: wp(3),
    },
    commentText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      lineHeight: hp(2.5),
    },
    bottomSpacer: {
      height: hp(2),
    },
  });
