import AsyncStorage from '@react-native-async-storage/async-storage';
import FaceDetection from '@react-native-ml-kit/face-detection';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useDispatch, useSelector } from 'react-redux';
import { Images } from '../../assets/Images/Images';
import { Svgs } from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import { faceScanVerification, uploadImage } from '../../Constants/api';
import { Fonts } from '../../Constants/Fonts';
import { SCREENS } from '../../Constants/Screens';
import { Colors } from '../../Constants/themeColors';
import ImageQualityResultModal from '../../components/ImageQualityResultModal';
import { useAlert } from '../../Providers/AlertContext';
import {
  mapImageQualityApiToModalState,
  validateImageQuality,
} from '../../utils/imageQualityValidate';
import { setLoggedIn, setUserData } from '../../redux/Slices/authSlice';
const FaceScanLogin = ({ route }) => {
  const { data } = route?.params || {};
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [showVerificationFailedModal, setShowVerificationFailedModal] =
    useState(false);
  const [showEmailPasswordModal, setShowEmailPasswordModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccessful, setVerificationSuccessful] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [faceInView, setFaceInView] = useState(false);
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [qualityPayload, setQualityPayload] = useState(null);
  const [pendingQualityPath, setPendingQualityPath] = useState(null);
  const { isDarkMode } = useSelector(store => store.theme);
  const cameraRef = useRef(null);
  const navigation = useNavigation();
  const device = useCameraDevice('front');
  const [SignupData, setSignupData] = useState(null);
  const dispatch = useDispatch();
  const token = SignupData?.profileUpdateToken;
  const styles = dynamicStyles(isDarkMode);
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const timeoutRefs = useRef([]);

  useEffect(() => {
    (async () => {
      try {
        setIsCheckingPermission(true);
        const cameraPermission = await Camera.requestCameraPermission();
        const isCameraAuthorized =
          cameraPermission === 'authorized' ||
          cameraPermission === 'granted' ||
          cameraPermission === 'limited';

        setHasPermission(isCameraAuthorized);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      } finally {
        setIsCheckingPermission(false);
      }
    })();
  }, []);

  useEffect(() => {
    const getOnboardingUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('SinupUserData');
        if (jsonValue != null) {
          const userData = JSON.parse(jsonValue);
          setSignupData(userData);
        }
      } catch (e) {
        console.log('Error reading onboarding user data', e);
      }
    };

    getOnboardingUserData();
  }, []);

  useEffect(() => {
    // Cleanup function to reset all states when component unmounts
    return () => {
      setAttemptCount(0);
      setFaceDetected(false);
      setPhotoUri(null);
      setIsProcessing(false);
      setIsVerifying(false);
      setIsScanning(false);
      setFaceInView(false);
      setShowRetryModal(false);
      setShowVerificationFailedModal(false);
      setShowEmailPasswordModal(false);
      setShowSuccessModal(false);

      // Clear all timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  const capturePhoto = async () => {
    return await cameraRef.current.takePhoto({
      flash: 'off',
      qualityPrioritization: 'quality',
      enableShutterSound: false,
    });
  };

  const processImagePath = path => {
    if (Platform.OS === 'android' && !path.startsWith('file://')) {
      return `file://${path}`;
    }
    return path;
  };

  const handleCapturePress = async () => {
    if (!cameraRef.current || isProcessing || isVerifying) return;

    setIsProcessing(true);
    setFaceInView(false);
    setIsScanning(false);

    try {
      const photo = await capturePhoto();
      const processedImagePath = processImagePath(photo.path);

      const faces = await FaceDetection.detect(processedImagePath);

      if (faces.length > 0) {
        await handleDetectionSuccess(processedImagePath);
      } else {
        handleFaceDetectionFailure('No face detected');
      }
    } catch (err) {
      console.error('Failed to capture or detect:', err);
      handleFaceDetectionFailure('Capture error');
    } finally {
      setIsProcessing(false);
    }
  };

  const runLoginUploadVerify = async imagePath => {
    setIsVerifying(true);
    try {
      const uploadResponse = await uploadImage({
        path: imagePath,
        token: token,
      });

      if (uploadResponse.error === false) {
        const imageUrlNew = uploadResponse.data?.url;
        const deviceId = await DeviceInfo.getUniqueId();
        const data = {
          deviceId: deviceId,
          newImageUrl: imageUrlNew,
        };

        const verificationResponse = await faceScanVerification(data, token);

        if (verificationResponse?.error === false) {
          const { token: authToken, user } = verificationResponse.data;
          showAlert(t('Verification successful, logining...'), 'success');
          const userData = {
            ...user,
            token: authToken,
            device_id: deviceId,
          };

          dispatch(setUserData(userData));
          dispatch(setLoggedIn(true));

          await AsyncStorage.setItem('localuserData', JSON.stringify(userData));
          await AsyncStorage.setItem('authToken', authToken);
          await AsyncStorage.setItem('isLoggedIn', 'true');

          setVerificationSuccessful(true);

          const successTimeout = setTimeout(() => {
            if (verificationSuccessful) {
              setShowSuccessModal(true);
            }
          }, 2000);

          timeoutRefs.current.push(successTimeout);
        } else {
          handleVerificationFailure();
        }
      } else {
        handleVerificationFailure();
      }
    } catch (error) {
      console.error('Verification error:', error);
      handleVerificationFailure();
    } finally {
      setIsVerifying(false);
    }
  };

  const closeQualityModalAndRetake_Login = () => {
    setQualityModalVisible(false);
    setQualityPayload(null);
    setPendingQualityPath(null);
    setPhotoUri(null);
    setFaceDetected(false);
  };

  const onQualityModalContinue_Login = () => {
    if (!pendingQualityPath) return;
    const path = pendingQualityPath;
    setQualityModalVisible(false);
    setQualityPayload(null);
    setPendingQualityPath(null);
    runLoginUploadVerify(path);
  };

  const handleDetectionSuccess = async imagePath => {
    if (isVerifying) return;

    setFaceDetected(true);
    setPhotoUri(imagePath);
    setIsVerifying(true);

    try {
      const qResult = await validateImageQuality(imagePath);
      const mapped = mapImageQualityApiToModalState(qResult, imagePath, t);
      setIsVerifying(false);

      if (mapped.parseFailed) {
        Alert.alert(
          t('Error'),
          t('Could not verify photo quality. Please try again.'),
        );
        setPhotoUri(null);
        setFaceDetected(false);
        return;
      }

      setQualityPayload(mapped.qualityPayload);
      setPendingQualityPath(mapped.pendingPath);
      setQualityModalVisible(true);
    } catch (error) {
      console.error('Image quality error:', error);
      setIsVerifying(false);
      handleVerificationFailure();
    }
  };

  const handleVerificationFailure = () => {
    setPhotoUri(null);
    setFaceDetected(false);
    setVerificationSuccessful(false);
    setFaceInView(false);
    setIsScanning(false);

    const failureTimeout = setTimeout(() => {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      if (newAttemptCount >= 3) {
        setShowEmailPasswordModal(true);
      } else {
        setShowVerificationFailedModal(true);
      }
    }, 2000);

    timeoutRefs.current.push(failureTimeout);
  };

  const handleFaceDetectionFailure = errorMessage => {
    setFaceDetected(false);
    setVerificationSuccessful(false);
    setFaceInView(false);
    setIsScanning(false);
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    if (newAttemptCount >= 3) {
      setShowEmailPasswordModal(true);
    } else {
      setShowRetryModal(true);
    }
  };

  const handleRetry = () => {
    setShowRetryModal(false);
    setShowVerificationFailedModal(false);
    setQualityModalVisible(false);
    setQualityPayload(null);
    setPendingQualityPath(null);
    setPhotoUri(null);
    setFaceDetected(false);
    setIsVerifying(false);
    setVerificationSuccessful(false);
    setFaceInView(false);
    setIsScanning(false);
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    setIsVerifying(false);

    // Clear all timeouts before navigation
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];

    navigation.reset({
      index: 0,
      routes: [{ name: SCREENS.DASHBOARD }],
    });
  };

  const handleEmailPasswordLogin = () => {
    setShowEmailPasswordModal(false);
    setAttemptCount(0);
    setFaceDetected(false);
    setPhotoUri(null);
    setIsProcessing(false);
    setIsVerifying(false);
    setVerificationSuccessful(false);
    setFaceInView(false);
    setIsScanning(false);

    // Clear all timeouts before navigation
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];

    navigation.reset({
      index: 0,
      routes: [{ name: SCREENS.LOGIN }],
    });
  };

  const isAnyModalVisible = () => {
    return (
      showSuccessModal ||
      showRetryModal ||
      showVerificationFailedModal ||
      showEmailPasswordModal
    );
  };

  if (isCheckingPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={isDarkMode ? '#fff' : '#006EC2'}
        />
        <Text style={styles.text}>Checking permissions...</Text>
      </View>
    );
  }

  if (showIntro) {
    return (
      <View style={styles.inputsContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>{t('Face Scan')}</Text>
            <Text style={styles.subheading}>
              {t(
                'Take a clear biometric selfie to verify your identity securely.',
              )}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', marginTop: hp(7) }}>
            <Image
              source={Images.faceScan}
              style={{ height: hp(40), width: hp(40), resizeMode: 'contain' }}
            />
          </View>
          <CustomButton
            text={t('Scan')}
            onPress={() => {
              setShowIntro(false);
            }}
            textStyle={[styles.continueButtonText]}
            containerStyle={[styles.continueButton]}
          />
        </View>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Camera permission is required for face verification
        </Text>
        <Button
          title="Grant Camera Permission"
          onPress={async () => {
            try {
              const cameraPermission = await Camera.requestCameraPermission();
              const isCameraAuthorized =
                cameraPermission === 'authorized' ||
                cameraPermission === 'granted' ||
                cameraPermission === 'limited';
              setHasPermission(isCameraAuthorized);
            } catch (error) {
              console.error('Error requesting permissions:', error);
            }
          }}
        />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Front camera not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Text */}
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>{t('Face Login')}</Text>
        <Text style={styles.subheading}>
          {t('Position your face in the circle and tap the shutter button')}
        </Text>
      </View>

      <View style={styles.circularCameraContainer}>
        {photoUri && verificationSuccessful ? (
          <>
            <Image source={{ uri: photoUri }} style={styles.circularImage} />
          </>
        ) : (
          <Camera
            ref={cameraRef}
            style={styles.circularImage}
            device={device}
            isActive={true}
            photo={true}
            audio={false}
          />
        )}
      </View>

      {/* Instructions */}
      {(!photoUri || !verificationSuccessful) && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>{t('Instructions')}:</Text>
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
        </View>
      )}

      {/* Status Text */}
      {(!photoUri || !verificationSuccessful) && (
        <View style={styles.statusContainer}>
          {isProcessing ? (
            <Text style={styles.statusText}>
              {t('Processing your image')}...
            </Text>
          ) : isVerifying ? (
            <Text style={styles.statusText}>
              {t('Verifying your identity')}...
            </Text>
          ) : faceDetected ? (
            <Text style={[styles.statusText, styles.successText]}>
              {t('Face detected successfully')}!
            </Text>
          ) : (
            <Text style={styles.statusText}>
              {t('Position your face and tap the shutter button')}
            </Text>
          )}
        </View>
      )}

      {/* Shutter Button */}
      {(!photoUri || !verificationSuccessful) &&
        !isProcessing &&
        !isVerifying &&
        !qualityModalVisible && (
          <TouchableOpacity
            style={[
              styles.shutterButton,
              (isProcessing || isVerifying || qualityModalVisible) &&
                styles.shutterButtonDisabled,
            ]}
            onPress={handleCapturePress}
            disabled={
              isProcessing || isVerifying || qualityModalVisible
            }>
            <Svgs.faceScan />
          </TouchableOpacity>
        )}

      {photoUri && verificationSuccessful && (
        <View style={styles.verificationContainer}>
          <Svgs.checkedCircled
            width={30}
            height={30}
            style={{
              marginTop: -50,
              backgroundColor: isDarkMode
                ? Colors.darkTheme.backgroundColor
                : Colors.lightTheme.backgroundColor,
              borderRadius: wp(100),
            }}
          />
          <Text style={styles.heading}>{t('Verification Complete!')}</Text>
          <Text style={styles.subheading}>
            {t('Your face has been successfully verified. You can now log in.')}
          </Text>
          {!showSuccessModal && (
            <CustomButton
              text={t('Continue')}
              onPress={handleSuccessContinue}
              textStyle={styles.continueButtonText}
              containerStyle={styles.continueButton}
            />
          )}
        </View>
      )}

      <ImageQualityResultModal
        visible={qualityModalVisible}
        isDarkMode={isDarkMode}
        qualityPayload={qualityPayload}
        pendingPath={pendingQualityPath}
        onRetake={closeQualityModalAndRetake_Login}
        onContinue={onQualityModalContinue_Login}
      />

      {/* Processing Modal */}
      <Modal visible={isProcessing} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#006EC2" />
            <Text style={styles.modalText}>
              {t('Processing your image...')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Retry Modal */}
      <Modal visible={showRetryModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.retryModal]}>
            <Icon
              name="error-outline"
              size={30}
              color="red"
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>{t('Face Not Detected')}</Text>
            <Text style={styles.modalText}>
              {t("We couldn't detect a face. Please try again.")}
              <Text style={{ fontWeight: 'bold' }}>
                ({t('Attempt')} {Math.min(attemptCount, 3)} /3)
              </Text>
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleRetry}>
              <Text style={styles.modalButtonText}>{t('Try Again')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVerificationFailedModal}
        transparent={true}
        animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.retryModal]}>
            <Icon name="error-outline" size={30} color="red" />
            <Text style={styles.modalTitle}>{t('Verification Failed')}</Text>
            <Text style={styles.modalText}>
              {t('Verification failed. Please try again.')}
              <Text style={{ fontWeight: 'bold' }}>
                ({t('Attempt')} {Math.min(attemptCount, 3)} /3)
              </Text>
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleRetry}>
              <Text style={styles.modalButtonText}>{t('Try Again')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEmailPasswordModal}
        transparent={true}
        animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.otpModal]}>
            <Icon name="login" size={30} color="white" />
            <Text style={styles.modalTitle}>{t('Verification Required')}</Text>
            <Text style={styles.modalText}>
              {t(
                "We couldn't verify your identity after 3 attempts. Please log in using your email and password.",
              )}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleEmailPasswordLogin}>
              <Text style={styles.modalButtonText}>
                {t('Log In with Email')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: isDarkMode ? '#fff' : '#333',
      fontSize: 16,
      marginTop: 12,
      marginBottom: 20,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    inputsContainer: {
      paddingVertical: 40,
      flex: 1,
      paddingBottom: hp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    contentContainer: {
      flex: 1,
    },
    headerContainer: {
      paddingBottom: 4,
      paddingHorizontal: wp(5),
      alignItems: 'center',
    },
    heading: {
      fontSize: RFPercentage(3),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
    },
    subheading: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      width: wp(80),
      fontWeight: '600',
      marginTop: hp(1),
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(5),
      minWidth: wp(80),
      marginTop: hp(10),
    },
    continueButtonText: {
      fontSize: RFPercentage(1.9),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    circularCameraContainer: {
      width: hp(45),
      height: hp(45),
      borderRadius: hp(45) / 2,
      borderWidth: 4,
      borderColor: '#06D188',
      overflow: 'hidden',
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: hp(3),
    },
    circularImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    instructionsContainer: {
      marginTop: hp(2),
      paddingHorizontal: wp(8),
      alignItems: 'flex-start',
      width: '100%',
    },
    instructionTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    instructionText: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
      lineHeight: 20,
      fontFamily: Fonts.NunitoRegular,
    },
    statusContainer: {
      marginTop: hp(2),
      paddingHorizontal: wp(5),
      alignItems: 'center',
    },
    statusText: {
      fontSize: RFPercentage(2),
      textAlign: 'center',
      fontWeight: '500',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
    },
    successText: {
      color: '#06D188',
    },
    verificationContainer: {
      paddingBottom: 4,
      paddingHorizontal: wp(5),
      alignItems: 'center',
      marginTop: hp(2),
    },
    shutterButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: hp(1),
      shadowColor: '#000',
      borderColor: '#FFF',
      borderWidth: 8,
      backgroundColor: '#DCDCDC',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    shutterButtonDisabled: {
      opacity: 0.5,
    },
    shutterInnerCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#006EC2',
      borderWidth: 3,
      borderColor: '#fff',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: isDarkMode ? '#1e1e1e' : 'white',
      borderRadius: 15,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    retryModal: {
      borderTopWidth: 5,
      borderTopColor: '#FF9800',
    },
    otpModal: {
      borderTopWidth: 5,
      borderTopColor: '#F44336',
    },
    modalIcon: {
      marginBottom: 15,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
      color: isDarkMode ? '#fff' : '#333',
    },
    modalText: {
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
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
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

export default FaceScanLogin;
