import React, {useRef, useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import RNFS from 'react-native-fs';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import ReusableBottomSheet from '../../components/BottomSheets/ReusableBottomSheet';
import RequestDetailsCard from '../../components/Cards/RequestDetailsCard';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import StackHeader from '../../components/Header/StackHeader';
import {pxToPercentage} from '../../utils/responsive';
import WebViewModal from '../../components/Modals/WebViewModal';
import {useAlert} from '../../Providers/AlertContext';

const DocumentDetails = ({route, navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const item = route.params?.item;
  const type = route.params?.type;
  const btmSheetRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const [hasNetworkConnection, setHasNetworkConnection] = useState(true);
  const styles = dynamicStyles(isDarkMode, theme);
  const {showAlert} = useAlert();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setHasNetworkConnection(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const DocumentDetail = [
    {label: 'Document Name', value: item?.name || 'N/A'},
    {label: 'Description', value: item?.description || 'N/A'},
    {label: 'File Type', value: item?.file_type?.toUpperCase() || 'N/A'},
    {label: 'Category', value: item?.category || 'N/A'},
    {
      label: 'Uploaded At',
      value: item?.uploaded_at
        ? new Date(item.uploaded_at).toLocaleDateString()
        : 'N/A',
    },
  ];

  // Improved function to get file URL from various possible fields
  const getFileUrl = () => {
    // Check multiple possible URL fields
    const possibleUrls = [
      item?.document_url,
      item?.file_url,
      item?.url,
      item?.download_url,
      item?.path,
      item?.attachment_url,
    ];

    // Return the first valid URL
    const validUrl = possibleUrls.find(
      url => url && (url.startsWith('http://') || url.startsWith('https://')),
    );

    return validUrl || null;
  };

  // Function to check if URL is valid and accessible
  const checkUrlAccessibility = async url => {
    try {
      const response = await fetch(url, {method: 'HEAD'});
      return response.ok; // Returns true for 200-299 status codes
    } catch (error) {
      console.log('URL accessibility check failed:', error);
      return false;
    }
  };

  const isPdfAvailable = getFileUrl();

  // Function to check network connection
  const checkNetworkConnection = async () => {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected;
  };

  // Function to handle viewing document
  const handleViewDocument = async () => {
    if (!hasNetworkConnection) {
      showAlert(
        'Please check your internet connection to view the document',
        'error',
        'No Internet',
      );
      return;
    }

    if (!isPdfAvailable) {
      showAlert('No document available to view', 'error', 'Error');
      return;
    }

    // Check if URL is accessible before opening WebView
    const isAccessible = await checkUrlAccessibility(getFileUrl());
    if (!isAccessible) {
      showAlert(
        'The document cannot be accessed at this time. It may have been removed or you may not have permission to view it.',
        'error',
        'Document Unavailable',
      );
      setIsWebViewVisible(true);
      return;
    }

    setIsWebViewVisible(true);
  };

  // Enhanced download function with URL validation
  const handleDownload = async () => {
    if (!hasNetworkConnection) {
      showAlert(
        'Please check your internet connection to download the document',
        'error',
        'No Internet',
      );
      return;
    }

    if (!isPdfAvailable) {
      showAlert('No document available for download', 'error', 'Error');
      return;
    }

    if (isDownloading) return;

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const fileUrl = getFileUrl();
      const fileName = `${
        item?.name?.replace(/[^a-zA-Z0-9.\-_]/g, '_') || 'document'
      }.${item?.file_type || 'pdf'}`;

      console.log('Attempting to download from URL:', fileUrl);
      console.log('File name:', fileName);

      // First, check if URL is accessible
      const isAccessible = await checkUrlAccessibility(fileUrl);
      if (!isAccessible) {
        throw new Error(
          'Document is not accessible. It may have been removed or you may not have permission.',
        );
      }

      // Request storage permission
      await requestStoragePermission();

      // Try direct download first (simplified approach)
      await downloadFileDirect(fileUrl, fileName);
    } catch (error) {
      console.error('Download error details:', error);
      setIsDownloading(false);
      setDownloadProgress(0);

      let errorMessage = 'Unable to download the file. ';

      if (error.message.includes('404')) {
        errorMessage =
          'Document not found (404). The file may have been moved or deleted.';
      } else if (
        error.message.includes('permission') ||
        error.message.includes('access')
      ) {
        errorMessage = 'You do not have permission to access this document.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage += error.message;
      }

      showAlert(errorMessage, 'error', 'Download Failed');
      const url = getFileUrl();
      if (url) {
        Linking.openURL(url).catch(() =>
          showAlert('Cannot open URL in browser', 'error', 'Error'),
        );
      }
    }
  };

  // Simplified download function
  const downloadFileDirect = async (fileUrl, fileName) => {
    try {
      let downloadPath;

      if (Platform.OS === 'android') {
        // For Android, use Downloads directory
        downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        // For iOS, use DocumentDirectory
        downloadPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }

      console.log('Download path:', downloadPath);

      const options = {
        fromUrl: fileUrl,
        toFile: downloadPath,
        background: true,
        discretionary: true,
        progress: res => {
          if (res.contentLength > 0) {
            const progress = Math.floor(
              (res.bytesWritten / res.contentLength) * 100,
            );
            setDownloadProgress(progress);
            console.log(`Download progress: ${progress}%`);
          }
        },
        headers: {
          // Add any required headers here
          'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)',
        },
      };

      const result = await RNFS.downloadFile(options).promise;

      console.log('Download result:', {
        statusCode: result.statusCode,
        bytesWritten: result.bytesWritten,
      });

      if (result.statusCode === 200) {
        setIsDownloading(false);
        setDownloadProgress(100);

        showAlert(
          `Document downloaded successfully to: ${downloadPath}`,
          'success',
          'Success',
        );
      } else {
        throw new Error(`Server returned status: ${result.statusCode}`);
      }
    } catch (error) {
      console.error('Direct download error:', error);
      throw error;
    }
  };

  // Request storage permission function (simplified)
  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      // For Android 13+ (API 33+)
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to save files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      // For older Android versions
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage to save files',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const formatFileSize = sizeInKB => {
    if (!sizeInKB) return t('Size unknown');
    if (sizeInKB < 1024) return `${sizeInKB} KB`;
    return `${(sizeInKB / 1024).toFixed(2)} MB`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        <StackHeader
          title={item?.name}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />

        {/* Network Connection Warning */}
        {/* {!hasNetworkConnection && (
          <View style={styles.networkWarning}>
            <Text style={styles.networkWarningText}>
              No internet connection. Some features may not work.
            </Text>
          </View>
        )} */}

        <View style={styles.statusContainer}>
          <WorkerStatus
            name={'Status'}
            status={t(item?.status)}
            nameTextStyle={styles.statusText}
            statusStyle={
              item?.status === 'active' ? styles.activeStatus : undefined
            }
          />
        </View>

        <RequestDetailsCard
          heading={'Document Details'}
          details={DocumentDetail}
          showFrom={false}
          onPathPress={() => {}}
          showChevron={false}
        />

        {/* Document Preview Section */}
        <View style={styles.cardContainer}>
          <View style={styles.rowSb}>
            <Text style={styles.title}>{t('Document')}</Text>
            {isPdfAvailable && !isDownloading && (
              <View style={styles.actionButtonsContainer}>
                {/* View Document Button */}
                <TouchableOpacity
                  onPress={handleViewDocument}
                  style={styles.viewButton}
                  disabled={!hasNetworkConnection}>
                  <Svgs.eye height={20} width={20} />
                  <Text style={styles.viewButtonText}>{t('View')}</Text>
                </TouchableOpacity>

                {/* Download Button */}
                <TouchableOpacity
                  onPress={handleDownload}
                  style={styles.downloadButton}
                  disabled={!hasNetworkConnection}>
                  <Svgs.download height={20} width={20} />
                  <Text style={styles.downloadButtonText}>{t('Download')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.pdfContainer}>
            {isPdfAvailable ? (
              <Pressable
                style={styles.pdfContent}
                onPress={handleViewDocument}
                disabled={isDownloading || !hasNetworkConnection}>
                <Svgs.pdf />
                <Text style={styles.pdfText}>
                  {item?.name || 'Document'}.{item?.file_type || 'pdf'}
                </Text>
                <Text style={styles.SizeText}>
                  {formatFileSize(item?.file_size)}
                </Text>

                {isDownloading && (
                  <View style={styles.progressContainer}>
                    <ActivityIndicator
                      size="small"
                      color={
                        isDarkMode
                          ? Colors.darkTheme.primaryBtn.BtnColor
                          : Colors.lightTheme.primaryBtn.BtnColor
                      }
                    />
                    <Text style={styles.progressText}>
                      Downloading... {downloadProgress}%
                    </Text>
                  </View>
                )}

                {!hasNetworkConnection && (
                  <View style={styles.offlineContainer}>
                    <Text style={styles.offlineText}>
                      Offline - Connect to view/download
                    </Text>
                  </View>
                )}
              </Pressable>
            ) : (
              <View style={styles.noPdfContainer}>
                <Svgs.noDoc height={50} width={50} />
                <Text style={styles.noPdfText}>No Document Available</Text>
                <Text style={styles.noPdfSubText}>
                  This document is not available for viewing or download
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* WebView Modal for Document Preview */}
      {isPdfAvailable && (
        <WebViewModal
          visible={isWebViewVisible}
          onClose={() => setIsWebViewVisible(false)}
          documentUrl={getFileUrl()}
          documentName={item?.name || 'Document'}
          fileType={item?.file_type}
        />
      )}

      <ReusableBottomSheet
        height={hp('26%')}
        refRBSheet={btmSheetRef}
        sheetTitle={'Select An Option'}
        options={[
          {
            icon: <Svgs.edit height={hp(4)} />,
            title: 'Edit',
            description: 'Select edit to edit the document.',
            onPress: () => btmSheetRef.current?.close(),
          },
          {
            icon: <Svgs.deleteBlueOutline height={hp(4)} />,
            title: 'Delete',
            description: 'Select delete to delete document.',
            onPress: () => btmSheetRef.current?.close(),
          },
        ]}
      />
    </View>
  );
};

export default DocumentDetails;

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
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    networkWarning: {
      backgroundColor: '#FFEAA7',
      padding: wp(3),
      marginHorizontal: wp(4),
      marginTop: hp(1),
      borderRadius: wp(2),
    },
    networkWarningText: {
      color: '#D35400',
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(1.6),
      textAlign: 'center',
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      paddingVertical: wp(2),
      paddingHorizontal: wp(3),
      marginTop: wp(2),
      borderRadius: wp(2),
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: theme.primaryTextColor,
      fontSize: RFPercentage(pxToPercentage(16)),
    },
    activeStatus: {
      color: '#22C55E',
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
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
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
      textAlignVertical: 'center',
    },
    pdfContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? `${Colors.darkTheme.backgroundColor}90`
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      height: hp(30),
      marginTop: hp(2),
    },
    pdfContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    pdfText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.NunitoBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(0.5),
      textAlign: 'center',
    },
    SizeText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.NunitoMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(0.5),
    },
    // Action buttons container
    actionButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#E8F4FF',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : '#007AFF',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: wp(2),
      gap: wp(1),
    },
    viewButtonText: {
      color: isDarkMode ? Colors.darkTheme.primaryBtn.BtnColor : '#007AFF',
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: wp(2),
      gap: wp(1),
    },
    downloadButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
    },
    progressContainer: {
      marginTop: hp(1),
      alignItems: 'center',
    },
    progressText: {
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.NunitoMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(0.5),
    },
    noPdfContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: wp(4),
    },
    noPdfText: {
      fontSize: RFPercentage(2.2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(1),
      textAlign: 'center',
    },
    noPdfSubText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginTop: hp(0.5),
      textAlign: 'center',
    },
    offlineContainer: {
      marginTop: hp(1),
      backgroundColor: isDarkMode ? '#333' : '#F0F0F0',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      borderRadius: wp(2),
    },
    offlineText: {
      fontSize: RFPercentage(1.4),
      fontFamily: Fonts.NunitoMedium,
      color: isDarkMode ? '#FFA726' : '#F57C00',
    },
  });
