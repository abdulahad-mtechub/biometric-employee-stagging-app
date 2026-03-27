import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import StackHeader from '../../components/Header/StackHeader';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import {FontsSize} from '../../Constants/FontsSize';
import {Fonts} from '../../Constants/Fonts';
import {getExpensesById} from '../../Constants/api';

const RemunerationRequestDetails = ({navigation, route}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const transaction = route?.params?.item;
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      try {
        setLoading(true);
        const response = await getExpensesById(route.params.expenseId, token);
        if (response.error === false) {
          setExpenseData(response.data);
        }
      } catch (error) {
        console.error('Error fetching expense details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (route.params.expenseId && token) {
      fetchExpenseDetails();
    } else if (transaction) {
      setExpenseData(transaction);
      setLoading(false);
    }
  }, [route.params.expenseId, token, transaction]);

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const StatusBox = ({status, backgroundColor, color, icon}) => (
    <View style={[styles.statusBadge, {backgroundColor}]}>
      {icon}
      <Text style={[styles.statusBadgeText, {color}]}>{status}</Text>
    </View>
  );

  const renderDetailRow = (label, value) => {
    return (
      <View style={styles.rowViewSB}>
        <Text style={styles.detailLabel}>{t(label)}</Text>
        <Text style={styles.detailValue}>{t(value)}</Text>
      </View>
    );
  };

  const renderReceiptRow = (label, value, isHighlighted = false) => {
    return (
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLabel}>{t(label)}</Text>
        <Text
          style={[
            styles.receiptValue,
            isHighlighted && styles.highlightedValue,
          ]}>
          {t(value)}
        </Text>
      </View>
    );
  };

  const statusStyles = {
    Leave: {
      backgroundColor: '#60A5FA',
      color: '#ffffff',
      icon: <Svgs.mailL height={hp(2)} />,
    },
    Invited: {
      backgroundColor: '#60A5FA',
      color: '#ffffff',
      icon: <Svgs.mailL height={hp(2)} />,
    },
    Present: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Active: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Absent: {
      backgroundColor: '#F87171',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Inactive: {
      backgroundColor: '#F87171',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    'Early Out': {
      backgroundColor: '#A78BFA',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    'Late Arrival': {
      backgroundColor: '#FB923C',
      color: '#000000',
      icon: <Svgs.CheckOutlineBlack height={hp(2)} />,
    },
    'Half Leave': {
      backgroundColor: '#FACC15',
      color: '#000000',
      icon: <Svgs.halfLeave height={hp(2)} />,
    },
    Request: {
      backgroundColor: '#FACC15',
      color: '#000000',
      icon: <Svgs.halfLeave height={hp(2)} />,
    },
    Valid: {
      backgroundColor: Colors.lightTheme.primaryColor,
      color: '#ffffff',
      icon: <Svgs.lateWhite height={hp(2)} />,
    },
    Invalid: {
      backgroundColor: '#D50A0A',
      color: '#ffffff',
      icon: <Svgs.alertOutline height={hp(2)} />,
    },
    Requested: {
      backgroundColor: '#F5CD47',
      color: '#000000',
      icon: <Svgs.halfLeave height={hp(2)} />,
    },
    Approved: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Svgs.CheckOutline height={hp(2)} />,
    },
    Processing: {
      backgroundColor: '#F5CD47',
      color: '#ffffff',
      icon: <Svgs.Processing height={hp(2)} />,
    },
    Ongoing: {
      backgroundColor: '#9F8FEF',
      color: '#ffffff',
      icon: <Svgs.ongoingWhite height={hp(2)} width={hp(2)} />,
    },
    Paid: {
      backgroundColor: '#4BCE97',
      color: '#ffffff',
      icon: <Text style={{color: '#ffffff'}}>✓</Text>,
    },
    Overdue: {
      backgroundColor: '#FEA362',
      color: '#ffffff',
      icon: <Svgs.WhiteClock height={hp(2)} width={hp(2)} />,
    },
    approved: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      icon: <Text style={{color: '#ffffff'}}>✓</Text>,
    },
    rejected: {
      backgroundColor: '#F87171',
      color: '#ffffff',
      icon: <Text style={{color: '#ffffff'}}>✗</Text>,
    },
    pending: {
      backgroundColor: '#F5CD47',
      color: '#000000',
      icon: <Text style={{color: '#000000'}}>⏳</Text>,
    },
  };

  const currentExpense = expenseData || transaction;
  const normalizedStatus = currentExpense?.status?.toLowerCase() || 'pending';
  const matchedKey = Object.keys(statusStyles).find(
    key => key.toLowerCase() === normalizedStatus,
  );
  const style = statusStyles[matchedKey] || statusStyles.pending;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <Text style={styles.statusText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StackHeader
        title={'Remuneration Request'}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.5),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{paddingVertical: hp(2)}}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <View style={styles.rowViewSB}>
            <Text style={styles.statusText}>{t('Status')}</Text>
            <StatusBox
              status={t(currentExpense?.status)}
              backgroundColor={style.backgroundColor}
              color={style.color}
              icon={style.icon}
            />
          </View>
          <View style={styles.rowViewSB}>
            <Text style={styles.detailLabel}>{t('Requested')}</Text>
            <Text style={styles.detailValue}>
              {formatDate(currentExpense?.created_at)}
            </Text>
          </View>
        </View>
        <View style={styles.sectionContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>$</Text>
          </View>
          <Text style={styles.sectionTitle}>{t('Remuneration Details')}</Text>
          {renderDetailRow(
            t('Remuneration ID'),
            `#${currentExpense?.id || 'N/A'}`,
          )}
          {renderDetailRow(
            t('Worker ID'),
            `#${currentExpense?.worker_id || 'N/A'}`,
          )}
          {renderDetailRow(t('Type'), 'Remuneration')}
          {renderDetailRow(
            t('Amount'),
            `${currentExpense?.currency} ${currentExpense?.amount || '0'}`,
          )}
          {renderDetailRow(
            t('Date of Remuneration'),
            formatDate(currentExpense?.paid_at),
          )}

          {renderDetailRow(
            t('Description'),
            currentExpense?.note || 'No description',
          )}
          {currentExpense?.receipt_url && (
            <View style={styles.rowViewSB}>
              <Text style={styles.detailLabel}>{t('Receipt')}</Text>
              <TouchableOpacity>
                <Text style={[styles.detailValue, {color: '#007AFF'}]}>
                  View Receipt
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {currentExpense?.decided_at && (
          <View style={styles.sectionContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>i</Text>
            </View>
            <Text style={styles.sectionTitle}>{t('Action Details')}</Text>
            {renderDetailRow(
              t('Decision Status'),
              currentExpense?.status?.toUpperCase() || 'PENDING',
            )}
            {renderDetailRow(
              t('Action Date'),
              formatDateTime(currentExpense?.decided_at),
            )}
            {renderDetailRow(
              t('Decided By (Admin ID)'),
              `#${currentExpense?.decided_by || 'N/A'}`,
            )}
            {renderDetailRow(
              t('Worker ID'),
              `#${currentExpense?.worker_id || 'N/A'}`,
            )}
            {currentExpense?.decision_note && (
              <View style={styles.reasonContainer}>
                <Text style={styles.detailLabel}>{t('Admin Comment')}</Text>
                <Text style={styles.reasonText}>
                  {currentExpense.decision_note}
                </Text>
              </View>
            )}
          </View>
        )}
        {(currentExpense?.status === 'approved' ||
          currentExpense?.status === 'paid') && (
          <View style={styles.receiptContainer}>
            <View style={styles.receiptHeader}>
              <Text style={styles.sectionTitle}>{t('Receipt')}</Text>
            </View>
            <View style={styles.ReceptStyle}>
              <View style={styles.successMessage}>
                <Text style={styles.successText}>
                  {t('Remuneration approved successfully')}
                </Text>
              </View>
              <View style={{paddingHorizontal: wp(8)}}>
                <View style={styles.receiptDetails}>
                  {renderReceiptRow(
                    t('Remuneration ID'),
                    `#${currentExpense?.id}`,
                  )}
                  {renderReceiptRow(
                    t('Worker ID'),
                    `#${currentExpense?.worker_id}`,
                    true,
                  )}
                  {renderReceiptRow(
                    t('Processed Date'),
                    formatDateTime(currentExpense?.paid_at),
                  )}
                  {renderReceiptRow(
                    t('Amount'),
                    `${currentExpense?.currency} ${currentExpense?.amount}`,
                    true,
                  )}

                  {renderReceiptRow(
                    t('Status'),
                    currentExpense?.status?.toUpperCase(),
                  )}

                  {currentExpense?.receipt_url &&
                    renderReceiptRow(t('Receipt URL'), 'Available')}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      padding: wp(4),
      marginVertical: wp(2),
      borderRadius: wp(2),
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: FontsSize.size16,
    },
    statusBadge: {
      paddingHorizontal: wp(3),
      paddingVertical: wp(1),
      borderRadius: wp(4),
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusBadgeText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      marginLeft: wp(1),
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.5),
    },
    iconSection: {
      alignItems: 'center',
      marginVertical: wp(4),
    },
    iconCircle: {
      width: hp(10),
      height: hp(10),
      borderRadius: hp(5),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: wp(3),
      alignSelf: 'center',
      backgroundColor: '#003087',
    },
    iconText: {
      color: Colors.white || '#ffffff',
      fontSize: RFPercentage(3),
      fontFamily: Fonts.PoppinsBold,
    },
    sectionContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      padding: wp(4),
      marginVertical: wp(1),
      borderRadius: wp(2),
    },
    sectionTitle: {
      fontSize: FontsSize.size16,
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    detailLabel: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    detailValue: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'right',
      flex: 1,
    },
    reasonContainer: {
      marginTop: hp(1),
    },
    reasonText: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(0.5),
      lineHeight: RFPercentage(2.5),
    },
    receiptContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      padding: wp(4),
      marginVertical: wp(1),
      borderRadius: wp(2),
      marginBottom: wp(4),
    },
    receiptHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    shareButton: {
      padding: wp(2),
    },
    shareIcon: {
      fontSize: FontsSize.size16,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    ReceptStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    successMessage: {
      backgroundColor: '#c3c7b7',
      padding: wp(3),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: hp(2),
    },
    successIcon: {
      color: '#4BCE97',
      fontSize: FontsSize.size16,
      marginRight: wp(2),
      fontWeight: 'bold',
    },
    successText: {
      color: isDarkMode ? '#000' : '#000',
      fontFamily: Fonts.PoppinsMedium,
      fontSize: FontsSize.size16,
    },
    receiptDetails: {
      marginTop: hp(1),
    },
    receiptRow: {
      marginBottom: hp(1.5),
    },
    receiptLabel: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0.5),
    },
    receiptValue: {
      fontSize: FontsSize.size16,
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    highlightedValue: {
      color: Colors.success,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.successBackground || '#2d5a2d'
        : Colors.lightTheme.successBackground || '#d4edda',
      paddingHorizontal: wp(2),
      paddingVertical: wp(0.5),
      borderRadius: wp(1),
    },
  });

export default RemunerationRequestDetails;
