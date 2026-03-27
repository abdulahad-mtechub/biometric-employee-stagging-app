import {useState, useRef} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImageResizer from 'react-native-image-resizer';
import {Colors} from '../../Constants/themeColors';
import {UpdateFace, uploadImage} from '../../Constants/api';
import FaceDetector from '../../components/FaceDetection/FaceDetector';
import ImageQualityResultModal from '../../components/ImageQualityResultModal';
import {
  mapImageQualityApiToModalState,
  validateImageQuality,
} from '../../utils/imageQualityValidate';

const FaceIdOption = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {isDarkMode} = useSelector(store => store.theme);
  const token = useSelector(state => state?.auth?.user?.token);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [qualityPayload, setQualityPayload] = useState(null);
  const [pendingQualityPath, setPendingQualityPath] = useState(null);
  const faceDetectorRef = useRef(null);

  // Handle capture from FaceDetector component
  const handleCapture = capturedUri => {
    setPhotoUri(capturedUri);
  };

  // Handle removal of captured image
  const handleRemoveImage = () => {
    setPhotoUri(null);
    if (faceDetectorRef.current) {
      faceDetectorRef.current.reset();
    }
  };

  const runUploadAndUpdateFace = async compressedPath => {
    setIsVerifying(true);
    try {
      console.log('📤 Uploading image path:', compressedPath);
      const upload = await uploadImage({path: compressedPath});
      if (upload.error) {
        Alert.alert(t('Error'), t('Upload failed. Please retry.'));
        return;
      }

      const url = upload.data?.url;
      if (!url) {
        Alert.alert(t('Error'), t('Invalid server response.'));
        return;
      }

      await UpdateFace({face_image_url: url}, token);
      setShowSuccessModal(true);
    } catch (error) {
      if (__DEV__) console.log('Continue error:', error);
      Alert.alert(t('Error'), t('Something went wrong. Please retake.'));
    } finally {
      setIsVerifying(false);
    }
  };

  const closeQualityModalAndRetake_FaceId = () => {
    setQualityModalVisible(false);
    setQualityPayload(null);
    setPendingQualityPath(null);
    handleRemoveImage();
  };

  const onQualityModalContinue_FaceId = () => {
    if (!pendingQualityPath) return;
    const path = pendingQualityPath;
    setQualityModalVisible(false);
    setQualityPayload(null);
    setPendingQualityPath(null);
    runUploadAndUpdateFace(path);
  };

  // Handle continue after capture — image-quality API then upload + UpdateFace
  const handleContinue = async () => {
    if (!photoUri || isVerifying) return;

    setIsVerifying(true);

    try {
      console.log('📸 Original image path:', photoUri);
      let compressedPath = photoUri;
      try {
        const compressed = await ImageResizer.createResizedImage(
          photoUri,
          800,
          800,
          'JPEG',
          50,
          0,
        );
        compressedPath = compressed.uri;
        console.log('✅ Compressed image path:', compressedPath);
        console.log(
          '📐 Compressed size:',
          compressed.width,
          'x',
          compressed.height,
        );
      } catch (resizeError) {
        console.log('Image resize failed, using original:', resizeError);
      }

      const result = await validateImageQuality(compressedPath);
      const mapped = mapImageQualityApiToModalState(result, compressedPath, t);
      setIsVerifying(false);

      if (mapped.parseFailed) {
        Alert.alert(
          t('Error'),
          t('Could not verify photo quality. Please try again.'),
        );
        return;
      }

      setQualityPayload(mapped.qualityPayload);
      setPendingQualityPath(mapped.pendingPath);
      setQualityModalVisible(true);
    } catch (error) {
      setIsVerifying(false);
      if (__DEV__) console.log('Continue error:', error);
      Alert.alert(t('Error'), t('Something went wrong. Please retake.'));
    }
  };

  const handleSuccess = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleBack = () => navigation.goBack();

  // Custom render for buttons when photo is captured
  const renderCustomButtons = ({photoUri, isProcessing}) => {
    if (!photoUri) return null;

    return (
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, {flex: 1, marginRight: wp(2)}]}
          onPress={handleRemoveImage}
          disabled={isVerifying || isProcessing}>
          <Text style={styles.secondaryButtonText}>{t('Retake')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, {flex: 1, marginLeft: wp(2)}]}
          onPress={handleContinue}
          disabled={isVerifying || isProcessing}>
          {isVerifying || isProcessing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('Continue')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon
            name="keyboard-arrow-left"
            size={30}
            color={
              isDarkMode
                ? Colors.darkTheme.primaryTextColor
                : Colors.lightTheme.primaryTextColor
            }
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Face ID Setup')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}></Text>

          <FaceDetector
            ref={faceDetectorRef}
            skipPostCaptureQualityModal
            manualCaptureOnly
            containerStyle={styles.faceDetectorContainer}
            cameraSize={wp('98%')}
            borderColor="#FF6B6B"
            readyBorderColor="#4ECDC4"
            showInstructions={false}
            showStatusBadge={true}
            showCaptureButton={true}
            captureButtonText={t('Capture')}
            onCapture={handleCapture}
            onReset={handleRemoveImage}
            faceAreaConfig={{
              min: 0.08,
              max: 0.35,
            }}
            renderCustomButtons={renderCustomButtons}
          />

          {/* Additional Requirements Card */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>
              {t('Photo Requirements')}
            </Text>
            <View style={styles.requirementItem}>
              <Icon name="check-circle" size={16} color="#4ECDC4" />
              <Text style={styles.requirementText}>
                {t('Good lighting conditions')}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon name="check-circle" size={16} color="#4ECDC4" />
              <Text style={styles.requirementText}>
                {t('Face the camera directly')}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon name="check-circle" size={16} color="#4ECDC4" />
              <Text style={styles.requirementText}>
                {t('No sunglasses or hats')}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Icon name="check-circle" size={16} color="#4ECDC4" />
              <Text style={styles.requirementText}>
                {t('Recent photo recommended')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ImageQualityResultModal
        visible={qualityModalVisible}
        isDarkMode={isDarkMode}
        qualityPayload={qualityPayload}
        pendingPath={pendingQualityPath}
        onRetake={closeQualityModalAndRetake_FaceId}
        onContinue={onQualityModalContinue_FaceId}
      />

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={80} color="#4ECDC4" />
            </View>
            <Text style={styles.modalTitle}>{t('Success')}</Text>
            <Text style={styles.modalText}>
              {t('Face ID has been successfully setup')}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccess}>
              <Text style={styles.modalButtonText}>{t('Continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ---------- DYNAMIC STYLES ----------
const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
      paddingBottom: hp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.QuaternaryText
        : Colors.lightTheme.QuaternaryText,
    },
    backButton: {
      padding: wp(1),
    },
    headerTitle: {
      fontSize: wp(5),
      fontWeight: '700',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    headerPlaceholder: {
      width: wp(10),
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: hp(4),
    },
    previewSection: {
      alignItems: 'center',
      marginBottom: hp(2),
    },
    sectionTitle: {
      fontSize: wp(1),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
      textAlign: 'center',
    },
    faceDetectorContainer: {
      width: '100%',
      marginBottom: hp(2),
    },
    requirementsCard: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      padding: wp(4),
      borderRadius: 12,
      marginTop: hp(2),
      marginHorizontal: wp(4),
      width: wp(92),
    },
    requirementsTitle: {
      fontSize: wp(3.2),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1.5),
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(0.4),
    },
    requirementText: {
      fontSize: wp(2.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(2),
      flex: 1,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '80%',
      marginTop: hp(2),
      marginBottom: hp(2),
    },
    primaryButton: {
      backgroundColor: '#006EC2',
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(4),
      borderRadius: 8,
      flex: 1,
      marginLeft: wp(2),
      alignItems: 'center',
    },
    secondaryButton: {
      backgroundColor: '#E9ECEF',
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(4),
      borderRadius: 8,
      flex: 1,
      marginRight: wp(2),
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#FFF',
      fontSize: wp(4),
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: '#333',
      fontSize: wp(4),
      fontWeight: '600',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: wp(4),
    },
    successModal: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 20,
      padding: wp(6),
      alignItems: 'center',
      width: '100%',
      maxWidth: wp(80),
    },
    successIcon: {
      marginBottom: hp(2),
    },
    modalTitle: {
      fontSize: wp(4.5),
      fontWeight: '700',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
      textAlign: 'center',
    },
    modalText: {
      fontSize: wp(3.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      lineHeight: hp(2.5),
      marginBottom: hp(2),
    },
    modalButton: {
      backgroundColor: '#006EC2',
      paddingHorizontal: wp(6),
      paddingVertical: hp(1.5),
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#FFF',
      fontSize: wp(4),
      fontWeight: '600',
    },
  });

export default FaceIdOption;
