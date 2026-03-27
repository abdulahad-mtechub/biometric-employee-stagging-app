import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {viewDocument} from '@react-native-documents/viewer';

const ExpenseRequestDetails = ({navigation, route}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const [imageError, setImageError] = useState(false);
  const transaction = route?.params?.item;
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileType, setFileType] = useState(null); // 'image' or 'pdf'

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

  // Detect file type from URL
  useEffect(() => {
    const currentExpense = expenseData || transaction;
    if (currentExpense?.receipt_url) {
      const url = currentExpense.receipt_url.toLowerCase();
      if (url.endsWith('.pdf') || url.includes('/pdfs/')) {
        setFileType('pdf');
      } else if (
        url.endsWith('.jpg') ||
        url.endsWith('.jpeg') ||
        url.endsWith('.png') ||
        url.endsWith('.gif') ||
        url.endsWith('.webp') ||
        url.includes('/images/')
      ) {
        setFileType('image');
      } else {
        // Default to image if unknown
        setFileType('image');
      }
    }
  }, [expenseData, transaction]);

  const handleViewPdf = async () => {
    const currentExpense = expenseData || transaction;
    if (!currentExpense?.receipt_url) return;

    try {
      await viewDocument({
        uri: currentExpense.receipt_url,
        mimeType: 'application/pdf',
      });
    } catch (error) {
      console.error('Error opening PDF:', error);
      // Fallback to opening in browser
      try {
        await Linking.openURL(currentExpense.receipt_url);
      } catch (linkError) {
        console.error('Error opening URL:', linkError);
      }
    }
  };
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const StatusBox = ({status, backgroundColor, color, icon}) => (
    <View style={[styles.statusBadge, {backgroundColor}]}>
      {icon}
      <Text style={[styles.statusBadgeText, {color}]}>{t(status)}</Text>
    </View>
  );

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
      // icon: <Text style={{color: '#ffffff'}}>✓</Text>,
    },
    Overdue: {
      backgroundColor: '#FEA362',
      color: '#ffffff',
      icon: <Svgs.WhiteClock height={hp(2)} width={hp(2)} />,
    },
    approved: {
      backgroundColor: '#34D399',
      color: '#ffffff',
      // icon: <Text style={{color: '#ffffff'}}>✓</Text>,
    },
    rejected: {
      backgroundColor: '#F87171',
      color: '#ffffff',
      // icon: <Text style={{color: '#ffffff'}}>✗</Text>,
    },
    pending: {
      backgroundColor: '#F5CD47',
      color: '#000000',
      // icon: <Text style={{color: '#000000'}}>⏳</Text>,
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
        <Text style={styles.statusText}>{t('Loading...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Expense Request')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.5),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{paddingVertical: hp(2)}}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Amount Card - Hero Section */}
        <View style={styles.amountCard}>
          <View style={styles.amountHeader}>
            <View style={styles.amountIconContainer}>
              <MaterialIcons name="attach-money" size={hp(4)} color="#ffffff" />
            </View>
            <View style={styles.amountInfo}>
              <Text style={styles.amountLabel}>{t('Expense Amount')}</Text>
              <Text style={styles.amountValue}>
                {currentExpense?.currency || 'USD'}{' '}
                {currentExpense?.amount || '0.00'}
              </Text>
            </View>
          </View>
          <View style={styles.amountFooter}>
            <View style={styles.amountFooterItem}>
              <MaterialIcons
                name="calendar-today"
                size={hp(2)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : Colors.lightTheme.secondryTextColor
                }
              />
              <Text style={styles.amountFooterText}>
                {formatDate(currentExpense?.date_of_expense)}
              </Text>
            </View>
            <StatusBox
              status={currentExpense?.status}
              backgroundColor={style.backgroundColor}
              color={style.color}
              icon={style.icon}
            />
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="info-outline"
              size={hp(2.5)}
              color={
                isDarkMode
                  ? Colors.darkTheme.primaryTextColor
                  : Colors.lightTheme.primaryTextColor
              }
            />
            <Text style={styles.sectionTitle}>{t('Request Information')}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('Request ID')}</Text>
              <Text style={styles.infoValue}>
                #{currentExpense?.id || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('Worker ID')}</Text>
              <Text style={styles.infoValue}>
                #{currentExpense?.worker_id || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('Created Date')}</Text>
              <Text style={styles.infoValue}>
                {formatDate(currentExpense?.created_at)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('Last Updated')}</Text>
              <Text style={styles.infoValue}>
                {formatDate(currentExpense?.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        {currentExpense?.description && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="description"
                size={hp(2.5)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryTextColor
                    : Colors.lightTheme.primaryTextColor
                }
              />
              <Text style={styles.sectionTitle}>{t('Description')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>
                {currentExpense?.description}
              </Text>
            </View>
          </View>
        )}

        {/* Receipt Section */}
        {currentExpense?.receipt_url && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="receipt"
                size={hp(2.5)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.primaryTextColor
                    : Colors.lightTheme.primaryTextColor
                }
              />
              <Text style={styles.sectionTitle}>{t('Attached Receipt')}</Text>
            </View>
            <View style={styles.divider} />

            {fileType === 'pdf' ? (
              // PDF View
              <TouchableOpacity
                style={styles.pdfContainer}
                activeOpacity={0.7}
                onPress={handleViewPdf}>
                <View style={styles.pdfIconContainer}>
                  <MaterialIcons
                    name="picture-as-pdf"
                    size={hp(6)}
                    color="#FF0000"
                  />
                </View>
                <View style={styles.pdfInfo}>
                  <Text style={styles.pdfTitle}>{t('Receipt Document')}</Text>
                  <Text style={styles.pdfSubtitle}>{t('Tap to view PDF')}</Text>
                </View>
                <MaterialIcons
                  name="open-in-new"
                  size={hp(3)}
                  color={
                    isDarkMode
                      ? Colors.darkTheme.primaryTextColor
                      : Colors.lightTheme.primaryTextColor
                  }
                />
              </TouchableOpacity>
            ) : (
              // Image View
              <View style={styles.receiptImageContainer}>
                {!imageError ? (
                  <Image
                    source={{uri: currentExpense?.receipt_url}}
                    style={styles.receiptImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.imageErrorContainer}>
                    <MaterialIcons
                      name="image-not-supported"
                      size={hp(8)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.secondryTextColor
                          : Colors.lightTheme.secondryTextColor
                      }
                    />
                    <Text style={styles.imageErrorText}>
                      {t('Failed to load receipt image')}
                    </Text>
                  </View>
                )}
              </View>
            )}
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
    scrollContent: {
      paddingBottom: hp(3),
    },
    // Amount Card Styles
    amountCard: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      marginTop: hp(2),
      marginBottom: hp(1.5),
      borderRadius: wp(3),
      overflow: 'hidden',
      shadowColor: '#dcdcdc',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    amountHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(4),
      paddingBottom: wp(3),
    },
    amountIconContainer: {
      width: hp(7),
      height: hp(7),
      borderRadius: hp(3.5),
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
    },
    amountInfo: {
      flex: 1,
    },
    amountLabel: {
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0.3),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    amountValue: {
      fontSize: RFPercentage(3.2),
      fontFamily: Fonts.PoppinsBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    amountFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: wp(3),
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    amountFooterItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    amountFooterText: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginLeft: wp(1.5),
    },
    statusBadge: {
      paddingHorizontal: wp(3),
      paddingVertical: wp(1.5),
      borderRadius: wp(5),
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#dcdcdc',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    statusBadgeText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.6),
      marginLeft: wp(1),
      textTransform: 'capitalize',
    },
    // Section Container Styles
    sectionContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      padding: wp(4),
      marginVertical: hp(0.75),
      borderRadius: wp(3),
      shadowColor: '#dcdcdc',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    sectionTitle: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(2),
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
      marginBottom: hp(1.5),
    },
    // Info Grid Styles
    infoGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: hp(1.5),
    },
    infoItem: {
      flex: 1,
      marginHorizontal: wp(1),
    },
    infoLabel: {
      fontSize: RFPercentage(1.5),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0.4),
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    infoValue: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    descriptionBox: {
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.02)',
      padding: wp(3.5),
      borderRadius: wp(2),
    },
    descriptionText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      lineHeight: RFPercentage(2.8),
    },
    receiptImageContainer: {
      borderRadius: wp(2),
      overflow: 'hidden',
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.02)',
    },
    receiptImage: {
      width: '100%',
      height: hp(35),
      borderRadius: wp(2),
    },
    imageErrorContainer: {
      height: hp(25),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
    },
    imageErrorText: {
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(1),
    },
    // PDF Styles
    pdfContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.02)',
      padding: wp(4),
      borderRadius: wp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.1)',
      borderStyle: 'dashed',
    },
    pdfIconContainer: {
      width: hp(8),
      height: hp(8),
      borderRadius: wp(2),
      backgroundColor: isDarkMode
        ? 'rgba(255, 0, 0, 0.1)'
        : 'rgba(255, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
    },
    pdfInfo: {
      flex: 1,
    },
    pdfTitle: {
      fontSize: RFPercentage(1.9),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.3),
    },
    pdfSubtitle: {
      fontSize: RFPercentage(1.5),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: FontsSize.size16,
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.5),
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
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
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

export default ExpenseRequestDetails;
