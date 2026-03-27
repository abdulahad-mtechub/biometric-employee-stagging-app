import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Symbols} from '../../Constants/DummyData';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Svgs} from '../../assets/Svgs/Svgs';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useTranslation} from 'react-i18next';
import {pxToPercentage} from '../../utils/responsive';

const AdditionalSymbols = {
  pending: {
    icon: <Svgs.Processing height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#3B82F6', // Blue for pending
  },
  paid: {
    icon: <Svgs.tickWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#10B981', // Green for paid
  },
  unpaid: {
    icon: <Svgs.calenderL height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#EF4444', // Red for unpaid
  },
  approved: {
    icon: <Svgs.tickWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#10B981', // Green for approved
  },
  rejected: {
    icon: <Svgs.EmailExpired height={hp(3.7)} width={hp(3.7)} fill={'white'} />,
    backgroundColor: '#9CA3AF', // Gray for rejected
  },
  in_progress: {
    icon: <Svgs.ongoingWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#8B5CF6', // Purple for in progress
  },
  completed: {
    icon: <Svgs.checkedCircled height={hp(3.4)} width={hp(3.4)} />,
    backgroundColor: '#fff', // Green for completed
  },
  assigned: {
    icon: <Svgs.workerCheck height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#579DFF', // Blue for assigned
  },
  not_done: {
    icon: <Svgs.hold height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#F97316', // Orange for not done
  },
  overdue: {
    icon: <Svgs.alertWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#DC2626',
  },
};

const AllSymbols = {
  ...Symbols,
  ...AdditionalSymbols,
};

const StatusCardItem = ({item, type, containerStyle, onPress}) => {
  const {t} = useTranslation();
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const status = item?.status?.toLowerCase();
  const symbol = AllSymbols[status] || {};
  const Icon = symbol.icon || (
    <Svgs.alertWhite height={hp(2.5)} width={hp(2.5)} />
  );
  const backgroundColor = symbol.backgroundColor || '#9CA3AF';

  const getPrimaryText = () => {
    switch (type) {
      case 'Attendance':
        return item?.date;
      case 'Tasks':
        return item?.title;
      case 'Projects':
        return item?.title;
      case 'Requests':
        if (item?.type === 'GENERIC_HR') return t('Generic HR');
        if (item?.type === 'SCHEDULE_CHANGE') return t('Schedule Change');
        return item?.name ? item?.name : item?.type;
      case 'Payments':
        return item?.name;
      case 'Expenese':
        return item?.name;
      case 'AbsenceHistory':
        return item?.name;
      default:
        return '';
    }
  };

  const getSecondryText = () => {
    switch (type) {
      case 'Attendance':
        return item?.time;
      case 'Tasks':
        return `${'                     '}  ${item?.date}`;
      case 'Requests':
        return `${item?.date} - ${item?.time}`;
      case 'Payments':
        return `${item?.date} - ${item?.time}`;
      case 'Documents':
        return `${item?.date} - ${item?.time}`;
      case 'AbsenceHistory':
        const returnText = item?.dateTo
          ? `${item?.dateFrom} - ${item?.dateTo}`
          : `${item?.dateFrom}`;
        return returnText;
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.4}
      onPress={() => onPress(item)}
      style={[styles.rowViewSB, containerStyle]}>
      <View style={styles.symbolRow}>
        <View style={[styles.iconWrapper, {backgroundColor, borderRadius: 30}]}>
          {Icon}
        </View>
        <Text style={styles.symbolText} numberOfLines={1}>
          {getPrimaryText()}
        </Text>
      </View>

      <Text style={styles.symbolText}>{getSecondryText()}</Text>
    </TouchableOpacity>
  );
};

export default StatusCardItem;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.5),
    },
    symbolRow: {
      width: wp(50),
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrapper: {
      height: hp(3.5),
      width: hp(3.5),
      borderRadius: hp(2.25),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
    },
    symbolText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'left',
      width: '60%',
    },
  });
