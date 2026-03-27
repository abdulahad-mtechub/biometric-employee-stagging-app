import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useTranslation} from 'react-i18next';
import {pxToPercentage} from '../../utils/responsive';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';

const DetailedTaskCard = ({item, containerStyle, onPress}) => {
  const {t} = useTranslation();
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  // Helper function to get color based on priority
  const getPriorityColor = priority => {
    const priorityColors = {
      high: '#EF4444', // Red
      medium: '#F59E0B', // Amber
      low: '#10B981', // Green
    };
    return priorityColors[priority?.toLowerCase()] || '#6B7280'; // Default gray
  };

  // Helper function to get color based on task status
  const getStatusColor = status => {
    const statusColorMap = {
      completed: '#4BCE97', // Green
      in_progress: '#9F8FEF', // Purple
      inprogress: '#9F8FEF', // Purple
      assigned: '#65B7F3', // Blue
      not_done: '#F87171', // Red
      cancelled: '#F87171', // Red
      overdue: '#FBA64C', // Orange
      delayed: '#F75555', // Red
    };
    return statusColorMap[status?.toLowerCase()] || '#65B7F3';
  };

  // Format date to DD-MM-YYYY
  const formatDate = dateStr => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateStr;
    }
  };

  // Format time from date string
  const formatTime = dateStr => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    } catch (error) {
      return '';
    }
  };

  const priorityColor = getPriorityColor(item?.priority);
  const statusColor = getStatusColor(item?.status);

  // Helper function to get status icon
  const getStatusIcon = status => {
    const statusIconMap = {
      completed: {
        icon: <Svgs.tickWhite height={hp(2.5)} width={hp(2.5)} />,
        backgroundColor: '#4BCE97',
      },
      in_progress: {
        icon: <Svgs.ongoingWhite height={hp(2.5)} width={hp(2.5)} />,
        backgroundColor: '#B891F3',
      },
      inprogress: {
        icon: <Svgs.ongoingWhite height={hp(2.5)} width={hp(2.5)} />,
        backgroundColor: '#B891F3',
      },
      assigned: {
        icon: <Svgs.leaveWhite height={hp(2.5)} width={hp(2.5)} />,
        backgroundColor: '#65B7F3',
      },
      not_done: {
        icon: <Svgs.alertOutline height={hp(2.5)} width={hp(2.5)} />,
        backgroundColor: '#F87171',
      },
      cancelled: {
        icon: <Svgs.crossWhite height={hp(2.5)} width={hp(2.5)} />,
        backgroundColor: '#F87171',
      },
      overdue: {
        icon: <Svgs.alertWhite height={hp(2.5)} width={hp(2.5)} />,
        backgroundColor: '#FBA64C',
      },
      delayed: {
        icon: <Svgs.lateWhite height={hp(2.5)} width={hp(2.5)} />,
        backgroundColor: '#F75555',
      },
    };
    const iconConfig =
      statusIconMap[status?.toLowerCase()] || statusIconMap.assigned;
    return (
      <View
        style={[
          styles.statusIconWrapper,
          {backgroundColor: iconConfig.backgroundColor},
        ]}>
        {iconConfig.icon}
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.4}
      onPress={() => onPress(item)}
      style={[styles.cardContainer, containerStyle]}>
      {/* Header with title and priority */}
      <View style={styles.headerContainer}>
        {getStatusIcon(item?.status)}
        <Text style={styles.title} numberOfLines={2}>
          {item?.title || 'Untitled Task'}
        </Text>
        <View style={styles.priorityContainer}>
          <View
            style={[styles.priorityDot, {backgroundColor: priorityColor}]}
          />
          <Text style={styles.priorityText}>
            {item?.priority ? item.priority.toUpperCase() : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {item?.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* Status and Requirements */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, {backgroundColor: `${statusColor}`}]}>
          <Text style={[styles.statusText, {color: 'white'}]}>
            {item?.status?.replace('_', ' ').toUpperCase() || 'N/A'}
          </Text>
        </View>

        <View style={styles.requirementsContainer}>
          {item?.face_required && (
            <View style={styles.requirementBadge}>
              <Svgs.faceScan height={hp(1.5)} width={hp(1.5)} />
              <Text style={styles.requirementText}>Face</Text>
            </View>
          )}
          {item?.location_required && (
            <View style={styles.requirementBadge}>
              <Svgs.PinnedL height={hp(1.5)} width={hp(1.5)} />
              <Text style={styles.requirementText}>Location</Text>
            </View>
          )}
          {item?.evidence_required && (
            <View style={styles.requirementBadge}>
              <Svgs.privacy height={hp(1.5)} width={hp(1.5)} />
              <Text style={styles.requirementText}>Evidence</Text>
            </View>
          )}
        </View>
      </View>

      {/* Dates */}
      <View style={styles.datesContainer}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>{t('Start')}</Text>
          <Text style={styles.dateValue}>
            {formatDate(item?.start_at)} {formatTime(item?.start_at)}
          </Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>{t('End')}</Text>
          <Text style={styles.dateValue}>
            {formatDate(item?.end_at)} {formatTime(item?.end_at)}
          </Text>
        </View>
      </View>

      {/* Location */}
      {/* {item?.location_address && (
        <View style={styles.locationContainer}>
          <Svgs.PinnedL height={hp(2)} width={hp(2)} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location_address}
          </Text>
        </View>
      )} */}

      {/* Footer with assigned by and comments */}
      <View style={styles.footerContainer}>
        {item?.assigned_by_name && (
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>{t('Assigned by')}:</Text>
            <Text style={styles.footerValue}>{item.assigned_by_name}</Text>
          </View>
        )}
        {item?.comments_count && (
          <View style={styles.footerItem}>
            <Svgs.messageL height={hp(2)} width={hp(2)} />
            <Text style={styles.footerValue}>{item.comments_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default DetailedTaskCard;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    statusIconWrapper: {
      height: hp(3.5),
      width: hp(3.5),
      borderRadius: hp(1.75),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2),
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
      marginRight: 8,
    },
    priorityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    priorityText: {
      fontSize: RFPercentage(pxToPercentage(10)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    description: {
      fontSize: RFPercentage(pxToPercentage(13)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: 12,
      lineHeight: 20,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    statusText: {
      fontSize: RFPercentage(pxToPercentage(11)),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    requirementsContainer: {
      flexDirection: 'row',
      gap: 6,
    },
    requirementBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
    },
    requirementText: {
      fontSize: RFPercentage(pxToPercentage(10)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    datesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      backgroundColor: isDarkMode ? '#1A1A1A' : '#F9FAFB',
      padding: 12,
      borderRadius: 8,
    },
    dateItem: {
      flex: 1,
    },
    dateLabel: {
      fontSize: RFPercentage(pxToPercentage(11)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: 4,
    },
    dateValue: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      backgroundColor: isDarkMode ? '#2D2D2D' : '#c7eafeff',
      padding: 10,
      borderRadius: 8,
      gap: 8,
    },
    locationText: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode ? '#FCD34D' : '#92400E',
      flex: 1,
    },
    footerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    footerLabel: {
      fontSize: RFPercentage(pxToPercentage(11)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    footerValue: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });
