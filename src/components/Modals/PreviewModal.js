import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useButtonColors} from '../../Constants/colorHelper';
import PDFExportComponentWrapper from '../ExportComponent/PDFExportComponent';

const PreviewModal = ({
  isVisible,
  onClose,
  data,
  documentType,
  companyData,
}) => {
  const {t} = useTranslation();
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const secondaryButtonColors = getButtonColor('secondary');
  const styles = dynamicStyles(isDarkMode, primaryButtonColors);

  const formatDateTime = dateString => {
    if (!dateString) return '-';

    try {
      // Handle different date formats
      let date;

      // If already a Date object
      if (dateString instanceof Date) {
        date = dateString;
      }
      // If string
      else if (typeof dateString === 'string') {
        // Try parsing the date string
        date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
          // Try alternative parsing for common formats
          // For dates like "2024-01-15" or "2024/01/15"
          const parts = dateString.split(/[\/\-]/);
          if (parts.length === 3) {
            // Assume YYYY-MM-DD or DD-MM-YYYY format
            date = new Date(parts[0], parts[1] - 1, parts[2]);
          }
        }
      }

      // If still invalid, return dash
      if (!date || isNaN(date.getTime())) {
        return '-';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return '-';
    }
  };

  const renderInfoRow = (label, value) => {
    // Don't render if label is missing
    if (!label) return null;

    // Show dash for empty/null/undefined values
    const displayValue = value || value === 0 ? value : '-';

    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{displayValue}</Text>
      </View>
    );
  };

  const renderEmploymentCertificatePreview = () => (
    <ScrollView style={styles.previewContent}>
      <View style={styles.documentHeader}>
        <Text style={styles.documentTitle}>{t('EMPLOYMENT CERTIFICATE')}</Text>
      </View>

      {renderInfoRow(t('Name'), data?.preview_data?.workerName)}
      {renderInfoRow(t('Employee ID'), data?.preview_data?.workerId)}
      {renderInfoRow(t('Department'), data?.preview_data?.department)}
      {renderInfoRow(t('Position'), data?.preview_data?.position)}
      {renderInfoRow(
        t('Date of Joining'),
        formatDateTime(data?.preview_data?.dateOfJoining),
      )}
      {renderInfoRow(t('Work Schedule'), data?.preview_data?.workSchedule)}
      {renderInfoRow(
        t('Salary'),
        `${data?.preview_data?.currency || ''} ${
          data?.preview_data?.salary || ''
        }`,
      )}
      {renderInfoRow(t('Company'), data?.preview_data?.companyName)}
    </ScrollView>
  );

  const renderPayslipPreview = () => (
    <ScrollView style={styles.previewContent}>
      <View style={styles.documentHeader}>
        <Text style={styles.documentTitle}>{t('PAYSLIP')}</Text>
      </View>

      {renderInfoRow(t('Period'), data?.preview_data?.period)}
      {renderInfoRow(
        t('Payment Date'),
        formatDateTime(data?.preview_data?.paymentDate),
      )}
      {renderInfoRow(t('Name'), data?.preview_data?.workerName)}
      {renderInfoRow(t('Employee ID'), data?.preview_data?.workerId)}
      {renderInfoRow(t('Department'), data?.preview_data?.department)}
      {renderInfoRow(t('Position'), data?.preview_data?.position)}
      {renderInfoRow(
        t('Basic Salary'),
        `${data?.preview_data?.currency || ''} ${
          data?.preview_data?.basicSalary || ''
        }`,
      )}

      <View style={styles.sectionDivider} />

      {renderInfoRow(
        t('Total Earnings'),
        `${data?.preview_data?.currency || ''} ${
          data?.preview_data?.totalEarnings || ''
        }`,
      )}
      {renderInfoRow(
        t('Total Deductions'),
        `${data?.preview_data?.currency || ''} ${
          data?.preview_data?.totalDeductions || ''
        }`,
      )}
      {renderInfoRow(
        t('Net Pay'),
        `${data?.preview_data?.currency || ''} ${
          data?.preview_data?.netPay || ''
        }`,
      )}

      <View style={styles.sectionDivider} />

      <Text style={styles.sectionTitle}>{t('Allowances')}</Text>
      {data?.preview_data?.allowances?.map((item, index) =>
        renderInfoRow(
          item.name || item.description,
          `${data?.preview_data?.currency || ''} ${item.amount}`,
        ),
      )}

      <Text style={styles.sectionTitle}>{t('Deductions')}</Text>
      {data?.preview_data?.deductions?.map((item, index) =>
        renderInfoRow(
          item.name || item.description,
          `${data?.preview_data?.currency || ''} ${item.amount}`,
        ),
      )}
    </ScrollView>
  );

  const renderPreview = () => {
    if (documentType === 'employment_certificate') {
      return renderEmploymentCertificatePreview();
    } else if (documentType === 'payslip') {
      return renderPayslipPreview();
    }
    return null;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('Preview')}{' '}
            {documentType === 'employment_certificate'
              ? t('Employment Certificate')
              : t('Payslip')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewContainer}>{renderPreview()}</View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
          </TouchableOpacity>

          <PDFExportComponentWrapper
            data={[]}
            columns={[]}
            fileName={`${documentType}_${
              data?.preview_data?.workerName || 'document'
            }_${Date.now()}.pdf`}
            title={
              documentType === 'employment_certificate'
                ? t('Employment Certificate')
                : t('Payslip')
            }
            documentType={documentType}
            documentData={{
              ...data?.preview_data,
              ...companyData,
              allowancesRows:
                documentType === 'payslip'
                  ? data?.preview_data?.allowances || []
                  : [],
              deductionsRows:
                documentType === 'payslip'
                  ? data?.preview_data?.deductions || []
                  : [],
              generatedDate: formatDateTime(new Date().toISOString()),
            }}
            companyLogo={companyData?.companyLogo}
            onExportStart={() => console.log('Export started')}
            onExportSuccess={result => {
              console.log('Export success:', result);
              onClose(); // Close modal on successful export
            }}
            onExportError={error => {
              console.error('Export error:', error);
              Alert.alert(t('Error'), t('Failed to generate document'));
            }}
            showShareDialog={true}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.generateButton,
                {backgroundColor: primaryButtonColors.backgroundColor},
              ]}
              onPress={() => {}}>
              <Text
                style={[
                  styles.generateButtonText,
                  {color: primaryButtonColors.textColor},
                ]}>
                {t('Generate Document')}
              </Text>
            </TouchableOpacity>
          </PDFExportComponentWrapper>
        </View>
      </View>
    </Modal>
  );
};

