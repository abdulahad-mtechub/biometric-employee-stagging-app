import moment from 'moment';
import React, {memo, useCallback, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Images} from '../../assets/Images/Images';
import {useButtonColors} from '../../Constants/colorHelper';

const DEFAULT_FIELD_MAPPINGS = {
  tasks: {
    title: 'title',
    subtitle: 'description',
    status: 'status',
    date: 'start_at',
    priority: 'priority',
    id: 'id',
    type: 'task',
    icon: 'task',
    colorMap: {
      assigned: {bg: '#60A5FA', text: '#ffffff'},
      Assigned: {bg: '#60A5FA', text: '#ffffff'},
      in_progress: {bg: '#F59E0B', text: '#ffffff'},
      inProgress: {bg: '#F59E0B', text: '#ffffff'},
      InProgress: {bg: '#F59E0B', text: '#ffffff'},
      completed: {bg: '#10B981', text: '#ffffff'},
      Completed: {bg: '#10B981', text: '#ffffff'},
      not_done: {bg: '#EF4444', text: '#ffffff'},
      notDone: {bg: '#EF4444', text: '#ffffff'},
      overdue: {bg: '#DC2626', text: '#ffffff'},
      Overdue: {bg: '#DC2626', text: '#ffffff'},
      cancelled: {bg: '#6B7280', text: '#ffffff'},
      Cancelled: {bg: '#6B7280', text: '#ffffff'},
      asignado: {bg: '#60A5FA', text: '#ffffff'},
      en_progreso: {bg: '#F59E0B', text: '#ffffff'},
      completado: {bg: '#10B981', text: '#ffffff'},
    },
    dateFormat: 'DD MMM YYYY',
  },
  attendance: {
    title: 'name',
    subtitle: 'working_hours',
    status: 'status',
    date: 'date',
    checkIn: 'first_check_in',
    checkOut: 'last_check_out',
    hours: 'working_hours',
    id: 'id',
    type: 'attendance',
    icon: 'attendance',
    colorMap: {
      'Has Issues': {bg: '#EF4444', text: '#ffffff'},
      'Half Day': {bg: '#F59E0B', text: '#ffffff'},
      Present: {bg: '#10B981', text: '#ffffff'},
      Absent: {bg: '#9CA3AF', text: '#ffffff'},
    },
    dateFormat: 'DD MMM YYYY',
  },
  remuneration: {
    title: 'name',
    subtitle: 'note',
    status: 'status',
    date: 'paid_at',
    amount: 'amount',
    currency: 'currency',
    id: 'id',
    type: 'remuneration',
    icon: 'payment',
    colorMap: {
      PENDING: {bg: '#F59E0B', text: '#ffffff'},
      pending: {bg: '#F59E0B', text: '#ffffff'},
      Aprobado: {bg: '#10B981', text: '#ffffff'},
      APPROVED: {bg: '#10B981', text: '#ffffff'},
      approved: {bg: '#10B981', text: '#ffffff'},
      REJECTED: {bg: '#EF4444', text: '#ffffff'},
      rejected: {bg: '#EF4444', text: '#ffffff'},
      PAID: {bg: '#3B82F6', text: '#ffffff'},
      paid: {bg: '#3B82F6', text: '#ffffff'},
    },
    dateFormat: 'DD MMM YYYY',
  },
  requests: {
    title: 'name',
    subtitle: 'type',
    status: 'status',
    date: 'created_at',
    details: 'description',
    id: 'id',
    type: 'request',
    icon: 'request',
    colorMap: {
      PENDING: {bg: '#F59E0B', text: '#ffffff'},
      pending: {bg: '#F59E0B', text: '#ffffff'},
      APPROVED: {bg: '#10B981', text: '#ffffff'},
      approved: {bg: '#10B981', text: '#ffffff'},
      REJECTED: {bg: '#EF4444', text: '#ffffff'},
      rejected: {bg: '#EF4444', text: '#ffffff'},
      CANCELLED: {bg: '#6B7280', text: '#ffffff'},
      cancelled: {bg: '#6B7280', text: '#ffffff'},
      INFO_REQUESTED: {bg: '#8B5CF6', text: '#ffffff'},
      info_requested: {bg: '#8B5CF6', text: '#ffffff'},
    },
    dateFormat: 'DD MMM YYYY, hh:mm A',
  },
  documents: {
    title: 'name',
    subtitle: 'description',
    status: 'category',
    date: 'uploaded_at',
    details: 'file_type',
    id: 'id',
    type: 'document',
    icon: 'document',
    colorMap: {
      medical: {bg: '#EF4444', text: '#ffffff'},
      id: {bg: '#3B82F4', text: '#ffffff'},
      expense: {bg: '#10B981', text: '#ffffff'},
      other: {bg: '#6B7280', text: '#ffffff'},
    },
    dateFormat: 'DD MMM YYYY',
  },
  expenses: {
    title: 'name',
    subtitle: 'description',
    status: 'status',
    date: 'date_of_expense',
    amount: 'amount',
    currency: 'currency',
    id: 'id',
    type: 'payment',
    icon: 'payment',
    colorMap: {
      PENDING: {bg: '#F59E0B', text: '#ffffff'},
      pending: {bg: '#F59E0B', text: '#ffffff'},
      APPROVED: {bg: '#10B981', text: '#ffffff'},
      approved: {bg: '#10B981', text: '#ffffff'},
      REJECTED: {bg: '#EF4444', text: '#ffffff'},
      rejected: {bg: '#EF4444', text: '#ffffff'},
      PAID: {bg: '#3B82F6', text: '#ffffff'},
      paid: {bg: '#3B82F6', text: '#ffffff'},
    },
    dateFormat: 'DD MMM YYYY',
  },
  absences: {
    title: 'name',
    subtitle: 'type',
    status: 'status',
    date: 'createdAt',
    id: 'id',
    type: 'absence',
    icon: 'calendar',
    colorMap: {
      approved: {bg: '#10B981', text: '#ffffff'},
      APPROVED: {bg: '#10B981', text: '#ffffff'},
      rejected: {bg: '#EF4444', text: '#ffffff'},
      REJECTED: {bg: '#EF4444', text: '#ffffff'},
      assigned: {bg: '#60A5FA', text: '#ffffff'},
      ASSIGNED: {bg: '#60A5FA', text: '#ffffff'},
      pending: {bg: '#F59E0B', text: '#ffffff'},
      PENDING: {bg: '#F59E0B', text: '#ffffff'},
    },
    dateFormat: 'DD MMM YYYY',
  },
};

