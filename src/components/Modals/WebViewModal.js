import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {Svgs} from '../../assets/Svgs/Svgs';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';

const WebViewModal = ({
  visible,
  onClose,
  documentUrl,
  documentName,
  fileType = 'pdf',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const isDarkMode = useSelector(store => store.theme.isDarkMode);
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const {t} = useTranslation();

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      paddingTop: Platform.OS === 'ios' ? hp(6) : hp(2),
      backgroundColor: theme.secondryColor,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#E5E5EA',
    },
    headerTitle: {
      flex: 1,
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: theme.primaryTextColor,
      textAlign: 'center',
      marginHorizontal: wp(2),
    },
    closeButton: {
      padding: wp(2),
      zIndex: 1,
    },
    webViewContainer: {
      flex: 1,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(4),
      backgroundColor: theme.backgroundColor,
    },
    errorText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsMedium,
      color: theme.primaryTextColor,
      textAlign: 'center',
      marginTop: hp(2),
    },
    errorSubText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.NunitoRegular,
      color: theme.secondryTextColor,
      textAlign: 'center',
      marginTop: hp(1),
      marginHorizontal: wp(4),
    },
    retryButton: {
      marginTop: hp(3),
      backgroundColor: theme.primaryBtn.BtnColor,
      paddingHorizontal: wp(6),
      paddingVertical: hp(1.2),
      borderRadius: wp(2),
      minWidth: wp(30),
    },
    retryButtonText: {
      color: theme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      textAlign: 'center',
    },
    controlsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(2),
    },
    reloadButton: {
      padding: wp(2),
      marginLeft: wp(2),
    },
    actionButton: {
      padding: wp(2),
      marginHorizontal: wp(1),
    },
  });

  // Check if URL is valid for WebView
  const isUrlValidForWebView = url => {
    if (!url) return false;

    // Check if it's a valid web URL
    const isWebUrl = url.startsWith('http://') || url.startsWith('https://');

    if (!isWebUrl) return false;

    // Check for common document extensions
    const documentExtensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.txt',
      '.rtf',
      '.odt',
      '.xls',
      '.xlsx',
      '.csv',
      '.ppt',
      '.pptx',
      '.pages',
      '.numbers',
      '.key',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.tiff',
      '.html',
      '.htm',
    ];

    const hasDocumentExtension = documentExtensions.some(ext =>
      url.toLowerCase().includes(ext),
    );

    // If it has a document extension or we have a file type, allow it
    return hasDocumentExtension || fileType;
  };

  // Format URL for WebView with better compatibility
  const getWebViewUrl = () => {
    if (!documentUrl) return null;

    const url = documentUrl.trim();

    // Clean the URL
    let cleanedUrl = url;

    // Remove any extra quotes or spaces
    cleanedUrl = cleanedUrl.replace(/["']/g, '');

    // Use Google Docs viewer for better compatibility with various formats
    const useGoogleViewer = () => {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        cleanedUrl,
      )}`;
    };

    // Check file type or extension
    const fileTypeLower = fileType?.toLowerCase() || '';
    const urlLower = cleanedUrl.toLowerCase();

    // Use Google viewer for these formats
    const formatsForGoogleViewer = [
      'pdf',
      'doc',
      'docx',
      'ppt',
      'pptx',
      'xls',
      'xlsx',
      'odt',
      'ods',
      'odp',
    ];

    const shouldUseGoogleViewer = formatsForGoogleViewer.some(
      format =>
        fileTypeLower.includes(format) || urlLower.includes(`.${format}`),
    );

    if (shouldUseGoogleViewer) {
      return useGoogleViewer();
    }

    // For images, use direct URL
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'];
    const isImage = imageFormats.some(
      format =>
        fileTypeLower.includes(format) || urlLower.includes(`.${format}`),
    );

    if (isImage) {
      return cleanedUrl;
    }

    // For text files, try to display directly
    if (fileTypeLower.includes('txt') || urlLower.includes('.txt')) {
      return cleanedUrl;
    }

    // Default: use Google viewer as fallback
    return useGoogleViewer();
  };

  const webViewUrl = getWebViewUrl();
  const canDisplay = isUrlValidForWebView(documentUrl);

  const handleError = syntheticEvent => {
    const {nativeEvent} = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setIsLoading(false);
    setHasError(true);
    setShowRetry(true);
  };

  const handleLoad = () => {
    console.log('WebView loaded successfully');
    setIsLoading(false);
    setHasError(false);
    setShowRetry(false);
    setLoadAttempts(0);
  };

  const handleLoadEnd = () => {
    // If still loading after timeout, show error
    setTimeout(() => {
      if (isLoading && loadAttempts > 2) {
        handleError({nativeEvent: {description: 'Timeout loading document'}});
      }
    }, 10000);
  };

  const handleRetry = () => {
    setHasError(false);
    setShowRetry(false);
    setIsLoading(true);
    setLoadAttempts(prev => prev + 1);
  };

  const handleReload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
      setIsLoading(true);
      setHasError(false);
    }
  };

  const handleOpenInBrowser = () => {
    if (documentUrl) {
      // You can use Linking.openURL or a browser package here
      Alert.alert(
        t('Open in Browser'),
        t('Would you like to open this document in your browser?'),
        [
          {text: t('Cancel'), style: 'cancel'},
          {
            text: t('Open'),
            onPress: () => {
              // Implement browser opening logic
              // Linking.openURL(documentUrl).catch(err =>
              //   Alert.alert(t('Error'), t('Cannot open URL'))
              // );
            },
          },
        ],
      );
    }
  };

  const webViewRef = React.useRef(null);

  const renderError = (errorDomain, errorCode, errorDesc) => {
    return (
      <View style={styles.errorContainer}>
        <Svgs.eye height={80} width={80} />
        <Text style={styles.errorText}>{t('Failed to load document')}</Text>
        <Text style={styles.errorSubText}>
          {errorDesc
            ? t(errorDesc)
            : t('Unable to load the document. Please try again.')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>{t('Retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.primaryBtn.BtnColor} />
      <Text style={[styles.errorSubText, {marginTop: hp(2)}]}>
        {t('Loading document...')}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={false}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Svgs.Cross height={20} width={20} fill={theme.primaryTextColor} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {documentName || t('Document Preview')}
          </Text>

          <View style={styles.controlsContainer}>
            {showRetry && (
              <TouchableOpacity
                onPress={handleReload}
                style={styles.reloadButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Svgs.reload
                  height={20}
                  width={20}
                  fill={theme.primaryTextColor}
                />
              </TouchableOpacity>
            )}
            {/* Uncomment if you want browser open option */}
            {/* <TouchableOpacity 
              onPress={handleOpenInBrowser} 
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Svgs.externalLink height={20} width={20} fill={theme.primaryTextColor} />
            </TouchableOpacity> */}
            <View style={{width: 20}} /> {/* Spacer for alignment */}
          </View>
        </View>

        {/* WebView Content */}
        <View style={styles.webViewContainer}>
          {canDisplay ? (
            <>
              <WebView
                ref={webViewRef}
                source={{uri: webViewUrl}}
                style={styles.webViewContainer}
                onError={handleError}
                onLoad={handleLoad}
                onLoadEnd={handleLoadEnd}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                scalesPageToFit={true}
                mixedContentMode="always"
                thirdPartyCookiesEnabled={true}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                allowFileAccessFromFileURLs={true}
                setSupportMultipleWindows={false}
                renderError={renderError}
                renderLoading={renderLoading}
                onHttpError={syntheticEvent => {
                  const {nativeEvent} = syntheticEvent;
                  console.log('HTTP error:', nativeEvent);
                  if (nativeEvent.statusCode >= 400) {
                    handleError(syntheticEvent);
                  }
                }}
                onContentProcessDidTerminate={() => {
                  console.log('WebView content process terminated');
                  handleRetry();
                }}
              />

              {isLoading && !hasError && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={theme.primaryBtn.BtnColor}
                  />
                  <Text style={[styles.errorSubText, {marginTop: hp(2)}]}>
                    {t('Loading document...')}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Svgs.noDoc height={80} width={80} />
              <Text style={styles.errorText}>
                {t('Cannot preview this document')}
              </Text>
              <Text style={styles.errorSubText}>
                {documentUrl
                  ? t(
                      'This document format cannot be displayed in the app. Please download it to view.',
                    )
                  : t('No document URL provided.')}
              </Text>
              {documentUrl && (
                <TouchableOpacity
                  style={[styles.retryButton, {marginTop: hp(3)}]}
                  onPress={handleOpenInBrowser}>
                  <Text style={styles.retryButtonText}>
                    {t('Open in Browser')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {hasError && !canDisplay && (
            <View style={styles.errorContainer}>
              <Svgs.eye height={80} width={80} />
              <Text style={styles.errorText}>
                {t('Failed to load document')}
              </Text>
              <Text style={styles.errorSubText}>
                {t(
                  'Unable to load the document preview. Please check your internet connection.',
                )}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}>
                <Text style={styles.retryButtonText}>{t('Retry')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default WebViewModal;
