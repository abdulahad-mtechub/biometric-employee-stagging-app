import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import React, {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {postValidateFace, uploadImage} from '../../Constants/api';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import FaceDetector, {FACE_STATUS} from '../../components/FaceDetection/FaceDetector';
import ImageQualityResultModal from '../../components/ImageQualityResultModal';
import {
  mapImageQualityApiToModalState,
  validateImageQuality,
} from '../../utils/imageQualityValidate';

const FaceScaning = ({route, onSuccess}) => {
  const [photoUri, setPhotoUri] = useState(null);
  const [isCheckingPhotoQuality, setIsCheckingPhotoQuality] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [qualityPayload, setQualityPayload] = useState(null);
  const [pendingQualityPath, setPendingQualityPath] = useState(null);
  const faceDetectorRef = useRef(null);
  const navigation = useNavigation();
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const {user} = useSelector(state => state?.auth);
  const token = user?.token;
  const onVerificationSuccess = route?.params?.onVerificationSuccess || onSuccess;

  const handleCapture = async capturedUri => {
    setPhotoUri(capturedUri);
    setIsCheckingPhotoQuality(true);
    try {
      const result = await validateImageQuality(capturedUri);
      const mapped = mapImageQualityApiToModalState(result, capturedUri, t);
      if (mapped.parseFailed) {
        Alert.alert(
          t('Error'),
          t('Could not verify photo quality. Please try again.'),
        );
        handleRetake();
        return;
      }
      setQualityPayload(mapped.qualityPayload);
      setPendingQualityPath(mapped.pendingPath);
      setQualityModalVisible(true);
    } catch (e) {
      Alert.alert(
        t('Error'),
        t('Could not verify photo quality. Please try again.'),
      );
      handleRetake();
    } finally {
      setIsCheckingPhotoQuality(false);
    }
  };

  const closeQualityModalAndRetake = () => {
    setQualityModalVisible(false);
    setQualityPayload(null);
    setPendingQualityPath(null);
    handleRetake();
  };

  const onQualityModalContinue = () => {
    if (!pendingQualityPath) return;
    const path = pendingQualityPath;
    setQualityModalVisible(false);
    setQualityPayload(null);
    setPendingQualityPath(null);
    handleDetectionSuccess(path);
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setIsCheckingPhotoQuality(false);
    setQualityModalVisible(false);
    setQualityPayload(null);
    setPendingQualityPath(null);
    if (faceDetectorRef.current) {
      faceDetectorRef.current.reset();
      setPhotoUri(null);
      setVerificationSuccess(false);
      setVerificationFailed(false);
      setIsVerifying(false);
    }
  };

  const handleDetectionSuccess = async imagePath => {
    if (isVerifying) return;

    setIsVerifying(true);

    try {
      const uploadPath = imagePath;
      const uploadName = `attendance_face_${Date.now()}.jpg`;

      const imagePayload = {
        path: uploadPath,
        mime: 'image/jpeg',
        name: uploadName,
      };
      const uploadResponse = await uploadImage(imagePayload, token);
      const responseValidateFace = await postValidateFace(
        {selfie: uploadResponse.data?.url},
        token,
      );

      const validationError = responseValidateFace?.error === true;
      const validFlag = responseValidateFace?.data?.valid === true;
      const validationMessage =
        responseValidateFace?.message ||
        responseValidateFace?.message_en ||
        responseValidateFace?.message_es ||
        responseValidateFace?.data?.message;

      const messageLower = (
        (validationMessage && String(validationMessage)) ||
        ''
      ).toLowerCase();

      const isFaceInvalid =
        validationError ||
        validFlag === false ||
        messageLower.includes('failed') ||
        messageLower.includes('invalid') ||
        messageLower.includes('not found');

      const imageUrl = uploadResponse?.data?.url;
      if (imageUrl) {
        await AsyncStorage.setItem('uploadedImageUrl', imageUrl);
        await AsyncStorage.setItem('FaceImageUrl', imageUrl);
      }

      if (isFaceInvalid) {
        setVerificationFailed(true);
        setVerificationSuccess(false);
      } else if (validFlag === true && uploadResponse?.error === false) {
        setVerificationSuccess(true);
        setVerificationFailed(false);
      } else {
        Alert.alert(t('Error'), t('Upload failed. Please try again.'));
        handleRetake();
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      Alert.alert(t('Error'), t('Something went wrong. Please try again.'));
      handleRetake();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinue = async () => {
    const imageUrl = await AsyncStorage.getItem('uploadedImageUrl');
    if (onVerificationSuccess) {
      onVerificationSuccess(imageUrl);
      return;
    }

    navigation.navigate(SCREENS.FACEIDVERIFIED, {photoUri: imageUrl});
  };

  const renderCustomStatus = ({faceStatus, getStatusMessage, photoUri}) => {
    if (photoUri) return null;

    let statusColor = '#FFA726';
    let statusText = getStatusMessage();

    if (faceStatus === FACE_STATUS.READY) {
      statusColor = '#4ECDC4';
    } else if (faceStatus === FACE_STATUS.NO_FACE) {
      statusColor = '#FF6B6B';
    }

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
          <Icon
            name={faceStatus === FACE_STATUS.READY ? 'check-circle' : 'info'}
            size={14}
            color="#FFF"
          />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>
    );
  };

  const renderCustomButtons = ({
    photoUri,
    isProcessing: isCapturing,
    isCaptureEnabled,
    takeSelfie,
  }) => {
    if (photoUri) {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.retakeButton, {flex: 1, marginRight: wp(2)}]}
            onPress={handleRetake}
            disabled={isVerifying}>
            <Text style={styles.retakeButtonText}>{t('Retake')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.captureButtonContainer}>
        <TouchableOpacity
          style={[
            styles.captureButton,
            isCaptureEnabled && styles.captureButtonReady,
          ]}
          onPress={takeSelfie}
          disabled={!isCaptureEnabled || isCapturing}>
          {isCapturing ? (
            <ActivityIndicator size="small" color="#4ECDC4" />
          ) : (
            <Icon
              name="camera-alt"
              size={24}
              color={isCaptureEnabled ? '#FFF' : '#666'}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.captureButtonLabel}>
          {isCaptureEnabled
            ? t('Tap to Capture')
            : t('Position face to enable')}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={30}
          color={
            isDarkMode
              ? Colors.darkTheme.primaryTextColor
              : Colors.lightTheme.primaryTextColor
          }
        />
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <View style={styles.headerIconContainer}>
          <Icon name="face" size={40} color={Colors.lightTheme.primaryColor} />
        </View>
        <Text style={styles.headerTitle}>{t('Face Verification')}</Text>
      </View>

      <View style={styles.faceDetectorContainer}>
        <FaceDetector
          ref={faceDetectorRef}
          skipPostCaptureQualityModal
          manualCaptureOnly
          cameraSize={wp('85%')}
          borderColor={verificationFailed ? '#FF0000' : '#FF6B6B'}
          readyBorderColor={verificationFailed ? '#FF0000' : '#4ECDC4'}
          showInstructions={false}
          showStatusBadge={true}
          showCaptureButton={true}
          captureButtonText={t('Capture')}
          onCapture={handleCapture}
          onReset={handleRetake}
          faceAreaConfig={{
            min: 0.08,
            max: 0.35,
          }}
          renderCustomStatus={renderCustomStatus}
          renderCustomButtons={renderCustomButtons}
        />
      </View>

      {verificationSuccess || verificationFailed ? (
        <>
          {verificationFailed && (
            <View style={styles.invalidLocationBanner}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color="#FF6B6B"
              />
              <Text style={styles.invalidLocationText}>
                {t(
                  'Your face does not match the registered face scan; therefore, this punch will be considered an invalid punch.',
                )}
              </Text>
            </View>
          )}
          {verificationSuccess && (
            <View
              style={[
                styles.invalidLocationBanner,
                {backgroundColor: '#E8F5E9', borderColor: '#4CAF50'},
              ]}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#4CAF50"
              />
              <Text style={[styles.invalidLocationText, {color: '#2E7D32'}]}>
                {t('Face verified successfully!')}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.continueButton,
              verificationFailed && {backgroundColor: '#FF6B6B'},
            ]}
            onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {verificationFailed ? t('Continue Anyway') : t('Continue')}
            </Text>
            <Icon name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.instructionsContainer}>
          <>
            <Text style={styles.instructionText}>
              • {t('Keep your face centered in the circle')}
            </Text>
            <Text style={styles.instructionText}>
              • {t('Make sure your face is well lit')}
            </Text>
            <Text style={styles.instructionText}>
              • {t('Look directly at the camera')}
            </Text>
            <Text style={styles.instructionText}>
              • {t('Stay still during capture')}
            </Text>
          </>
        </View>
      )}

      <Modal
        visible={isCheckingPhotoQuality || isVerifying}
        transparent
        animationType="fade">
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: isDarkMode ? '#1e1e1e' : 'white'},
            ]}>
            <ActivityIndicator size="large" color="#006EC2" />
            <Text style={styles.modalText}>
              {isCheckingPhotoQuality
                ? t('faceDetector.checkingQuality')
                : t('Verifying your registration...')}
            </Text>
          </View>
        </View>
      </Modal>

      <ImageQualityResultModal
        visible={qualityModalVisible}
        isDarkMode={isDarkMode}
        qualityPayload={qualityPayload}
        pendingPath={pendingQualityPath}
        onRetake={closeQualityModalAndRetake}
        onContinue={onQualityModalContinue}
      />
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    backButton: {
      paddingTop: wp(2),
      paddingHorizontal: wp(3),
    },
    headerContainer: {
      alignItems: 'center',
      paddingHorizontal: wp(5),
    },
    headerIconContainer: {
      borderRadius: 30,
      backgroundColor: Colors.lightTheme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: hp(1.5),
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors.lightTheme.primaryColor,
      marginBottom: hp(0.5),
    },
    headerSubtitle: {
      fontSize: 13,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
    faceDetectorContainer: {
      alignItems: 'center',
      marginVertical: hp(2),
    },
    instructionsContainer: {
      alignItems: 'flex-start',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      borderRadius: 12,
      marginHorizontal: wp(5),
      padding: wp(3),
      paddingHorizontal: wp(3),
    },
    instructionText: {
      fontSize: 12,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0.5),
    },
    invalidLocationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF6B6B20',
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginHorizontal: wp(8),
      borderRadius: 8,
      marginTop: 10,
    },
    invalidLocationText: {
      color: '#FF6B6B',
      fontSize: 13,
      flex: 1,
      marginLeft: 8,
    },
    continueButton: {
      backgroundColor: '#4ECDC4',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(1.8),
      paddingHorizontal: wp(6),
      borderRadius: 10,
      marginHorizontal: wp(8),
      gap: wp(2),
      marginTop: hp(2),
    },
    continueButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    statusContainer: {
      paddingHorizontal: wp(5),
      alignItems: 'center',
      marginTop: hp(1),
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      color: '#FFF',
      fontSize: 11,
      marginLeft: 4,
      fontWeight: '500',
    },
    captureButtonContainer: {
      alignItems: 'center',
      marginTop: hp(2),
    },
    captureButton: {
      width: 65,
      height: 65,
      borderRadius: 32.5,
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
      borderWidth: 3,
      borderColor: '#e0e0e0',
    },
    captureButtonReady: {
      backgroundColor: '#4ECDC4',
      borderColor: '#4ECDC4',
    },
    captureButtonLabel: {
      marginTop: hp(0.5),
      fontSize: 11,
      fontWeight: '500',
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '80%',
      marginTop: hp(2),
    },
    retakeButton: {
      backgroundColor: '#E9ECEF',
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(4),
      borderRadius: 8,
      alignItems: 'center',
    },
    retakeButtonText: {
      color: '#333',
      fontSize: 14,
      fontWeight: '600',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 20,
      alignItems: 'center',
    },
    successModal: {
      borderTopWidth: 5,
      borderTopColor: '#4ECDC4',
    },
    successIcon: {
      marginBottom: hp(1),
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: hp(0.5),
      color: isDarkMode ? '#fff' : '#333',
    },
    modalText: {
      fontSize: 13,
      textAlign: 'center',
      marginBottom: hp(2),
      color: isDarkMode ? '#ccc' : '#555',
    },
    modalButton: {
      backgroundColor: '#006EC2',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
      minWidth: 150,
    },
    modalButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

export default FaceScaning;
