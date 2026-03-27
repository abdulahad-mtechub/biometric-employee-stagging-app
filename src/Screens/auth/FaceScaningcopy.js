import AsyncStorage from '@react-native-async-storage/async-storage';
import FaceDetection from '@react-native-ml-kit/face-detection';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useSelector} from 'react-redux';
import {
  detectFace,
  faceScanRegisteration,
  uploadImage,
} from '../../Constants/api';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';

const FaceScaning = () => {
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccessful, setVerificationSuccessful] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [isFaceValid, setIsFaceValid] = useState(false);
  const [faceQuality, setFaceQuality] = useState(null);
  const [multipleFacesDetected, setMultipleFacesDetected] = useState(false);
  const [shutterEnabled, setShutterEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false); // Prevent concurrent captures
  const [detectedFaces, setDetectedFaces] = useState([]); // Store detected face rectangles
  const failureTimeoutRef = useRef(null);
  const timeoutRefs = useRef([]);
  const cameraRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const device = useCameraDevice('front');
  const [SignupData, setSignupData] = useState(null);
  // Get token from SignupData or route params as fallback
  const token = SignupData?.profileUpdateToken || route.params?.token;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const scanningLineAnim = useRef(new Animated.Value(0)).current;
  const pulsingRingAnim = useRef(new Animated.Value(0)).current;
  const successPulseAnim = useRef(new Animated.Value(0)).current;
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  // Animated scanning line component
  const AnimatedScanningLine = ({isVisible}) => {
    useEffect(() => {
      if (isVisible) {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(scanningLineAnim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
            Animated.timing(scanningLineAnim, {
              toValue: 0,
              duration: 2000,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
          ]),
        );
        animation.start();
        return () => animation.stop();
      } else {
        scanningLineAnim.setValue(0);
      }
    }, [isVisible]);

    const translateY = scanningLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });

    if (!isVisible) return null;

    return (
      <Animated.View
        style={[
          styles.scanningLine,
          {
            transform: [{translateY: translateY}],
          },
        ]}
      />
    );
  };

  // Pulsing ring animation for optimal detection zone
  const PulsingRing = ({isVisible}) => {
    useEffect(() => {
      if (isVisible) {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulsingRingAnim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
            Animated.timing(pulsingRingAnim, {
              toValue: 0,
              duration: 2000,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
          ]),
        );
        animation.start();
        return () => animation.stop();
      } else {
        pulsingRingAnim.setValue(0);
      }
    }, [isVisible]);

    const scale = pulsingRingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    const opacity = pulsingRingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0],
    });

    if (!isVisible) return null;

    return (
      <>
        <Animated.View
          style={[
            styles.pulsingRing,
            {
              transform: [{scale: scale}],
              opacity: opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulsingRing,
            {
              transform: [{scale: scale}],
              opacity: opacity,
            },
          ]}
        />
      </>
    );
  };

  // Success pulse animation
  const SuccessPulse = ({isVisible}) => {
    useEffect(() => {
      if (isVisible) {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(successPulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
            Animated.timing(successPulseAnim, {
              toValue: 0,
              duration: 1000,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
          ]),
        );
        animation.start();
        return () => animation.stop();
      } else {
        successPulseAnim.setValue(0);
      }
    }, [isVisible]);

    const scale = successPulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    });

    const opacity = successPulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 0],
    });

    if (!isVisible) return null;

    return (
      <Animated.View
        style={[
          styles.successPulse,
          {
            transform: [{scale: scale}],
            opacity: opacity,
          },
        ]}
      />
    );
  };

  // Face overlay component to show detected faces
  const FaceOverlay = ({faces}) => {
    if (!faces || faces.length === 0) return null;

    return (
      <>
        {faces.map((face, index) => (
          <View
            key={index}
            style={[
              styles.faceOverlay,
              {
                left: face.left,
                top: face.top,
                width: face.width,
                height: face.height,
              },
            ]}>
            <View style={styles.faceOverlayCorner} />
            <View style={[styles.faceOverlayCorner, styles.topRight]} />
            <View style={[styles.faceOverlayCorner, styles.bottomLeft]} />
            <View style={[styles.faceOverlayCorner, styles.bottomRight]} />
          </View>
        ))}
      </>
    );
  };

  // Optimal detection zone indicator with pulse animation
  const OptimalZoneIndicator = ({isActive}) => {
    return (
      <View style={styles.optimalZoneContainer}>
        <View style={styles.optimalZoneCircle} />
        <PulsingRing isVisible={isActive && !isFaceValid} />
      </View>
    );
  };

  // State indicator based on current state
  const StateIndicator = () => {
    if (faceDetected && verificationSuccessful) {
      return <SuccessPulse isVisible={true} />;
    }
    if (isFaceValid && !photoUri) {
      return <AnimatedScanningLine isVisible={true} />;
    }
    return null;
  };

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: faceDetected ? 1 : 0,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [faceDetected]);

  // Check FaceDetection module availability
  useEffect(() => {
    console.log('🔍 FaceDetection module check:', {
      moduleExists: !!FaceDetection,
      hasDetectMethod: typeof FaceDetection.detect === 'function',
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isNavigatingBack) return true;
        setIsNavigatingBack(true);

        if (navigation.canGoBack()) {
          navigation.goBack();
        }
        setTimeout(() => setIsNavigatingBack(false), 5000);
        return true;
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => {
        subscription.remove();
      };
    }, [isNavigatingBack, navigation]),
  );

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
        console.log('📦 Loading profile data from AsyncStorage...');

        // Get the profile token, user ID, and complete user data
        const profileToken = await AsyncStorage.getItem('profile_token');
        const userIdJson = await AsyncStorage.getItem('profile_user_id');
        const userDataJson = await AsyncStorage.getItem('profile_user_data');

        if (profileToken) {
          let userId = userIdJson ? JSON.parse(userIdJson) : null;

          // Try to extract userId from complete user data if not found
          if (!userId && userDataJson) {
            const completeUserData = JSON.parse(userDataJson);
            console.log(
              '📋 Complete user data:',
              JSON.stringify(completeUserData, null, 2),
            );
            userId =
              completeUserData.user_id ||
              completeUserData.id ||
              completeUserData.userId;

            if (userId) {
              console.log(
                '✅ Extracted userId from complete user data:',
                userId,
              );
            }
          }

          console.log('✅ Profile token loaded successfully');
          console.log(
            '🔑 Token preview:',
            profileToken.substring(0, 30) + '...',
          );
          console.log('👤 User ID:', userId || 'Not found');

          // Store in SignupData format for compatibility
          setSignupData({
            profileUpdateToken: profileToken,
            userId: userId,
          });
        } else {
          console.log('⚠️ No profile token found in AsyncStorage');
          console.log('⚠️ Checking alternative storage keys...');

          // Fallback: Try the old key (typo version)
          const oldJsonValue = await AsyncStorage.getItem('SinupUserData');
          if (oldJsonValue != null) {
            const userData = JSON.parse(oldJsonValue);
            console.log('✅ Found data in old key (SinupUserData)');
            if (userData?.profileUpdateToken) {
              console.log(
                '🔑 Token preview:',
                userData.profileUpdateToken.substring(0, 30) + '...',
              );
            }
            setSignupData(userData);
          } else {
            console.log('❌ No token found in any storage location');
          }
        }
      } catch (e) {
        console.log('❌ Error reading profile token:', e);
      }
    };

    getOnboardingUserData();
  }, []);

  // Monitor token availability
  useEffect(() => {
    console.log('🔍 Token state changed:', {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'No token',
      signupDataExists: !!SignupData,
      routeParamsToken: !!route.params?.token,
    });
  }, [token, SignupData]);

  useEffect(() => {
    return () => {
      setAttemptCount(0);
      setFaceDetected(false);
      setPhotoUri(null);
      setIsProcessing(false);
      setIsVerifying(false);
      setShowRetryModal(false);
      setShowOtpModal(false);
      setShowSuccessModal(false);
      setVerificationComplete(false);
      setVerificationSuccessful(false);
      setFaceCount(0);
      setIsFaceValid(false);
      setFaceQuality(null);
      setMultipleFacesDetected(false);
      setShutterEnabled(false);
      setIsCapturing(false);
      setDetectedFaces([]); // Clear detected faces

      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];

      if (failureTimeoutRef.current) {
        clearTimeout(failureTimeoutRef.current);
      }
    };
  }, []);

  // Real-time face detection feedback
  useEffect(() => {
    let intervalId;
    let isMounted = true;

    const performRealtimeFaceDetection = async () => {
      if (
        !cameraRef.current ||
        isProcessing ||
        isVerifying ||
        photoUri ||
        verificationComplete ||
        isCapturing // Prevent concurrent captures
      ) {
        return;
      }

      try {
        setIsCapturing(true);
        // Take a temporary photo for face detection (not saved)
        const tempPhoto = await cameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'speed',
          enableShutterSound: false,
        });

        const processedPath = processImagePath(tempPhoto.path);
        console.log('🔍 Real-time detection - processing:', processedPath);

        const faces = await FaceDetection.detect(processedPath);
        console.log('📊 Real-time detection - faces found:', faces.length);

        if (!isMounted) return;

        // Reset states
        setMultipleFacesDetected(false);

        if (faces.length === 0) {
          console.log('⚠️ No face detected in real-time');
          setDetectedFaces([]); // Clear detected faces
          setFaceCount(0);
          setIsFaceValid(false);
          setShutterEnabled(false);
        } else if (faces.length > 1) {
          console.log('⚠️ Multiple faces detected:', faces.length);
          setDetectedFaces([]); // Clear detected faces for multiple faces
          setFaceCount(faces.length);
          setIsFaceValid(false);
          setMultipleFacesDetected(true);
          setShutterEnabled(false);
        } else {
          // Single face detected - validate quality with strict rules
          const face = faces[0];
          const bounds = face.frame || face.bounds; // Use frame for ML Kit, fallback to bounds
          const faceWidth = bounds.width;
          const faceHeight = bounds.height;
          const faceArea = faceWidth * faceHeight;

          console.log('✅ Single face detected:', {
            faceWidth,
            faceHeight,
            faceArea,
            bounds: bounds,
          });

          // Store detected face for overlay display
          setDetectedFaces([bounds]);

          // STRICT VALIDATION for real-time feedback
          // Check size first
          if (faceArea < 80000 || faceArea > 2000000) {
            setFaceCount(1);
            setIsFaceValid(false);
            setShutterEnabled(false);
            return;
          }

          // Check if face is properly centered
          // Use estimated dimensions based on common phone camera resolutions
          // In real-time mode, we don't have exact photo dimensions, so we estimate
          const estimatedWidth = 1080; // Common front camera width
          const estimatedHeight = 1920; // Common front camera height
          const faceCenterX = bounds.left + faceWidth / 2;
          const faceCenterY = bounds.top + faceHeight / 2;
          const faceCenterXPercent = (faceCenterX / estimatedWidth) * 100;
          const faceCenterYPercent = (faceCenterY / estimatedHeight) * 100;

          // Check if face is within acceptable center area (30% from center)
          const centerTolerance = 15;
          const isHorizontallyCentered =
            faceCenterXPercent >= 50 - centerTolerance &&
            faceCenterXPercent <= 50 + centerTolerance;
          const isVerticallyCentered =
            faceCenterYPercent >= 45 - centerTolerance &&
            faceCenterYPercent <= 55 + centerTolerance;

          // Check if face is too close to edges
          const faceLeftPercent = (bounds.left / estimatedWidth) * 100;
          const faceTopPercent = (bounds.top / estimatedHeight) * 100;
          const edgeMargin = 5;
          const isTooCloseToLeft = faceLeftPercent < edgeMargin;
          const isTooCloseToTop = faceTopPercent < edgeMargin;
          const isTooCloseToRight =
            faceLeftPercent + (faceWidth / estimatedWidth) * 100 >
            100 - edgeMargin;
          const isTooCloseToBottom =
            faceTopPercent + (faceHeight / estimatedHeight) * 100 >
            100 - edgeMargin;

          // Check aspect ratio
          const aspectRatio = faceWidth / faceHeight;
          const minAspectRatio = 0.6;
          const maxAspectRatio = 1.4;
          const hasValidAspectRatio =
            aspectRatio >= minAspectRatio && aspectRatio <= maxAspectRatio;

          // All validations must pass for face to be considered valid
          const isValid =
            isHorizontallyCentered &&
            isVerticallyCentered &&
            !isTooCloseToLeft &&
            !isTooCloseToTop &&
            !isTooCloseToRight &&
            !isTooCloseToBottom &&
            hasValidAspectRatio;

          if (isValid) {
            setFaceCount(1);
            setIsFaceValid(true);
            setFaceQuality('good');
            setShutterEnabled(true);
          } else {
            setFaceCount(1);
            setIsFaceValid(false);
            setShutterEnabled(false);
          }
        }
      } catch (error) {
        // Enhanced error logging
        console.error('❌ Real-time face detection error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          cameraRef: !!cameraRef.current,
        });
      } finally {
        setIsCapturing(false);
      }
    };

    // Run detection every 2 seconds when camera is active (reduced frequency)
    if (hasPermission && device && !photoUri && !verificationComplete) {
      intervalId = setInterval(performRealtimeFaceDetection, 2000);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    hasPermission,
    device,
    photoUri,
    isProcessing,
    isVerifying,
    verificationComplete,
    isCapturing,
  ]);

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

  const testFaceDetection = async () => {
    console.log('🧪 Starting face detection test...');
    try {
      if (!cameraRef.current) {
        console.error('❌ Camera ref not available');
        return;
      }

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'speed',
        enableShutterSound: false,
      });

      const processedPath = processImagePath(photo.path);
      console.log('📸 Test photo captured at:', processedPath);

      const faces = await FaceDetection.detect(processedPath);
      console.log('🎯 Detection complete!');
      console.log('📊 Number of faces detected:', faces.length);

      if (faces.length > 0) {
        console.log(
          '✅ Face detected! Details:',
          JSON.stringify(faces[0], null, 2),
        );
      } else {
        console.log('⚠️ No faces detected');
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
      console.error('❌ Stack trace:', error.stack);
    }
  };

  const handleShutterPress = async () => {
    if (
      !cameraRef.current ||
      isProcessing ||
      isVerifying ||
      verificationComplete
    )
      return;

    // Validate token before proceeding
    if (!token) {
      console.error('❌ No token available for face detection API');
      Alert.alert(
        'Error',
        'Authentication token not found. Please try signing up again.',
      );
      return;
    }

    setIsProcessing(true);

    try {
      const photo = await capturePhoto();
      const processedImagePath = processImagePath(photo.path);
      console.log('📸 Captured image at:', processedImagePath);
      console.log('🔐 Using token:', token.substring(0, 20) + '...');
      console.log('📐 Photo object:', photo);

      // Client-side face detection validation using ML Kit
      console.log('🔍 Running client-side face detection...');
      console.log('📷 Photo details:', {
        path: processedImagePath,
        fileExists: processedImagePath.startsWith('file://'),
      });

      const detectedFaces = await FaceDetection.detect(processedImagePath);
      console.log('📊 Detected faces:', detectedFaces.length);
      console.log(
        '🔬 Face detection result:',
        JSON.stringify(detectedFaces, null, 2),
      );

      // Validate face count and quality
      if (detectedFaces.length === 0) {
        handleFaceDetectionFailure(
          'No face detected. Please ensure your face is clearly visible.',
        );
        return;
      }

      if (detectedFaces.length > 1) {
        console.log('⚠️ Multiple faces detected:', detectedFaces.length);
        setMultipleFacesDetected(true);
        handleFaceDetectionFailure(
          'Multiple faces detected. Please ensure only one face is in the frame.',
        );
        return;
      }

      // Check face completeness and quality
      const face = detectedFaces[0];
      const bounds = face.frame || face.bounds; // Use frame for ML Kit, fallback to bounds

      // ML Kit returns coordinates in image space. For size validation,
      // we'll use a different approach - check if bounds are reasonable
      const faceWidth = bounds.width;
      const faceHeight = bounds.height;
      const faceArea = faceWidth * faceHeight;

      console.log('📏 Face dimensions:', {
        width: faceWidth,
        height: faceHeight,
        area: faceArea,
      });

      // Validate face size (stricter range for better detection)
      if (faceArea < 80000) {
        handleFaceDetectionFailure(
          'Face is too small. Please move closer to the camera.',
        );
        return;
      }

      if (faceArea > 2000000) {
        handleFaceDetectionFailure(
          'Face is too large. Please move slightly away from the camera.',
        );
        return;
      }

      // STRICT VALIDATION: Check if face is properly centered and complete
      // Use the actual image dimensions from the captured photo
      // The Vision Camera takePhoto() returns a photo object with width and height
      const photoWidth = photo?.width || 1080; // Common front camera width
      const photoHeight = photo?.height || 1920; // Common front camera height

      console.log('📐 Actual image dimensions:', {
        photoWidth,
        photoHeight,
        faceBounds: bounds,
        hasWidth: !!photo?.width,
        hasHeight: !!photo?.height,
      });

      // Calculate face position as percentage of actual image frame
      const centerTolerance = 15; // 15% tolerance from exact center
      const faceLeftPercent = (bounds.left / photoWidth) * 100;
      const faceTopPercent = (bounds.top / photoHeight) * 100;
      const faceCenterX = bounds.left + faceWidth / 2;
      const faceCenterY = bounds.top + faceHeight / 2;
      const faceCenterXPercent = (faceCenterX / photoWidth) * 100;
      const faceCenterYPercent = (faceCenterY / photoHeight) * 100;

      const isHorizontallyCentered =
        faceCenterXPercent >= 50 - centerTolerance &&
        faceCenterXPercent <= 50 + centerTolerance;
      const isVerticallyCentered =
        faceCenterYPercent >= 45 - centerTolerance &&
        faceCenterYPercent <= 55 + centerTolerance; // Slightly lower tolerance for vertical

      console.log('🎯 Face position validation:', {
        faceLeftPercent: faceLeftPercent.toFixed(1) + '%',
        faceTopPercent: faceTopPercent.toFixed(1) + '%',
        faceCenterXPercent: faceCenterXPercent.toFixed(1) + '%',
        faceCenterYPercent: faceCenterYPercent.toFixed(1) + '%',
        photoWidth,
        photoHeight,
        isHorizontallyCentered,
        isVerticallyCentered,
        centerTolerance,
      });

      if (!isHorizontallyCentered || !isVerticallyCentered) {
        handleFaceDetectionFailure('Please center your face in the frame.');
        return;
      }

      // Check if face is too close to edges (should have margin)
      const edgeMargin = 5; // 5% margin from edges
      const isTooCloseToLeft = faceLeftPercent < edgeMargin;
      const isTooCloseToTop = faceTopPercent < edgeMargin;
      const isTooCloseToRight =
        faceLeftPercent + (faceWidth / photoWidth) * 100 > 100 - edgeMargin;
      const isTooCloseToBottom =
        faceTopPercent + (faceHeight / photoHeight) * 100 > 100 - edgeMargin;

      if (
        isTooCloseToLeft ||
        isTooCloseToTop ||
        isTooCloseToRight ||
        isTooCloseToBottom
      ) {
        handleFaceDetectionFailure(
          'Please ensure your full face is visible in the frame.',
        );
        return;
      }

      // Check face aspect ratio (should be roughly oval/round)
      const aspectRatio = faceWidth / faceHeight;
      const minAspectRatio = 0.6; // Face shouldn't be too wide
      const maxAspectRatio = 1.4; // Face shouldn't be too tall

      if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
        handleFaceDetectionFailure('Please face the camera directly.');
        return;
      }

      console.log('✅ All strict validations passed:', {
        faceArea,
        faceCenterXPercent: faceCenterXPercent.toFixed(1),
        faceCenterYPercent: faceCenterYPercent.toFixed(1),
        aspectRatio: aspectRatio.toFixed(2),
        isHorizontallyCentered,
        isVerticallyCentered,
      });

      // Client-side validation passed
      console.log('✅ Client-side face validation passed');
      setFaceCount(1);
      setIsFaceValid(true);
      setFaceQuality('good');
      setMultipleFacesDetected(false);

      // Prepare image file object for API
      const imageFile = {
        uri: processedImagePath,
        type: 'image/jpeg',
        name: `face_scan_${Date.now()}.jpg`,
      };

      // Use API for face detection from api.js
      console.log('🔍 Calling face detection API...');
      console.log('🌐 API endpoint: face/detect-face');
      const detectionResult = await detectFace(imageFile, token);
      console.log(
        '✅ Face detection result:',
        JSON.stringify(detectionResult, null, 2),
      );

      // Check if detection was successful AND a face was actually detected
      if (
        detectionResult.error === false &&
        detectionResult.data?.hasFace === true
      ) {
        console.log('✅ Face detected successfully!');
        await handleDetectionSuccess(processedImagePath);
      } else {
        console.log('❌ Face detection failed:', detectionResult.message);
        handleFaceDetectionFailure(
          detectionResult.message ||
            'No face detected. Please ensure your face is clearly visible.',
        );
      }
    } catch (err) {
      console.error('❌ Failed to capture or detect:', err);
      console.error('❌ Error details:', err.message, err.stack);
      handleFaceDetectionFailure(
        'Detection error: ' + (err.message || 'Unknown error'),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDetectionSuccess = async imagePath => {
    if (isVerifying || verificationComplete) return;

    if (failureTimeoutRef.current) {
      clearTimeout(failureTimeoutRef.current);
      failureTimeoutRef.current = null;
    }

    setFaceDetected(true);
    setPhotoUri(imagePath);
    setIsVerifying(true);
    setAttemptCount(0);

    try {
      const uploadResponse = await uploadImage({
        path: imagePath,
      });

      if (uploadResponse.error === false) {
        const imageUrl = uploadResponse.data?.url;
        const deviceId = await DeviceInfo.getUniqueId();

        if (imageUrl) {
          const data = {
            faceImageUrl: imageUrl,
            deviceId: deviceId,
          };

          const userId = SignupData?.userId;
          const UploadRegisterFaceScanApi = await faceScanRegisteration(
            data,
            userId,
            token,
          );
          console.log(
            '🚀 ~ handleDetectionSuccess ~ UploadRegisterFaceScanApi:',
            JSON.stringify(UploadRegisterFaceScanApi, null, 3),
          );

          if (!UploadRegisterFaceScanApi?.error === false) {
            setVerificationComplete(true);
            setVerificationSuccessful(true);

            // Navigate ONLY after successful verification
            navigation.navigate(SCREENS.FACEIDVERIFIED, {photoUri: imagePath});

            const successTimeout = setTimeout(() => {
              if (verificationSuccessful) {
                setShowSuccessModal(true);
              }
            }, 2000);

            timeoutRefs.current.push(successTimeout);
            // showAlert(UploadRegisterFaceScanApi?.message, 'success');
            const imageUrl = uploadResponse.data?.url;
            await AsyncStorage.setItem('FaceImageUrl', imageUrl);
          }
          setShowRetryModal(false);
        }
      } else {
        console.warn('Upload failed:', uploadResponse.message);
        handleVerificationFailure();
      }
    } catch (uploadError) {
      handleFaceDetectionFailure('Upload error');
      console.error('Upload error:', uploadError);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerificationFailure = () => {
    setPhotoUri(null);
    setFaceDetected(false);
    setVerificationSuccessful(false);
    setVerificationComplete(false);
    setFaceCount(0);
    setIsFaceValid(false);
    setFaceQuality(null);
    setMultipleFacesDetected(false);
    setShutterEnabled(false);

    const failureTimeout = setTimeout(() => {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      if (newAttemptCount >= MAX_ATTEMPTS) {
        setShowOtpModal(true);
      } else {
        setShowRetryModal(true);
      }
    }, 2000);

    timeoutRefs.current.push(failureTimeout);
  };

  const MAX_ATTEMPTS = 3;

  const handleFaceDetectionFailure = errorMessage => {
    console.log('⚠️ Face detection failure:', errorMessage);
    setFaceDetected(false);
    setVerificationSuccessful(false);
    setPhotoUri(null);
    setFaceCount(0);
    setIsFaceValid(false);
    setFaceQuality(null);
    setShutterEnabled(false);

    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    console.log(`⚠️ Attempt ${newAttemptCount} of ${MAX_ATTEMPTS}`);

    if (newAttemptCount >= MAX_ATTEMPTS) {
      console.log('❌ Max attempts reached, showing OTP modal');
      setShowOtpModal(true);
    } else {
      console.log('🔄 Showing retry modal');
      setShowRetryModal(true);
    }
  };

  const handleRetry = () => {
    setShowRetryModal(false);
    setPhotoUri(null);
    setFaceDetected(false);
    setIsVerifying(false);
    setVerificationSuccessful(false);
    setVerificationComplete(false);
    setFaceCount(0);
    setIsFaceValid(false);
    setFaceQuality(null);
    setMultipleFacesDetected(false);
    setShutterEnabled(false);
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    setIsVerifying(false);

    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];

    navigation.navigate(SCREENS.FACEIDVERIFIED, {photoUri});
  };

  const handleOtpVerification = () => {
    setShowOtpModal(false);
    setAttemptCount(0);
    setFaceDetected(false);
    setPhotoUri(null);
    setIsProcessing(false);
    setIsVerifying(false);
    setVerificationSuccessful(false);
    setVerificationComplete(false);

    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];

    navigation.navigate('OtpVerification');
  };

  if (isCheckingPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.text}>{t('Checking permissions...')}</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          {t('Camera permission is required for face verification')}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
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
          }}>
          <Text style={styles.permissionButtonText}>
            {t('Grant Camera Permission')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{t('Front camera not available')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerIconContainer}>
          <Icon name="face" size={50} color={Colors.lightTheme.primaryColor} />
        </View>
        <Text style={styles.headerTitle}>{t('Face Verification')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('Position your face in the center and follow the guidance')}
        </Text>
      </View>

      {photoUri ? (
        <Animated.View
          style={[
            styles.circularCameraContainer,
            {
              borderColor: faceDetected ? Colors.success : Colors.error,
              borderWidth: 8,
            },
          ]}>
          <SuccessPulse isVisible={true} />
          <Image source={{uri: photoUri}} style={styles.preview} />
          <View style={styles.successBadge}>
            <Icon name="check-circle" size={18} color={Colors.white} />
            <Text style={styles.successBadgeText}>{t('Verified')}</Text>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.cameraWrapper}>
          <Animated.View
            style={[
              styles.circularCameraContainer,
              {
                borderColor: isFaceValid
                  ? Colors.success
                  : multipleFacesDetected
                  ? Colors.error
                  : faceCount > 0
                  ? Colors.warning
                  : Colors.neutral,
                borderWidth: 8,
              },
            ]}>
            <Camera
              ref={cameraRef}
              style={styles.circularCamera}
              device={device}
              isActive={true}
              photo={true}
              audio={false}
            />
            {/* Face Detection Overlay */}
            <FaceOverlay faces={detectedFaces} />
            {/* State Indicators */}
            <StateIndicator />
            {/* Optimal Detection Zone Indicator - Show only when no face detected */}
            {detectedFaces.length === 0 && (
              <OptimalZoneIndicator isActive={!isFaceValid} />
            )}
            {/* Corner Guidance */}
            <View style={styles.cornerGuidance}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </Animated.View>
        </View>
      )}

      <View style={styles.instructionsContainer}>
        {/* <Text style={styles.instructionTitle}>{t('Instructions:')}</Text> */}
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

      <View style={styles.statusContainer}>
        {isProcessing ? (
          <Text style={styles.statusText}>{t('Processing your image...')}</Text>
        ) : isVerifying ? (
          <Text style={styles.statusText}>
            {t('Verifying your registration...')}
          </Text>
        ) : faceDetected && verificationSuccessful ? (
          <Text style={[styles.statusText, styles.successText]}>
            {t('Face registered successfully!')}
          </Text>
        ) : isFaceValid ? (
          <Text style={[styles.statusText, styles.successText]}>
            {t('✓ Face ready! Tap the capture button')}
          </Text>
        ) : multipleFacesDetected ? (
          <Text style={[styles.statusText, styles.errorText]}>
            {t(
              '⚠️ Multiple faces detected. Only one person should be in frame.',
            )}
          </Text>
        ) : faceCount > 0 ? (
          <Text style={[styles.statusText, {color: '#FF9800'}]}>
            {t(
              '⚡ Face detected but needs adjustment. Center your face and ensure good lighting.',
            )}
          </Text>
        ) : (
          <Text style={styles.statusText}>
            {t('Position your face in the circle and wait for green border')}
          </Text>
        )}
      </View>
      {/* Capture Button - Always visible when not processing */}
      {!isProcessing && !isVerifying && !photoUri && (
        <View style={styles.shutterButtonContainer}>
          <TouchableOpacity
            style={[
              styles.shutterButton,
              isFaceValid &&
                !multipleFacesDetected &&
                styles.shutterButtonReady,
              (!isFaceValid || multipleFacesDetected) &&
                faceCount > 0 &&
                styles.shutterButtonDisabled,
            ]}
            onPress={handleShutterPress}
            disabled={
              isProcessing || isVerifying || (!isFaceValid && faceCount > 0)
            }
            activeOpacity={0.8}>
            <View style={styles.shutterButtonInner}>
              <Icon
                name="camera-alt"
                size={26}
                color={
                  isFaceValid && !multipleFacesDetected ? Colors.white : '#666'
                }
              />
            </View>
            {/* Button ripple effect */}
            {isFaceValid && !multipleFacesDetected && (
              <View style={styles.shutterRipple} />
            )}
          </TouchableOpacity>
          <Text style={styles.shutterButtonLabel}>
            {isFaceValid && !multipleFacesDetected
              ? t('Tap to Capture')
              : multipleFacesDetected
              ? t('Multiple faces detected')
              : t('Position face to enable')}
          </Text>
        </View>
      )}
      <Modal
        visible={isProcessing || isVerifying}
        transparent={true}
        animationType="fade">
        <View
          style={[
            styles.modalContainer,
            {backgroundColor: 'rgba(0, 0, 0, 0.7)'},
          ]}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: isDarkMode ? '#1e1e1e' : 'white'},
            ]}>
            <ActivityIndicator size="large" color="#006EC2" />
            <Text
              style={[styles.modalText, {color: isDarkMode ? '#ccc' : '#555'}]}>
              {isProcessing
                ? t('Processing your image...')
                : t('Verifying your registration...')}
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.successModal]}>
            <Icon
              name="verified-user"
              size={30}
              color="red"
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>{t('Success!')}</Text>
            <Text style={styles.modalText}>
              {t(
                'Face verification successful. You can continue to the next step.',
              )}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessContinue}>
              <Text style={styles.modalButtonText}>{t('Continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showRetryModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.retryModal]}>
            <Icon name="error-outline" size={30} color="red" />
            <Text style={styles.modalTitle}>{t('Face Not Detected')}</Text>
            <Text style={styles.modalText}>
              {t("We couldn't detect a face. Please try again.")}
              <Text style={{fontWeight: 'bold'}}>
                ({t('Attempt')} {attemptCount} /3)
              </Text>
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleRetry}>
              <Text style={styles.modalButtonText}>{t('Try Again')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showOtpModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.otpModal]}>
            <Icon name="error-outline" size={30} color="red" />
            <Text style={styles.modalTitle}>{t('Verification Required')}</Text>
            <Text style={styles.modalText}>
              {t(
                "We couldn't verify your face after 3 attempts. Please verify using OTP instead.",
              )}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleOtpVerification}>
              <Text style={styles.modalButtonText}>{t('Verify with OTP')}</Text>
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
      color: isDarkMode
        ? Colors.darkTheme.white
        : Colors.lightTheme.primaryTextColor,
      fontSize: 16,
      marginTop: 12,
      marginBottom: 20,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    preview: {
      ...StyleSheet.absoluteFillObject,
      resizeMode: 'cover',
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
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    circularCameraContainer: {
      width: hp(38),
      height: hp(38),
      borderRadius: 200,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      marginVertical: hp(2),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    circularCamera: {
      width: '100%',
      height: '100%',
    },
    successModal: {
      borderTopWidth: 5,
      borderTopColor: '#4CAF50',
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
    permissionButton: {
      backgroundColor: Colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
      minWidth: 200,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: hp(2),
    },
    permissionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    shutterButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(1.5),
    },
    shutterButton: {
      width: 65,
      height: 65,
      borderRadius: 32.5,
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
      borderWidth: 3,
      borderColor: '#e0e0e0',
      position: 'relative',
      overflow: 'hidden',
    },
    shutterButtonInner: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    shutterButtonDisabled: {
      opacity: 0.4,
      shadowOpacity: 0.1,
    },
    shutterButtonReady: {
      backgroundColor: Colors.success,
      borderColor: Colors.success,
      shadowColor: Colors.success,
      shadowOpacity: 0.4,
    },
    shutterButtonLabel: {
      marginTop: hp(0.5),
      fontSize: 11,
      fontWeight: '500',
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      minHeight: 18,
    },
    shutterRipple: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 32.5,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      zIndex: 0,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: hp(2),
      paddingHorizontal: wp(5),
    },
    headerIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primary
        : Colors.lightTheme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: hp(1.5),
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors.lightTheme.primaryColor,
      marginBottom: hp(0.5),
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 13,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      lineHeight: 18,
    },
    instructionsContainer: {
      paddingHorizontal: wp(6),
      alignItems: 'flex-start',
      width: '100%',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      borderRadius: 12,
      padding: wp(3),
      marginHorizontal: wp(5),
    },
    instructionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
    },
    instructionText: {
      fontSize: 11,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0.3),
      lineHeight: 16,
    },
    statusContainer: {
      paddingHorizontal: wp(5),
      alignItems: 'center',
      minHeight: hp(5),
      justifyContent: 'center',
    },
    statusText: {
      fontSize: 12,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
    successText: {
      color: Colors.success,
    },
    errorText: {
      color: Colors.error,
    },
    // New animated components styles
    scanningLine: {
      position: 'absolute',
      width: '90%',
      height: 2,
      backgroundColor: Colors.primary,
      borderRadius: 1,
      shadowColor: Colors.primary,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.8,
      shadowRadius: 4,
      elevation: 8,
    },
    pulsingRing: {
      position: 'absolute',
      width: hp(30),
      height: hp(30),
      borderRadius: hp(30),
      borderWidth: 2,
      borderColor: Colors.success,
      backgroundColor: 'transparent',
    },
    successPulse: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 200,
      backgroundColor: Colors.success,
    },
    // Face Detection Overlay Styles
    faceOverlay: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: Colors.success,
      backgroundColor: 'transparent',
    },
    faceOverlayCorner: {
      position: 'absolute',
      width: 15,
      height: 15,
      borderWidth: 3,
      borderColor: Colors.success,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    topRight: {
      top: -2,
      right: -2,
      transform: [{rotate: '90deg'}],
    },
    bottomLeft: {
      bottom: -2,
      left: -2,
      transform: [{rotate: '-90deg'}],
    },
    bottomRight: {
      bottom: -2,
      right: -2,
      transform: [{rotate: '180deg'}],
    },
    optimalZoneContainer: {
      position: 'absolute',
      top: hp(10),
      left: hp(13),
      right: 0,
      transform: [{translateX: -50}, {translateY: -50}],
      alignItems: 'center',
    },
    optimalZoneCircle: {
      width: hp(28),
      height: hp(28),
      borderRadius: hp(28) / 2,
      borderWidth: 2,
      borderColor: Colors.success,
      borderStyle: 'dashed',
      opacity: 0.6,
      marginTop: 10,
    },
    optimalZoneText: {
      marginTop: 8,
      color: Colors.warning,
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
    },
    // Camera wrapper styles
    cameraWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cornerGuidance: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderWidth: 3,
      borderColor: Colors.neutral,
      opacity: 0.6,
    },
    topLeft: {
      top: 8,
      left: 8,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
    },
    topRight: {
      top: 8,
      right: 8,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
    },
    bottomLeft: {
      bottom: 8,
      left: 8,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
    },
    bottomRight: {
      bottom: 8,
      right: 8,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    successBadge: {
      position: 'absolute',
      bottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.success,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    successBadgeText: {
      color: Colors.white,
      fontSize: 10,
      fontWeight: 'bold',
      marginLeft: 5,
    },
    debugButton: {
      backgroundColor: '#FF9800',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignSelf: 'center',
    },
    debugButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

export default FaceScaning;