const dynamicStyles = (isDarkMode, primaryButtonColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    headerTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    closeButton: {
      padding: wp(2),
    },
    closeButtonText: {
      fontSize: RFPercentage(3),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    previewContainer: {
      flex: 1,
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
    },
    previewContent: {
      flex: 1,
    },
    documentHeader: {
      alignItems: 'center',
      marginBottom: hp(3),
      paddingBottom: hp(2),
      borderBottomWidth: 2,
      borderBottomColor: primaryButtonColors.backgroundColor,
    },
    documentTitle: {
      fontFamily: Fonts.PoppinsBold,
      fontSize: RFPercentage(2.5),
      color: primaryButtonColors.backgroundColor,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: hp(1),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    infoLabel: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
    },
    infoValue: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
      textAlign: 'right',
    },
    sectionDivider: {
      height: hp(2),
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: primaryButtonColors.backgroundColor,
      marginTop: hp(1.5),
      marginBottom: hp(1),
    },
    buttonContainer: {
      flexDirection: 'row',
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      gap: wp(2),
    },
    button: {
      flex: 1,
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.borderColor
        : Colors.lightTheme.borderColor,
    },
    cancelButtonText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    generateButton: {
      backgroundColor: primaryButtonColors.backgroundColor,
    },
    generateButtonText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.8),
      color: primaryButtonColors.textColor,
    },
  });

export default PreviewModal;