const IconMapper = ({type, size = 24, color, style}) => {
  const iconSize = wp(size / 3.5);

  switch (type) {
    case 'task':
      return (
        <MaterialCommunityIcons
          name="clipboard-check-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'attendance':
      return (
        <MaterialCommunityIcons
          name="clock-check-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'payment':
      return (
        <FontAwesome name="money" size={iconSize} color={color} style={style} />
      );
    case 'request':
      return (
        <MaterialCommunityIcons
          name="file-document-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'urgent':
      return (
        <MaterialCommunityIcons
          name="alert-circle"
          size={iconSize}
          color="#EF4444"
          style={style}
        />
      );
    case 'high':
      return (
        <MaterialCommunityIcons
          name="alert-octagon"
          size={iconSize}
          color="#F59E0B"
          style={style}
        />
      );
    case 'medium':
      return (
        <MaterialCommunityIcons
          name="alert"
          size={iconSize}
          color="#F59E0B"
          style={style}
        />
      );
    case 'low':
      return (
        <MaterialCommunityIcons
          name="information-outline"
          size={iconSize}
          color="#10B981"
          style={style}
        />
      );
    case 'calendar':
      return (
        <MaterialCommunityIcons
          name="calendar-month-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'clock':
      return (
        <MaterialCommunityIcons
          name="clock-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'hours':
      return (
        <MaterialCommunityIcons
          name="timer-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'document':
      return (
        <MaterialCommunityIcons
          name="file-document-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'empty':
      return (
        <MaterialCommunityIcons
          name="file-document-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'chevronRight':
      return (
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'location':
      return (
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'attachment':
      return (
        <MaterialCommunityIcons
          name="paperclip"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'comment':
      return (
        <MaterialCommunityIcons
          name="comment-text-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'user':
      return (
        <MaterialCommunityIcons
          name="account-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'check':
      return (
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'warning':
      return (
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    case 'noData':
      return (
        <MaterialCommunityIcons
          name="database-off-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
    default:
      return (
        <MaterialCommunityIcons
          name="file-document-outline"
          size={iconSize}
          color={color}
          style={style}
        />
      );
  }
};

// Individual Card Component
const DataCard = memo(
  ({item, fieldMapping, onPress, theme, primaryButtonColors}) => {
    const {t} = useTranslation();

    // Extract data based on field mapping
    const getField = useCallback(
      key => {
        if (fieldMapping?.customFields?.[key]) {
          return fieldMapping.customFields[key](item);
        }
        return item[fieldMapping[key] || key];
      },
      [item, fieldMapping],
    );

    const title = t(getField('title'));
    const subtitle = t(getField('subtitle'));
    const status = t(getField('status'));
    const date = getField('date');
    const priority = t(getField('priority'));
    const amount = getField('amount');
    const currency = t(getField('currency'));
    const checkIn = t(getField('checkIn'));
    const checkOut = t(getField('checkOut'));
    const hours = t(getField('hours'));

    // Format date
    const formatDate = useCallback(
      dateString => {
        if (!dateString) return '';
        try {
          return moment(dateString).format(
            fieldMapping.dateFormat || 'DD MMM YYYY',
          );
        } catch {
          return dateString;
        }
      },
      [fieldMapping.dateFormat],
    );

    // Get status color
    const getStatusColor = useCallback(
      statusValue => {
        const colorMap = fieldMapping.colorMap || {};
        const normalizedStatus = String(statusValue).toLowerCase().trim();

        // Find matching status (case-insensitive)
        const match = Object.entries(colorMap).find(
          ([key]) => key.toLowerCase() === normalizedStatus,
        );

        return match?.[1] || {bg: '#6B7280', text: '#ffffff'};
      },
      [fieldMapping.colorMap],
    );

    // Get priority icon
    const getPriorityIcon = useCallback(priorityValue => {
      const {t} = useTranslation();
      const value = String(priorityValue).toLowerCase();
      // Support both translated and raw values
      if (value === t('urgent').toLowerCase() || value === 'urgent')
        return 'urgent';
      if (value === t('high').toLowerCase() || value === 'high') return 'high';
      if (value === t('medium').toLowerCase() || value === 'medium')
        return 'medium';
      if (value === t('low').toLowerCase() || value === 'low') return 'low';
      return null;
    }, []);

    const statusColor = getStatusColor(status);
    const priorityIcon = getPriorityIcon(priority);
    const formattedDate = formatDate(date);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            shadowColor: theme.shadowColor,
          },
        ]}
        onPress={() => onPress?.(item)}
        activeOpacity={0.8}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <View
              style={[
                styles.iconContainer,
                {backgroundColor: `${theme.primary}15`}, // 15 = 8% opacity
              ]}>
              <IconMapper
                type={fieldMapping.icon || getField('type') || 'document'}
                size={22}
                color={primaryButtonColors?.backgroundColor || theme.primary}
              />
            </View>
            <View style={styles.titleTextContainer}>
              <Text
                style={[styles.title, {color: theme.textPrimary}]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {title || t('No title')}
              </Text>
              {subtitle && (
                <Text
                  style={[styles.subtitle, {color: theme.textSecondary}]}
                  numberOfLines={2}
                  ellipsizeMode="tail">
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Status Badge */}
          {status && (
            <View
              style={[styles.statusBadge, {backgroundColor: statusColor.bg}]}>
              <Text style={[styles.statusText, {color: statusColor.text}]}>
                {status}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, {backgroundColor: theme.borderLight}]}>
          {/* Left side divider */}
          <View style={styles.dividerLine} />
          {/* Right side spacer for chevron icon */}
          <View style={styles.dividerSpacer} />
        </View>

        {/* Card Body - Dynamic Fields */}
        <View style={styles.cardBody}>
          {/* Date */}
          {formattedDate && (
            <View style={styles.fieldRow}>
              <IconMapper type="calendar" size={16} color={theme.iconColor} />
              <Text style={[styles.fieldText, {color: theme.textSecondary}]}>
                {t('Date')}: {formattedDate}
              </Text>
            </View>
          )}

          {/* Priority */}
          {priorityIcon && (
            <View style={styles.fieldRow}>
              <IconMapper
                type={priorityIcon}
                size={16}
                color={theme.iconColor}
              />
              <Text style={[styles.fieldText, {color: theme.textSecondary}]}>
                {t('Priority')}: {priority}
              </Text>
            </View>
          )}

          {/* Amount */}
          {amount && (
            <View style={styles.fieldRow}>
              <IconMapper type="payment" size={16} color={theme.iconColor} />
              <Text style={[styles.fieldText, {color: theme.textSecondary}]}>
                {t('Amount')}: {amount} {currency || ''}
              </Text>
            </View>
          )}

          {/* Attendance Times */}
          {checkIn && (
            <View style={styles.fieldRow}>
              <IconMapper type="clock" size={16} color={theme.iconColor} />
              <Text style={[styles.fieldText, {color: theme.textSecondary}]}>
                {t('Clock In')}: {checkIn}{' '}
                {checkOut
                  ? `- ${t('Clock Out')}: ${checkOut}`
                  : `(${t('No checkout')})`}
              </Text>
            </View>
          )}

          {/* Working Hours */}
          {hours && (
            <View style={styles.fieldRow}>
              <IconMapper type="hours" size={16} color={theme.iconColor} />
              <Text style={[styles.fieldText, {color: theme.textSecondary}]}>
                {t('Working Hours')}: {hours} {t('hours')}
              </Text>
            </View>
          )}

          {/* Custom Fields */}
          {fieldMapping.customFields &&
            Object.entries(fieldMapping.customFields).map(([key, value]) => {
              if (typeof value === 'function') return null; // Already handled
              return (
                <View key={key} style={styles.fieldRow}>
                  <IconMapper
                    type="document"
                    size={16}
                    color={theme.iconColor}
                  />
                  <Text
                    style={[styles.fieldLabel, {color: theme.textSecondary}]}>
                    {t(key)}:
                  </Text>
                  <Text style={[styles.fieldValue, {color: theme.textPrimary}]}>
                    {t(String(item[value] || ''))}
                  </Text>
                </View>
              );
            })}
        </View>
        <View style={styles.viewButton}>
          {/* <Text style={[styles.viewButtonText, {color: theme.primary}]}>
            {t('View Details')}
          </Text> */}
          <IconMapper type="chevronRight" size={16} color={theme.primary} />
        </View>
      </TouchableOpacity>
    );
  },
);

// Main UniversalCardTable Component
const UniversalCardTable = ({
  title,
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onPressItem,
  fieldMapping = {},
  type = 'generic',
  showHeader = true,
  showCount = true,
  cardStyle,
  containerStyle,
  flatListProps = {},
  ListHeaderComponent,
  ListFooterComponent,
  horizontal = false,
  numColumns = 1,
}) => {
  const {t} = useTranslation();
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const theme = useMemo(
    () => ({
      textPrimary: isDarkMode ? '#FFFFFF' : '#1F2937',
      textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
      textTertiary: isDarkMode ? '#6B7280' : '#9CA3AF',
      cardBackground: isDarkMode ? '#2D3748' : '#FFFFFF',
      border: isDarkMode ? '#4B5563' : '#E5E7EB',
      borderLight: isDarkMode ? '#374151' : '#F3F4F6',
      primary: primaryButtonColors.backgroundColor,
      iconColor: isDarkMode ? '#9CA3AF' : '#6B7280',
      shadowColor: isDarkMode ? '#000000' : '#6B7280',
    }),
    [isDarkMode, primaryButtonColors.backgroundColor],
  );

  const mergedFieldMapping = useMemo(
    () => ({
      ...(DEFAULT_FIELD_MAPPINGS[type] || {}),
      ...fieldMapping,
    }),
    [type, fieldMapping],
  );

  // Memoized render item
  const renderItem = useCallback(
    ({item}) => (
      <DataCard
        item={item}
        fieldMapping={mergedFieldMapping}
        onPress={onPressItem}
        theme={theme}
        primaryButtonColors={primaryButtonColors}
      />
    ),
    [mergedFieldMapping, onPressItem, theme, primaryButtonColors],
  );

  // Key extractor - ensure unique keys for all items
  const keyExtractor = useCallback((item, index) => {
    // Guard against null/undefined items
    if (!item) {
      return `key-null-${index}`;
    }
    // Try to get unique id from item
    const itemId = item.id ?? item.task_id ?? item._id ?? item.uuid ?? null;
    // Always return a valid unique key
    if (itemId !== null && itemId !== undefined) {
      return `key-${String(itemId)}`;
    }
    // Deterministic fallback to avoid row remount/reorder jitter.
    const deterministicSeed = [
      item.title,
      item.name,
      item.created_at,
      item.createdAt,
      item.start_at,
      item.date,
      index,
    ]
      .filter(Boolean)
      .join('-');
    return `key-fallback-${deterministicSeed || index}`;
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header */}
      {showHeader && title && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.headerIcon,
                {
                  backgroundColor: primaryButtonColors.backgroundColor,
                  borderRadius: wp(4),
                },
              ]}>
              <IconMapper
                type={mergedFieldMapping.icon || 'document'}
                size={18}
                color="#FFFFFF"
              />
            </View>
            <Text style={[styles.headerTitle, {color: theme.textPrimary}]}>
              {t(title)}
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {loading && data.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, {color: theme.textSecondary}]}>
            {t('Loading data...')}
          </Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              // {backgroundColor: `${theme.primary}15`},
            ]}>
            <Image source={Images.empty} style={styles.emptyIcon} />
          </View>
          <Text style={[styles.emptyTitle, {color: theme.textPrimary}]}>
            {t('No data found')}
          </Text>
          <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
            {t(emptyMessage)}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            horizontal && styles.horizontalListContent,
            numColumns > 1 && styles.gridListContent,
          ]}
          ItemSeparatorComponent={() =>
            !horizontal && numColumns === 1 ? (
              <View key="separator" style={[styles.separator]} />
            ) : null
          }
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={false}
          horizontal={horizontal}
          getItemLayout={(_, index) => ({
            length: 180, // Approximate card height
            offset: 180 * index,
            index,
          })}
          numColumns={numColumns}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          {...flatListProps}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
    marginBottom: hp(0.5),
  },
  headerTitle: {
    fontSize: RFPercentage(2.3),
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: wp(10),
    marginLeft: wp(2),
  },
  countText: {
    fontSize: RFPercentage(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: RFPercentage(1.8),
    fontFamily: 'Poppins-Medium',
    marginRight: wp(1),
  },
  loadingContainer: {
    padding: hp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: RFPercentage(1.8),
    fontFamily: 'Poppins-Medium',
  },
  emptyIcon: {
    width: wp(20),
    height: wp(20),
    resizeMode: 'contain',
  },
  emptyContainer: {
    padding: hp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: RFPercentage(2),
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: RFPercentage(1.7),
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: RFPercentage(1.2),
    color: '#9CA3AF',
  },
  listContent: {
    paddingBottom: hp(2),
  },
  horizontalListContent: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  gridListContent: {
    paddingHorizontal: wp(2),
  },
  separator: {
    height: hp(1.5),
  },
  card: {
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: RFPercentage(2.1),
    fontFamily: 'Poppins-SemiBold',
    marginBottom: hp(0.5),
    lineHeight: RFPercentage(2.6),
  },
  subtitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: 'Nunito-Regular',
    lineHeight: RFPercentage(2.2),
  },
  statusBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: wp(2),
    alignSelf: 'flex-start',
    minWidth: wp(18),
    alignItems: 'center',
  },
  statusText: {
    fontSize: RFPercentage(1.4),
    fontFamily: 'Poppins-Medium',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderRadius: 1,
  },
  dividerSpacer: {
    width: wp(6), // Space for chevron icon
  },
  cardBody: {
    // marginBottom: hp(1.5),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  fieldText: {
    fontSize: RFPercentage(1.6),
    fontFamily: 'Nunito-Medium',
    marginLeft: wp(2),
    flex: 1,
  },
  fieldLabel: {
    fontSize: RFPercentage(1.6),
    fontFamily: 'Nunito-Medium',
    marginLeft: wp(2),
    marginRight: wp(1),
  },
  fieldValue: {
    fontSize: RFPercentage(1.6),
    fontFamily: 'Nunito-Medium',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: hp(1),
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: RFPercentage(1.5),
    fontFamily: 'Nunito-Regular',
  },
  viewButton: {
    // paddingHorizontal: wp(3),
    // paddingVertical: hp(0.8),
    borderRadius: wp(2),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    width: wp(6),
    height: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: hp(1),
    right: wp(4),
  },
  viewButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: 'Poppins-Medium',
    marginRight: wp(1),
  },
});

export default memo(UniversalCardTable);
