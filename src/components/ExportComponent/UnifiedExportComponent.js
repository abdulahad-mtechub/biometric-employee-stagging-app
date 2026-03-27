import React, {useState} from 'react';
import {
  Alert,
  Modal,
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import ExcelExportComponent from './ExcelExportComponent';
import {PDFExportComponent} from './PDFExportComponent';
import {useTranslation} from 'react-i18next';

const UnifiedExportComponent = ({
  data = [],
  columns = [],
  fileName = 'export',
  title = 'Export',
  onExportStart,
  onExportSuccess,
  onExportError,
  children,
  showShareDialog = true,
  maxColumns = 5,
  isDarkMode = false,
  currentLanguage = 'en',
  companyLogo = null, // Make sure this is properly defined
  documentType = null, // 'employment_certificate', 'payslip', or null for table
  documentData = null, // Custom data for documents
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);

  const handleExportPress = () => {
    setModalVisible(true);
  };

  const handleFormatSelection = async format => {
    setModalVisible(false);
    setExporting(true);

    try {
      onExportStart?.();

      // Create export configuration with ALL props including companyLogo
      const exportConfig = {
        data,
        columns,
        fileName,
        title,
        onExportStart,
        onExportSuccess,
        onExportError,
        showShareDialog,
        maxColumns,
        currentLanguage,
        companyLogo, // Make sure this is passed
        documentType,
        documentData,
      };

      console.log('📤 Export Config:', {
        currentLanguage,
        companyLogo,
        dataLength: data.length,
        columns: columns.length,
      });

      if (format === 'pdf') {
        const pdfComponent = new PDFExportComponent(exportConfig);
        await pdfComponent.handleExportPDF();
      } else if (format === 'excel') {
        await ExcelExportComponent.exportToExcel(exportConfig);
      }
    } catch (error) {
      console.error('Export Error:', error);
      onExportError?.(error);
      Alert.alert(
        t('Export Failed'),
        t('An error occurred while exporting the file.'),
      );
    } finally {
      setExporting(false);
    }
  };

  const closeModal = () => setModalVisible(false);

  const renderFormatOption = (format, icon, label, description, color) => (
    <TouchableOpacity
      style={[styles.formatOption, {borderColor: color}]}
      onPress={() => handleFormatSelection(format)}
      disabled={exporting}>
      <View style={styles.formatIconContainer}>
        <Icon name={icon} size={32} color={color} />
      </View>
      <View style={styles.formatTextContainer}>
        <Text style={[styles.formatLabel, {color}]}>{t(label)}</Text>
        <Text style={styles.formatDescription}>{t(description)}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={color} />
    </TouchableOpacity>
  );

  // Custom children support
  if (children) {
    return (
      <>
        {React.cloneElement(React.Children.only(children), {
          onPress: handleExportPress,
        })}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('Choose Export Format')}
                </Text>

                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.closeButton}>
                  <Icon
                    name="close"
                    size={24}
                    color={styles.closeButtonText.color}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                {t('Select the format you want to export your data in:')}
              </Text>

              <View style={styles.optionsContainer}>
                {renderFormatOption(
                  'pdf',
                  'picture-as-pdf',
                  'PDF Document',
                  'Portable Document Format - Great for viewing and printing',
                  '#FF5722',
                )}
                {renderFormatOption(
                  'excel',
                  'grid-on',
                  'Excel Spreadsheet',
                  'Microsoft Excel format - Great for data analysis',
                  '#4CAF50',
                )}
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Default button
  return (
    <>
      <TouchableOpacity
        style={styles.defaultButton}
        onPress={handleExportPress}>
        <Icon name="file-download" size={20} color="white" />
        <Text style={styles.defaultButtonText}>{t('Export Data')}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Choose Export Format')}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Icon
                  name="close"
                  size={24}
                  color={styles.closeButtonText.color}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {t('Select the format you want to export your data in:')}
            </Text>

            <View style={styles.optionsContainer}>
              {renderFormatOption(
                'pdf',
                'picture-as-pdf',
                'PDF Document',
                'Portable Document Format - Great for viewing and printing',
                '#FF5722',
              )}
              {renderFormatOption(
                'excel',
                'grid-on',
                'Excel Spreadsheet',
                'Microsoft Excel format - Great for data analysis',
                '#4CAF50',
              )}
            </View>

            <View style={styles.infoContainer}>
              <Icon name="info" size={16} color={styles.infoText.color} />
              <Text style={styles.infoText}>
                {t(
                  'Files will be saved to your device and can be shared immediately.',
                )}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    defaultButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: wp(5),
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
    },
    defaultButtonText: {
      color: 'white',
      fontSize: RFPercentage(2),
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
      borderRadius: wp(4),
      padding: wp(6),
      width: wp(85),
      maxHeight: hp(70),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    modalTitle: {
      fontSize: RFPercentage(2.8),
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#000000',
    },
    closeButton: {
      padding: wp(1),
    },
    closeButtonText: {
      color: isDarkMode ? '#FFFFFF' : '#666666',
    },
    modalSubtitle: {
      fontSize: RFPercentage(2),
      color: isDarkMode ? '#CCCCCC' : '#666666',
      marginBottom: hp(3),
      lineHeight: hp(2.5),
    },
    optionsContainer: {
      gap: hp(2),
      marginBottom: hp(3),
    },
    formatOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(4),
      borderWidth: 2,
      borderRadius: wp(3),
      backgroundColor: isDarkMode ? '#3C3C3E' : '#F8F9FA',
    },
    formatIconContainer: {
      marginRight: wp(4),
    },
    formatTextContainer: {
      flex: 1,
    },
    formatLabel: {
      fontSize: RFPercentage(2.2),
      fontWeight: '600',
      marginBottom: hp(0.5),
    },
    formatDescription: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode ? '#CCCCCC' : '#666666',
      lineHeight: hp(2.2),
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: wp(3),
      backgroundColor: isDarkMode ? '#1C1C1E' : '#E3F2FD',
      borderRadius: wp(2),
      gap: wp(2),
    },
    infoText: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode ? '#CCCCCC' : '#666666',
      flex: 1,
      lineHeight: hp(2),
    },
  });

export default UnifiedExportComponent;
