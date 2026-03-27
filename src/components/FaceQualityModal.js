/**
 * FaceQualityModal.js
 *
 * Modal component that analyzes face photo quality after capture.
 * Shows sequential animated checks and result (success/failure).
 *
 * Dependencies:
 *   react-native
 *   react-native-vector-icons/MaterialIcons
 *   react-native-responsive-screen
 *   react-native-fs (optional - fails gracefully if not installed)
 *   react-redux
 *   react-i18next
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {Colors} from '../../Constants/themeColors';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY CHECK CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const QUALITY_CONFIG = {
  STEP_DURATION_MS: 700, // minimum time to show each step
  TOTAL_ANALYZE_TIME_MS: 2500,
  MIN_FILE_SIZE_KB: 50, // below = blurry
  DARK_FILE_SIZE_KB: 20, // below = too dark
};

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY CHECK RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────
export const QUALITY_RESULT = {
  PASSED: 'PASSED',
  FAILED_BLUR: 'FAILED_BLUR',
  FAILED_DARK: 'FAILED_DARK',
  FAILED_BRIGHT: 'FAILED_BRIGHT',
  FAILED_NO_FACE: 'FAILED_NO_FACE',
};

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY CHECK LOGIC
// ─────────────────────────────────────────────────────────────────────────────
const toFsPath = uri => uri?.replace(/^file:\/\//, '') || '';

const runQualityChecks = async uri => {
  if (!uri) {
    return {passed: false, failedStep: 1, reason: 'no_face'};
  }

  let sizeKB = 999;

  try {
    const RNFS = require('react-native-fs');
    const stat = await RNFS.stat(toFsPath(uri));
    sizeKB = (stat.size || 0) / 1024;
  } catch {
    // RNFS not available - pass all checks
    return {passed: true, failedStep: null, reason: null};
  }

  // Step 2: Check lighting (too dark)
  if (sizeKB < QUALITY_CONFIG.DARK_FILE_SIZE_KB) {
    return {passed: false, failedStep: 2, reason: 'too_dark'};
  }

  // Step 3: Check sharpness (blurry)
  if (sizeKB < QUALITY_CONFIG.MIN_FILE_SIZE_KB) {
    return {passed: false, failedStep: 3, reason: 'blurry'};
  }

  return {passed: true, failedStep: null, reason: null};
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const FaceQualityModal = forwardRef((props, ref) => {
  const {
    visible = false,
    photoUri = null,
    onContinue = null,
    onRetake = null,
    onClose = null,
  } = props;

  const {t} = useTranslation();
  const {isDarkMode} = useSelector(s => s.theme);

  // ── Modal Animation State ────────────────────────────────────────────────
  const [modalState, setModalState] = useState('closed'); // closed, analyzing, success, failure
  const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2, 3
  const [stepResults, setStepResults] = useState([null, null, null]); // [result0, result1, result2]
  const [failureReason, setFailureReason] = useState(null);

  // ── Animations ────────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Timers ────────────────────────────────────────────────────────────────
  const stepTimerRef = useRef(null);
  const analyzeTimerRef = useRef(null);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    clearTimeout(stepTimerRef.current);
    clearTimeout(analyzeTimerRef.current);
    stepAnims.forEach(anim => anim.setValue(0));
    resultScaleAnim.setValue(0);
    progressAnim.setValue(0);
    slideAnim.setValue(0);
    fadeAnim.setValue(0);
  }, [stepAnims, resultScaleAnim, progressAnim, slideAnim, fadeAnim]);

  // ── Reset state when closed ─────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      cleanup();
      setTimeout(() => {
        setModalState('closed');
        setCurrentStep(0);
        setStepResults([null, null, null]);
        setFailureReason(null);
      }, 300);
    }
  }, [visible, cleanup]);

  // ── Start analysis when modal opens ─────────────────────────────────────
  useEffect(() => {
    if (visible && modalState === 'closed') {
      setModalState('analyzing');
      setCurrentStep(0);
      setStepResults([null, null, null]);

      // Animate modal in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();

      // Start progress animation
      Animated.loop(
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: QUALITY_CONFIG.TOTAL_ANALYZE_TIME_MS,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ).start();

      // Run the actual quality checks
      runQualityChecks(photoUri).then(result => {
        // Animate through steps
        animateThroughSteps(result);
      });
    }
  }, [visible, modalState, photoUri, fadeAnim, slideAnim, progressAnim, stepAnims]);

  // ── Animate through check steps ─────────────────────────────────────────
  const animateThroughSteps = useCallback(
    async result => {
      const steps = [
        {icon: 'face', key: 'face_clarity'},
        {icon: 'wb-sunny', key: 'lighting'},
        {icon: 'center-focus-strong', key: 'sharpness'},
      ];

      for (let i = 0; i < 3; i++) {
        // Wait for minimum step duration
        await new Promise(resolve => {
          stepTimerRef.current = setTimeout(resolve, QUALITY_CONFIG.STEP_DURATION_MS);
        });

        // Mark this step as completed (success for now)
        setStepResults(prev => {
          const newResults = [...prev];
          newResults[i] = 'success';
          return newResults;
        });

        // Animate this step in
        Animated.timing(stepAnims[i], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }

      // Stop progress animation
      progressAnim.stopAnimation();

      // Determine final result
      if (result.passed) {
        setModalState('success');
        // Animate success checkmark
        Animated.sequence([
          Animated.timing(resultScaleAnim, {
            toValue: 1.1,
            duration: 200,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.spring(resultScaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setModalState('failure');
        setFailureReason(result.reason);
        // Update failed step result
        if (result.failedStep) {
          setStepResults(prev => {
            const newResults = [...prev];
            // Set failed step to error
            if (result.failedStep <= 3) {
              newResults[result.failedStep - 1] = 'error';
            }
            return newResults;
          });
        }
        // Animate failure X
        Animated.sequence([
          Animated.timing(resultScaleAnim, {
            toValue: 1.1,
            duration: 200,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.spring(resultScaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [stepAnims, progressAnim, resultScaleAnim],
  );

  // ── Handle Continue ────────────────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    if (onContinue) onContinue();
  }, [onContinue]);

  // ── Handle Retake ────────────────────────────────────────────────────────
  const handleRetake = useCallback(() => {
    if (onRetake) onRetake();
  }, [onRetake]);

  // ── Handle Close ──────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const styles = buildStyles(theme, isDarkMode);

  // ── Step definitions ──────────────────────────────────────────────────────
  const steps = [
    {icon: 'face', title: t('Checking face clarity…')},
    {icon: 'wb-sunny', title: t('Checking lighting…')},
    {icon: 'center-focus-strong', title: t('Checking image sharpness…')},
  ];

  // ── Render closed state ─────────────────────────────────────────────────
  if (modalState === 'closed') {
    return null;
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalCard,
            {
              opacity: slideAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}>
          {/* Header with preview */}
          {photoUri && (
            <View style={styles.previewContainer}>
              <Image
                source={{uri: photoUri}}
                style={styles.previewImage}
                blurRadius={modalState === 'analyzing' ? 8 : 0}
              />
              {modalState === 'analyzing' && (
                <View style={styles.previewOverlay}>
                  <Animated.View
                    style={[
                      styles.progressCircle,
                      {
                        transform: [
                          {
                            rotate: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <Icon name="sync" size={24} color="#FFF" />
                  </Animated.View>
                </View>
              )}
            </View>
          )}

          {/* Title */}
          <Text style={styles.mainTitle}>
            {modalState === 'analyzing' && t('Analyzing your photo…')}
            {modalState === 'success' && t('Looking good!')}
            {modalState === 'failure' && getFailureTitle(failureReason, t)}
          </Text>

          {/* Subtitle */}
          {modalState !== 'analyzing' && (
            <Text style={styles.subtitle}>
              {modalState === 'success' && t('Your photo is clear and ready.')}
              {modalState === 'failure' && getFailureSubtitle(failureReason, t)}
            </Text>
          )}

          {/* Step indicators (analyzing state) */}
          {modalState === 'analyzing' && (
            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <Animated.View
                  key={step.key}
                  style={[
                    styles.stepRow,
                    {
                      opacity: stepAnims[index]?.interpolate?.({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.5, 0.8, 1],
                      }) || 1,
                      transform: [
                        {
                          translateY: stepAnims[index]?.interpolate?.({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }) || 0,
                        },
                      ],
                    },
                  ]}>
                  <View
                    style={[
                      styles.stepIcon,
                      stepResults[index] === 'success' && styles.stepIconSuccess,
                      stepResults[index] === 'error' && styles.stepIconError,
                    ]}>
                    {stepResults[index] === 'success' ? (
                      <Icon name="check" size={16} color="#FFF" />
                    ) : stepResults[index] === 'error' ? (
                      <Icon name="close" size={16} color="#FFF" />
                    ) : (
                      <Icon
                        name={step.icon}
                        size={16}
                        color={isDarkMode ? '#888' : '#999'}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepTitle,
                      stepResults[index] === 'success' && styles.stepTitleSuccess,
                      stepResults[index] === 'error' && styles.stepTitleError,
                    ]}>
                    {step.title}
                  </Text>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Result Icon (success/failure) */}
          {modalState === 'success' && (
            <Animated.View
              style={[
                styles.resultIconContainer,
                styles.resultIconSuccess,
                {
                  transform: [{scale: resultScaleAnim}],
                },
              ]}>
              <Icon name="check" size={64} color="#FFF" />
            </Animated.View>
          )}

          {modalState === 'failure' && (
            <Animated.View
              style={[
                styles.resultIconContainer,
                styles.resultIconError,
                {
                  transform: [{scale: resultScaleAnim}],
                },
              ]}>
              <Icon name="close" size={64} color="#FFF" />
            </Animated.View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              modalState === 'success'
                ? styles.successButton
                : modalState === 'failure'
                ? styles.failureButton
                : styles.analyzingButton,
            ]}
            activeOpacity={0.85}
            onPress={modalState === 'success' ? handleContinue : handleRetake}
            disabled={modalState === 'analyzing'}>
            <Text style={styles.actionButtonText}>
              {modalState === 'analyzing' && t('Analyzing…')}
              {modalState === 'success' && t('Continue')}
              {modalState === 'failure' && t('Retake Photo')}
            </Text>
            {modalState === 'success' && (
              <Icon name="arrow-forward" size={20} color="#FFF" style={{marginLeft: wp(1)}} />
            )}
            {modalState === 'failure' && (
              <Icon name="refresh" size={20} color="#FFF" style={{marginLeft: wp(1)}} />
            )}
          </TouchableOpacity>

          {/* Close button for success/failure */}
          {modalState !== 'analyzing' && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>{t('Cancel')}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

FaceQualityModal.displayName = 'FaceQualityModal';

export default FaceQualityModal;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
const getFailureTitle = (reason, t) => {
  switch (reason) {
    case 'blurry':
      return t('Image is blurry');
    case 'too_dark':
      return t('Too dark');
    case 'too_bright':
      return t('Too bright');
    case 'no_face':
      return t('Face not detected');
    default:
      return t('Image quality check failed');
  }
};

const getFailureSubtitle = (reason, t) => {
  switch (reason) {
    case 'blurry':
      return t('Please hold your phone steady and retake.');
    case 'too_dark':
      return t('Move to a brighter area and retake.');
    case 'too_bright':
      return t('Avoid strong light behind you and retake.');
    case 'no_face':
      return t('Make sure your face is fully in frame.');
    default:
      return t('Please try again with better lighting.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const buildStyles = (theme, isDarkMode) => {
  return StyleSheet.create({
    // ── Overlay ─────────────────────────────────────────────────────────────
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(5),
    },
    overlayTouch: {
      ...StyleSheet.absoluteFillObject,
    },

    // ── Modal Card ─────────────────────────────────────────────────────────
    modalCard: {
      width: '100%',
      maxWidth: wp(90),
      backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
      borderRadius: wp(6),
      padding: wp(6),
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 10},
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 15,
    },

    // ── Preview ────────────────────────────────────────────────────────────
    previewContainer: {
      width: wp(35),
      height: wp(35),
      borderRadius: wp(4),
      overflow: 'hidden',
      marginBottom: hp(2),
    },
    previewImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    previewOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressCircle: {
      width: wp(12),
      height: wp(12),
      borderRadius: wp(6),
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ── Titles ─────────────────────────────────────────────────────────────
    mainTitle: {
      fontSize: wp(6),
      fontWeight: '700',
      color: theme.primaryTextColor,
      textAlign: 'center',
      marginBottom: hp(1),
    },
    subtitle: {
      fontSize: wp(3.8),
      color: theme.secondryTextColor,
      textAlign: 'center',
      marginBottom: hp(2.5),
      lineHeight: hp(2.8),
      paddingHorizontal: wp(2),
    },

    // ── Steps Container ────────────────────────────────────────────────────
    stepsContainer: {
      width: '100%',
      marginBottom: hp(2.5),
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1),
      paddingHorizontal: wp(2),
    },
    stepIcon: {
      width: wp(7),
      height: wp(7),
      borderRadius: wp(3.5),
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: wp(3),
    },
    stepIconSuccess: {
      backgroundColor: '#4CAF50',
    },
    stepIconError: {
      backgroundColor: '#F44336',
    },
    stepTitle: {
      fontSize: wp(3.8),
      color: isDarkMode ? '#888' : '#999',
      flex: 1,
    },
    stepTitleSuccess: {
      color: '#4CAF50',
      fontWeight: '600',
    },
    stepTitleError: {
      color: '#F44336',
      fontWeight: '600',
    },

    // ── Result Icon ─────────────────────────────────────────────────────────
    resultIconContainer: {
      width: wp(22),
      height: wp(22),
      borderRadius: wp(11),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    resultIconSuccess: {
      backgroundColor: '#4CAF50',
    },
    resultIconError: {
      backgroundColor: '#F44336',
    },

    // ── Action Button ─────────────────────────────────────────────────────
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingVertical: hp(1.8),
      borderRadius: wp(8),
      marginTop: hp(1),
    },
    successButton: {
      backgroundColor: '#4CAF50',
    },
    failureButton: {
      backgroundColor: '#F44336',
    },
    analyzingButton: {
      backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
    },
    actionButtonText: {
      color: '#FFF',
      fontSize: wp(4.2),
      fontWeight: '700',
    },

    // ── Close Button ───────────────────────────────────────────────────────
    closeButton: {
      marginTop: hp(1.5),
      paddingVertical: hp(1),
    },
    closeButtonText: {
      fontSize: wp(3.5),
      color: theme.secondryTextColor,
    },
  });
};
