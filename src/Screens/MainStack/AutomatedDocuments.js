import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import TabSelector from '../../components/TabSelector/TabSelector';
import StackHeader from '../../components/Header/StackHeader';
import {useButtonColors} from '../../Constants/colorHelper';
import PreviewModal from '../../components/Modals/PreviewModal';
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import {useWorkerCompanyProfile} from '../../hooks/useWorkerCompanyProfile';
import {
  previewEmploymentCertificate,
  previewPayslip,
  getPayslipPeriods,
} from '../../Constants/api';

const AutomatedDocuments = ({navigation}) => {
  const {t} = useTranslation();
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const styles = dynamicStyles(isDarkMode, primaryButtonColors);
  const {isLoggedIn} = useSelector(state => state.auth);
  const {companyData} = useWorkerCompanyProfile();
  const [selectedTab, setSelectedTab] = useState(t('Employment Certificate'));
  const [openPreview, setOpenPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const token = useSelector(state => state?.auth?.user?.token);

  React.useEffect(() => {
    if (
      selectedTab === t('Payslip') &&
      isLoggedIn &&
      availablePeriods.length === 0
    ) {
      fetchAvailablePeriods();
    }
  }, [selectedTab, isLoggedIn]);

  const showAlert = (message, type = 'error') => {
    Alert.alert(type === 'error' ? t('Error') : t('Success'), message);
  };

  const fetchAvailablePeriods = async () => {
    try {
      if (!token) {
        showAlert(t('Authentication required. Please login again.'), 'error');
        return;
      }

      const response = await getPayslipPeriods(token);

      if (response.error) {
        throw new Error(response.message || 'Failed to fetch periods');
      }

      const periodsList = response.data?.periods || [];
      console.log('Fetched periods:', JSON.stringify(periodsList, null, 2));
      const formattedPeriods = periodsList.map(period => {
        if (typeof period === 'string') {
          return {
            label: period,
            value: period,
          };
        }
        let formattedDate = '';
        if (period.paid_at) {
          try {
            const date = new Date(period.paid_at);
            formattedDate = date.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
          } catch (e) {
            formattedDate = period.period_label || period.period || '';
          }
        }

        return {
          label: formattedDate || period.period_label || period.period || '',
          value: period.period || period.period_label || '',
        };
      });

      setAvailablePeriods(formattedPeriods);
    } catch (error) {
      console.error('Error fetching periods:', error);
      showAlert(t('Failed to load available periods'), 'error');
    }
  };

  const handlePeriodSelect = period => {
    setSelectedPeriod(period);
    handlePreviewPayslip(period.value);
  };

  const handlePreviewEmploymentCertificate = async () => {
    try {
      setLoading(true);
      const response = await previewEmploymentCertificate(token);

      if (response.error) {
        showAlert(
          response.message || t('Failed to preview employment certificate'),
          'error',
        );
        return;
      }

      setPreviewData(response.data);
      setOpenPreview(true);
    } catch (error) {
      console.error('Error previewing employment certificate:', error);
      showAlert(t('Failed to preview employment certificate'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPayslip = async period => {
    try {
      setLoading(true);

      if (!token) {
        showAlert(t('Authentication required. Please login again.'), 'error');
        setLoading(false);
        return;
      }

      const response = await previewPayslip(period, token);

      if (response.error) {
        showAlert(response.message || t('Failed to preview payslip'), 'error');
        return;
      }

      setPreviewData(response.data);
      setOpenPreview(true);
    } catch (error) {
      console.error('Error previewing payslip:', error);
      showAlert(t('Failed to preview payslip'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const EmploymentCertificateTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>{t('Employment Certificate')}</Text>
        <Text style={styles.infoDescription}>
          {t('Generate an official employment certificate for your records')}
        </Text>
      </View>

      {!isLoggedIn ? (
        <View style={styles.authRequiredContainer}>
          <Text style={styles.authRequiredText}>
            {t('Please log in to access this feature')}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.actionButton,
            {backgroundColor: primaryButtonColors.backgroundColor},
          ]}
          onPress={handlePreviewEmploymentCertificate}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={primaryButtonColors.textColor} />
          ) : (
            <>
              <Text
                style={[
                  styles.actionButtonText,
                  {color: primaryButtonColors.textColor},
                ]}>
                {t('Preview Employment Certificate')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const PayslipTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>{t('Payslip')}</Text>
        <Text style={styles.infoDescription}>
          {t('Select a pay period and generate your payslip')}
        </Text>
      </View>

      {!isLoggedIn ? (
        <View style={styles.authRequiredContainer}>
          <Text style={styles.authRequiredText}>
            {t('Please log in to access this feature')}
          </Text>
        </View>
      ) : (
        <View style={styles.dropdownContainer}>
          <CustomDropDown
            data={availablePeriods}
            selectedValue={selectedPeriod?.value || selectedPeriod}
            onValueChange={value => {
              const selectedItem = availablePeriods.find(
                item => item.value === value,
              );
              if (selectedItem) {
                handlePeriodSelect(selectedItem);
              }
            }}
            placeholder={t('Select a pay period')}
            backgroundColor={
              isDarkMode
                ? Colors.darkTheme.secondryColor
                : Colors.lightTheme.secondryColor
            }
            width={wp(90)}
          />
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={primaryButtonColors.textColor} />
              <Text style={styles.loadingText}>{t('Loading periods...')}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case t('Employment Certificate'):
        return <EmploymentCertificateTab />;
      case t('Payslip'):
        return <PayslipTab />;
      default:
        return <EmploymentCertificateTab />;
    }
  };

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Automated Documents')}
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.tabSelectorContainer}>
        <TabSelector
          tabs={[t('Employment Certificate'), t('Payslip')]}
          selectedTab={selectedTab}
          onTabPress={tab => setSelectedTab(tab)}
          isScrollable={false}
          alignTabsLeft={false}
          style={styles.tabSelector}
        />
      </View>
      <View style={styles.contentContainer}>{renderTabContent()}</View>

      {/* Preview Modal */}
      <PreviewModal
        isVisible={openPreview}
        onClose={() => {
          setOpenPreview(false);
          setPreviewData(null);
        }}
        data={previewData}
        documentType={
          selectedTab === t('Employment Certificate')
            ? 'employment_certificate'
            : 'payslip'
        }
        companyData={companyData}
      />
    </View>
  );
};

const dynamicStyles = (isDarkMode, primaryButtonColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      paddingVertical: hp(2),
    },

    tabSelectorContainer: {
      backgroundColor: '#FFF',
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
    },
    tabContent: {
      flex: 1,
    },
    infoContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: wp(2),
      marginBottom: hp(3),
    },
    infoTitle: {
      fontFamily: Fonts.PoppinsBold,
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
    },
    infoDescription: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      lineHeight: RFPercentage(2.5),
    },
    actionButton: {
      paddingVertical: hp(2),
      paddingHorizontal: wp(4),
      borderRadius: wp(2),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: hp(2),
    },
    actionButtonText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.9),
      textAlign: 'center',
    },
    authRequiredContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      paddingHorizontal: wp(4),
      paddingVertical: hp(3),
      borderRadius: wp(2),
      marginTop: hp(2),
      alignItems: 'center',
    },
    authRequiredText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },
    dropdownContainer: {
      marginTop: hp(2),
      gap: hp(1.5),
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
      marginTop: hp(1),
    },
    loadingText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
  });

export default AutomatedDocuments;
