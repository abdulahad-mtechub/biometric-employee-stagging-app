import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
  Modal,
  PermissionsAndroid,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import FaceDetection from '@react-native-ml-kit/face-detection';
import Orientation from 'react-native-orientation-locker';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useWindowDimensions} from 'react-native';
import {Colors} from '../../Constants/themeColors';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ANGLE_TOLERANCE = 12;
const PITCH_TOLERANCE = 12;
const YAW_TOLERANCE = 18;
const MARGIN = 0.05;
const MIN_FACE_AREA = 0.08;
const MAX_FACE_AREA = 0.35;
const DETECTION_INTERVAL = 250;
const CAMERA_INIT_DELAY = 1500;
const PHONE_ROTATED_ROLL_THRESHOLD = 60;
const PHONE_ROTATED_PITCH_THRESHOLD = 60;
const AUTO_CAPTURE_ENABLED = true;
const STABILITY_DURATION = 0;
const POSITION_TOLERANCE = 0.1;
const REQUIRED_LANDMARKS = ['leftEye', 'rightEye', 'noseBase', 'upperLip'];
/** Brief pause per checklist step (UX-only path when not using instant quality UI) */
const STEP_MIN_DURATION = 100;
const STEP_ROW_ANIM_MS = 130;

// ── Quality thresholds (registration / still photo) ─────────────────────────
// Global Laplacian is misleading (sharp background, soft face) — we use face-crop Laplacian.
const BLUR_FACE_LAPLACIAN_THRESHOLD = 72; // below → face region looks blurry / soft
const MIN_BRIGHTNESS_THRESHOLD = 54; // stricter: dim “blue” indoor shots fail lighting step
const MAX_BRIGHTNESS_THRESHOLD = 218;
/** Max deviation of face center from image center (0–0.5 scale), normalized like live preview */
const QUALITY_CENTER_SLACK_X = 0.14;
const QUALITY_CENTER_SLACK_Y = 0.17;
const QUALITY_FRAME_MARGIN = 0.06; // face box must stay inside frame (like PARTIAL_FACE)

const FACE_DEBUG_ENABLED = __DEV__;
const faceDebugLog = (...parts) => {
  if (!FACE_DEBUG_ENABLED) return;
  console.log(
    `[FaceDetector][${new Date().toISOString()}]`,
    ...parts,
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FACE STATUS ENUM
// ─────────────────────────────────────────────────────────────────────────────
export const FACE_STATUS = {
  NO_FACE: 'NO_FACE',
  TOO_FAR: 'TOO_FAR',
  TOO_CLOSE: 'TOO_CLOSE',
  NOT_CENTERED: 'NOT_CENTERED',
  MULTIPLE_FACES: 'MULTIPLE_FACES',
  PARTIAL_FACE: 'PARTIAL_FACE',
  READY: 'READY',
  DEVICE_NOT_UPRIGHT: 'DEVICE_NOT_UPRIGHT',
  FACE_TILTED: 'FACE_TILTED',
  FACE_TURNED: 'FACE_TURNED',
  WAITING_CAMERA: 'WAITING_CAMERA',
  TOO_DARK: 'TOO_DARK',
  TOO_BRIGHT: 'TOO_BRIGHT',
  IMAGE_BLURRY: 'IMAGE_BLURRY',
  STABILIZING: 'STABILIZING',
  AUTO_CAPTURING: 'AUTO_CAPTURING',
  /** Live ML detection off — camera preview only until user taps capture */
  CAMERA_PREVIEW: 'CAMERA_PREVIEW',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const processImagePath = path =>
  Platform.OS === 'android' && !path.startsWith('file://')
    ? `file://${path}`
    : path;

/** Vision Camera + iOS may use any of these for an allowed camera state */
const VISION_CAMERA_GRANTED = new Set([
  'granted',
  'authorized',
  'limited',
]);

const CAMERA_PERMISSION_TIMEOUT_MS = 12000;

/**
 * Resolves camera permission without hanging: check status first, time-box the
 * native request, then fall back to PermissionsAndroid on Android when needed.
 */
async function resolveCameraPermissionForDetector() {
  try {
    const current = Camera.getCameraPermissionStatus();
    if (VISION_CAMERA_GRANTED.has(current)) {
      return true;
    }
  } catch {
    // continue to request path
  }

  let result = null;
  try {
    result = await Promise.race([
      Camera.requestCameraPermission(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('camera-permission-timeout')),
          CAMERA_PERMISSION_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch {
    result = null;
  }

  if (result != null && VISION_CAMERA_GRANTED.has(result)) {
    return true;
  }

  if (Platform.OS === 'android') {
    try {
      const androidResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return androidResult === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }

  return false;
}

const hasRequiredLandmarks = face => {
  if (!face.landmarks) return false;
  const types = face.landmarks.map(l => l.type);
  return REQUIRED_LANDMARKS.every(r => types.includes(r));
};

const isFacePositionStable = (current, previous) => {
  if (!previous) return false;
  return (
    Math.abs(current.x - previous.x) < POSITION_TOLERANCE &&
    Math.abs(current.y - previous.y) < POSITION_TOLERANCE &&
    Math.abs(current.width - previous.width) < POSITION_TOLERANCE &&
    Math.abs(current.height - previous.height) < POSITION_TOLERANCE
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REAL QUALITY CHECKS
// Uses react-native-fs to read raw JPEG bytes, then jpeg-js to decode pixels,
// then computes:
//   1. Mean luminance  → brightness check
//   2. Laplacian variance → blur/sharpness check
//
// Install dependencies:
//   yarn add react-native-fs jpeg-js
//   cd ios && pod install
//
// Both libraries are pure-JS friendly (jpeg-js is 100% JS, RNFS uses native
// file reading but no UI bridging so it works safely on any thread).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute mean luminance of a grayscale/RGBA pixel array.
 * Samples every Nth pixel for performance.
 */
const computeBrightness = (data, step = 8) => {
  let sum = 0;
  let count = 0;
  // data is Uint8Array of [R, G, B, A, R, G, B, A, ...]
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Perceived luminance (ITU-R BT.709)
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    count++;
  }
  return count > 0 ? sum / count : 128;
};

/**
 * Compute Laplacian variance of a grayscale image.
 * Higher value = sharper image.
 * Laplacian kernel: [0,1,0, 1,-4,1, 0,1,0]
 *
 * Steps:
 *  1. Convert RGBA → grayscale
 *  2. Apply Laplacian convolution
 *  3. Compute variance of result
 *
 * Sampled on a downscaled grid (every `step` pixels) for performance.
 */
const computeLaplacianVariance = (data, width, height, step = 4) => {
  // Build grayscale grid (sampled)
  const gW = Math.floor(width / step);
  const gH = Math.floor(height / step);
  const gray = new Float32Array(gW * gH);

  for (let gy = 0; gy < gH; gy++) {
    for (let gx = 0; gx < gW; gx++) {
      const px = gx * step;
      const py = gy * step;
      const idx = (py * width + px) * 4;
      gray[gy * gW + gx] =
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
  }

  // Apply Laplacian and collect squared responses
  const lap = [];
  for (let gy = 1; gy < gH - 1; gy++) {
    for (let gx = 1; gx < gW - 1; gx++) {
      const center = gray[gy * gW + gx];
      const t = gray[(gy - 1) * gW + gx];
      const b = gray[(gy + 1) * gW + gx];
      const l = gray[gy * gW + (gx - 1)];
      const r = gray[gy * gW + (gx + 1)];
      // Laplacian response
      const response = Math.abs(t + b + l + r - 4 * center);
      lap.push(response);
    }
  }

  if (lap.length === 0) return 0;

  // Variance of Laplacian
  const mean = lap.reduce((a, v) => a + v, 0) / lap.length;
  const variance = lap.reduce((a, v) => a + (v - mean) ** 2, 0) / lap.length;
  return variance;
};

/** Same normalized percents as live `processFaceDetectionResult` (portrait + landscape photo). */
function faceBoundsToPercents(bounds, photoWidth, photoHeight) {
  let xPct = bounds.left / photoWidth;
  let yPct = bounds.top / photoHeight;
  let wPct = bounds.width / photoWidth;
  let hPct = bounds.height / photoHeight;

  if (photoWidth > photoHeight) {
    const vLeft = (photoWidth - photoHeight) / 2;
    xPct = Math.max(0, (bounds.left - vLeft) / photoHeight);
    const right = Math.min(
      1,
      (bounds.left + bounds.width - vLeft) / photoHeight,
    );
    yPct = Math.max(0, bounds.top / photoHeight);
    const bottom = Math.min(
      1,
      (bounds.top + bounds.height) / photoHeight,
    );
    wPct = right - xPct;
    hPct = bottom - yPct;
  }
  return {xPct, yPct, wPct, hPct};
}

/** Laplacian variance on a sub-rectangle (sharpness of the face region, not the background). */
function computeLaplacianVarianceInRect(
  data,
  width,
  height,
  rx,
  ry,
  rW,
  rH,
  step = 3,
) {
  const x0 = Math.max(0, Math.floor(rx));
  const y0 = Math.max(0, Math.floor(ry));
  const x1 = Math.min(width - 1, Math.ceil(rx + rW));
  const y1 = Math.min(height - 1, Math.ceil(ry + rH));
  const rw = x1 - x0;
  const rh = y1 - y0;
  if (rw < step * 5 || rh < step * 5) return 0;

  const gW = Math.floor(rw / step);
  const gH = Math.floor(rh / step);
  if (gW < 3 || gH < 3) return 0;

  const gray = new Float32Array(gW * gH);
  for (let gy = 0; gy < gH; gy++) {
    for (let gx = 0; gx < gW; gx++) {
      const px = Math.min(width - 1, x0 + gx * step);
      const py = Math.min(height - 1, y0 + gy * step);
      const idx = (py * width + px) * 4;
      gray[gy * gW + gx] =
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
  }

  const lap = [];
  for (let gy = 1; gy < gH - 1; gy++) {
    for (let gx = 1; gx < gW - 1; gx++) {
      const center = gray[gy * gW + gx];
      const t = gray[(gy - 1) * gW + gx];
      const b = gray[(gy + 1) * gW + gx];
      const l = gray[gy * gW + (gx - 1)];
      const r = gray[gy * gW + (gx + 1)];
      lap.push(Math.abs(t + b + l + r - 4 * center));
    }
  }
  if (lap.length === 0) return 0;
  const mean = lap.reduce((a, v) => a + v, 0) / lap.length;
  return lap.reduce((a, v) => a + (v - mean) ** 2, 0) / lap.length;
}

function normalizeFaceBounds(face) {
  const b = face.frame || face.bounds;
  if (!b) return null;
  const left = b.left ?? b.x ?? 0;
  const top = b.top ?? b.y ?? 0;
  const fw = b.width ?? 0;
  const fh = b.height ?? 0;
  return {left, top, width: fw, height: fh};
}

async function loadJpegRgba(uri) {
  const RNFS = require('react-native-fs');
  const jpeg = require('jpeg-js');
  const cleanPath = uri.replace(/^file:\/\//, '');
  const base64 = await RNFS.readFile(cleanPath, 'base64');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return jpeg.decode(bytes, {
    useTArray: true,
    formatAsRGBA: true,
    maxMemoryUsageInMB: 128,
  });
}

/** Brief pause so the checklist can update between steps. */
const yieldQualityUI = () => new Promise(r => setTimeout(r, 40));

/**
 * Main quality check (ML Kit + one JPEG decode).
 * Optional `onProgress({ step: 0..3, event: 'start'|'pass'|'fail' })` updates the live checklist.
 */
async function runQualityChecks(uri, opts = {}, onProgress) {
  const startedAt = Date.now();
  faceDebugLog('runQualityChecks:start', {
    uri,
    minFaceArea: opts.minFaceArea,
    maxFaceArea: opts.maxFaceArea,
  });
  const minArea = opts.minFaceArea ?? MIN_FACE_AREA;
  const maxArea = opts.maxFaceArea ?? MAX_FACE_AREA;

  const emit = async (step, event) => {
    if (onProgress) {
      await onProgress({step, event});
      await yieldQualityUI();
    }
  };

  await emit(0, 'start');
  let faces;
  try {
    faces = await FaceDetection.detect(uri, {
      landmarkMode: 'accurate',
      classificationMode: 'none',
      performanceMode: 'accurate',
    });
  } catch {
    await emit(0, 'fail');
    return {
      passed: false,
      reason: 'NO_FACE',
      brightness: 128,
      blurScore: 0,
    };
  }

  if (!faces?.length) {
    await emit(0, 'fail');
    return {passed: false, reason: 'NO_FACE', brightness: 128, blurScore: 0};
  }
  if (faces.length > 1) {
    await emit(0, 'fail');
    return {
      passed: false,
      reason: 'MULTIPLE_FACES',
      brightness: 128,
      blurScore: 0,
    };
  }

  const face = faces[0];
  if (!hasRequiredLandmarks(face) && face.landmarks) {
    await emit(0, 'fail');
    return {passed: false, reason: 'NO_FACE', brightness: 128, blurScore: 0};
  }
  await emit(0, 'pass');

  await emit(1, 'start');
  let data;
  let imgW;
  let imgH;
  try {
    const decoded = await loadJpegRgba(uri);
    data = decoded.data;
    imgW = decoded.width;
    imgH = decoded.height;
  } catch {
    await emit(1, 'fail');
    return {
      passed: false,
      reason: 'IMAGE_BLURRY',
      brightness: 128,
      blurScore: 0,
    };
  }

  const brightness = computeBrightness(data);
  if (brightness < MIN_BRIGHTNESS_THRESHOLD) {
    await emit(1, 'fail');
    return {passed: false, reason: 'TOO_DARK', brightness, blurScore: 0};
  }
  if (brightness > MAX_BRIGHTNESS_THRESHOLD) {
    await emit(1, 'fail');
    return {passed: false, reason: 'TOO_BRIGHT', brightness, blurScore: 0};
  }
  await emit(1, 'pass');

  await emit(2, 'start');
  const bounds = normalizeFaceBounds(face);
  if (!bounds || bounds.width < 8 || bounds.height < 8) {
    await emit(2, 'fail');
    return {passed: false, reason: 'PARTIAL_FACE', brightness, blurScore: 0};
  }

  const {xPct, yPct, wPct, hPct} = faceBoundsToPercents(bounds, imgW, imgH);

  if (
    xPct < QUALITY_FRAME_MARGIN ||
    xPct + wPct > 1 - QUALITY_FRAME_MARGIN ||
    yPct < QUALITY_FRAME_MARGIN ||
    yPct + hPct > 1 - QUALITY_FRAME_MARGIN
  ) {
    await emit(2, 'fail');
    return {
      passed: false,
      reason: 'PARTIAL_FACE',
      brightness,
      blurScore: 0,
    };
  }

  const cx = xPct + wPct / 2;
  const cy = yPct + hPct / 2;
  if (
    Math.abs(cx - 0.5) > QUALITY_CENTER_SLACK_X ||
    Math.abs(cy - 0.5) > QUALITY_CENTER_SLACK_Y
  ) {
    await emit(2, 'fail');
    return {
      passed: false,
      reason: 'NOT_CENTERED',
      brightness,
      blurScore: 0,
    };
  }

  const area = wPct * hPct;
  if (area < minArea) {
    await emit(2, 'fail');
    return {passed: false, reason: 'TOO_FAR', brightness, blurScore: 0};
  }
  if (area > maxArea) {
    await emit(2, 'fail');
    return {passed: false, reason: 'TOO_CLOSE', brightness, blurScore: 0};
  }

  const roll = face.rotationZ || 0;
  const pitch = face.rotationX || 0;
  const yaw = face.rotationY || 0;
  const TILT_TOLERANCE = 8;
  if (Math.abs(roll) > TILT_TOLERANCE) {
    await emit(2, 'fail');
    return {
      passed: false,
      reason: 'FACE_TILTED',
      brightness,
      blurScore: 0,
      tiltDirection: roll > 0 ? 'right' : 'left',
      angles: {roll, pitch, yaw},
    };
  }
  if (Math.abs(pitch) > TILT_TOLERANCE) {
    await emit(2, 'fail');
    return {
      passed: false,
      reason: 'FACE_TILTED',
      brightness,
      blurScore: 0,
      tiltDirection: pitch > 0 ? 'down' : 'up',
      angles: {roll, pitch, yaw},
    };
  }
  const YAW_TOLERANCE_STRICT = 10;
  if (Math.abs(yaw) > YAW_TOLERANCE_STRICT) {
    await emit(2, 'fail');
    return {
      passed: false,
      reason: 'FACE_TURNED',
      brightness,
      blurScore: 0,
      tiltDirection: yaw > 0 ? 'right' : 'left',
      angles: {roll, pitch, yaw},
    };
  }
  await emit(2, 'pass');

  await emit(3, 'start');
  const pad = 0.12;
  const rx = bounds.left - bounds.width * pad;
  const ry = bounds.top - bounds.height * pad;
  const rW = bounds.width * (1 + pad * 2);
  const rH = bounds.height * (1 + pad * 2);
  const blurScore = computeLaplacianVarianceInRect(
    data,
    imgW,
    imgH,
    rx,
    ry,
    rW,
    rH,
    3,
  );
  if (blurScore < BLUR_FACE_LAPLACIAN_THRESHOLD) {
    await emit(3, 'fail');
    return {
      passed: false,
      reason: 'IMAGE_BLURRY',
      brightness,
      blurScore,
    };
  }
  await emit(3, 'pass');
  const result = {passed: true, reason: null, brightness, blurScore};
  faceDebugLog('runQualityChecks:success', {
    elapsedMs: Date.now() - startedAt,
    brightness,
    blurScore,
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// FACE QUALITY MODAL
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  {key: 'face', icon: 'face', label: 'Checking face clarity…'},
  {key: 'light', icon: 'wb-sunny', label: 'Checking lighting…'},
  {key: 'tilt', icon: 'rotate-right', label: 'Checking face position…'},
  {
    key: 'sharpness',
    icon: 'center-focus-strong',
    label: 'Checking image sharpness…',
  },
];

const STEP_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  PASS: 'pass',
  FAIL: 'fail',
};

const FaceQualityModal = ({
  visible,
  photoUri,
  isDarkMode,
  onContinue,
  onRetake,
  instantResult = false,
  qualityOptions = null,
}) => {
  const {t} = useTranslation();
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;

  const [phase, setPhase] = useState('analyzing');
  const [failReason, setFail] = useState(null);
  const [stepStatuses, setStepStatuses] = useState(
    STEPS.map(() => STEP_STATUS.PENDING),
  );

  const cardSlide = useRef(new Animated.Value(80)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const stepAnims = useRef(
    STEPS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(16),
    })),
  ).current;

  const isMounted = useRef(true);
  const timers = useRef([]);

  const safe = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  const animateResult = useCallback(() => {
    Animated.sequence([
      Animated.timing(resultScale, {
        toValue: 1.15,
        duration: 260,
        easing: Easing.out(Easing.back(1.8)),
        useNativeDriver: true,
      }),
      Animated.timing(resultScale, {
        toValue: 1.0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [resultScale]);

  useEffect(() => {
    if (!visible || !photoUri) return;
    isMounted.current = true;

    // ── Reset ──────────────────────────────────────────────────────────────
    setPhase('analyzing');
    setFail(null);
    setStepStatuses(STEPS.map(() => STEP_STATUS.PENDING));
    cardSlide.setValue(80);
    cardOpacity.setValue(0);
    resultScale.setValue(0);
    stepAnims.forEach(a => {
      a.opacity.setValue(0);
      a.translateY.setValue(16);
    });

    const qOpts = qualityOptions && typeof qualityOptions === 'object' ? qualityOptions : {};

    // Registration / manual capture: one analysis pass, then go straight to result (no staged loader)
    if (instantResult) {
      cardSlide.setValue(0);
      cardOpacity.setValue(1);
      stepAnims.forEach(a => {
        a.opacity.setValue(1);
        a.translateY.setValue(0);
      });
      (async () => {
        const onProgress = async ({step, event}) => {
          if (!isMounted.current) return;
          setStepStatuses(prev => {
            const next = [...prev];
            if (event === 'start') {
              for (let i = 0; i < step; i++) next[i] = STEP_STATUS.PASS;
              next[step] = STEP_STATUS.RUNNING;
              for (let j = step + 1; j < STEPS.length; j++) {
                next[j] = STEP_STATUS.PENDING;
              }
            } else if (event === 'pass') {
              next[step] = STEP_STATUS.PASS;
            } else if (event === 'fail') {
              next[step] = STEP_STATUS.FAIL;
            }
            return next;
          });
        };
        const q = await runQualityChecks(photoUri, qOpts, onProgress);
        if (!isMounted.current) return;
        if (q.passed) {
          setPhase('success');
          animateResult();
          return;
        }
        setFail(q.reason);
        setPhase('failure');
        animateResult();
      })();

      return () => {
        isMounted.current = false;
        timers.current.forEach(clearTimeout);
        timers.current = [];
      };
    }

    Animated.parallel([
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    const qualityPromise = runQualityChecks(photoUri, qOpts);

    // ── Step runner: show progress while analysis runs; await result on first step only
    const runSteps = async () => {
      let qualityResult;
      for (let i = 0; i < STEPS.length; i++) {
        if (!isMounted.current) return;

        setStepStatuses(prev =>
          prev.map((s, idx) => (idx === i ? STEP_STATUS.RUNNING : s)),
        );

        await new Promise(resolve =>
          Animated.parallel([
            Animated.timing(stepAnims[i].opacity, {
              toValue: 1,
              duration: STEP_ROW_ANIM_MS,
              useNativeDriver: true,
            }),
            Animated.timing(stepAnims[i].translateY, {
              toValue: 0,
              duration: STEP_ROW_ANIM_MS,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(resolve),
        );

        await new Promise(resolve => safe(resolve, STEP_MIN_DURATION));
        if (!isMounted.current) return;

        if (qualityResult === undefined) {
          qualityResult = await qualityPromise;
        }
        if (!isMounted.current) return;

        // Map step index → which failure reason it covers
        // Step 0 (face clarity) → NO_FACE, MULTIPLE_FACES
        // Step 1 (lighting)     → TOO_DARK, TOO_BRIGHT
        // Step 2 (tilt)         → FACE_TILTED, FACE_TURNED
        // Step 3 (sharpness)    → IMAGE_BLURRY
        let stepResult = STEP_STATUS.PASS;
        if (!qualityResult.passed) {
          const r = qualityResult.reason;
          if (i === 0 && (r === 'NO_FACE' || r === 'MULTIPLE_FACES'))
            stepResult = STEP_STATUS.FAIL;
          if (i === 1 && (r === 'TOO_DARK' || r === 'TOO_BRIGHT'))
            stepResult = STEP_STATUS.FAIL;
          if (
            i === 2 &&
            (r === 'FACE_TILTED' ||
              r === 'FACE_TURNED' ||
              r === 'NOT_CENTERED' ||
              r === 'PARTIAL_FACE' ||
              r === 'TOO_FAR' ||
              r === 'TOO_CLOSE')
          )
            stepResult = STEP_STATUS.FAIL;
          if (i === 3 && r === 'IMAGE_BLURRY') stepResult = STEP_STATUS.FAIL;
        }

        setStepStatuses(prev =>
          prev.map((s, idx) => (idx === i ? stepResult : s)),
        );

        if (stepResult === STEP_STATUS.FAIL) {
          // Grey out remaining steps
          setStepStatuses(prev =>
            prev.map((s, idx) => (idx > i ? STEP_STATUS.PENDING : s)),
          );
          await new Promise(resolve => safe(resolve, 200));
          if (!isMounted.current) return;
          setFail(qualityResult.reason);
          setPhase('failure');
          animateResult();
          return;
        }
      }

      if (!isMounted.current) return;
      await new Promise(resolve => safe(resolve, 120));
      setPhase('success');
      animateResult();
    };

    runSteps();

    return () => {
      isMounted.current = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, photoUri, instantResult, qualityOptions, animateResult]);

  const getFailTitle = () => {
    switch (failReason) {
      case 'TOO_DARK':
        return t('Too Dark');
      case 'TOO_BRIGHT':
        return t('Too Bright');
      case 'IMAGE_BLURRY':
        return t('Image is Blurry');
      case 'NO_FACE':
        return t('Face Not Detected');
      case 'MULTIPLE_FACES':
        return t('Multiple Faces Detected');
      case 'FACE_TILTED':
        return t('Face is Tilted');
      case 'FACE_TURNED':
        return t('Face Turned');
      case 'NOT_CENTERED':
        return t('Face Not Centered');
      case 'PARTIAL_FACE':
        return t('Face Not Fully in Frame');
      case 'TOO_FAR':
        return t('Move closer');
      case 'TOO_CLOSE':
        return t('Move back');
      default:
        return t('Photo Quality Issue');
    }
  };

  const getFailSubtitle = () => {
    switch (failReason) {
      case 'TOO_DARK':
        return t('Move to a brighter area and retake your photo.');
      case 'TOO_BRIGHT':
        return t('Avoid strong light behind you and retake.');
      case 'IMAGE_BLURRY':
        return t('Hold your phone very steady and retake.');
      case 'NO_FACE':
        return t('Make sure your face is fully in frame and retake.');
      case 'MULTIPLE_FACES':
        return t('Only one person should be in the frame. Please retake.');
      case 'FACE_TILTED':
        return t('Please hold your face straight, not tilted.');
      case 'FACE_TURNED':
        return t('Please face the camera directly, not turned to the side.');
      case 'NOT_CENTERED':
        return t('Center your face in the circle and retake.');
      case 'PARTIAL_FACE':
        return t('Keep your full face inside the frame and retake.');
      case 'TOO_FAR':
        return t('Move a little closer so your face fills the frame.');
      case 'TOO_CLOSE':
        return t('Move back slightly so your whole face is visible.');
      default:
        return t('Please retake your photo for better quality.');
    }
  };

  const mStyles = modalStyles(isDarkMode, theme);

  const renderStepIcon = (s, step, size = 16) => {
    if (s === STEP_STATUS.RUNNING)
      return <ActivityIndicator size="small" color="#FFF" />;
    if (s === STEP_STATUS.PASS)
      return <Icon name="check" size={size} color="#FFF" />;
    if (s === STEP_STATUS.FAIL)
      return <Icon name="close" size={size} color="#FFF" />;
    return (
      <Icon
        name={step.icon}
        size={size}
        color={isDarkMode ? '#888' : '#BDBDBD'}
      />
    );
  };

  const stepLabelColor = s => {
    if (s === STEP_STATUS.PASS) return '#4ECDC4';
    if (s === STEP_STATUS.FAIL) return '#FF6B6B';
    if (s === STEP_STATUS.RUNNING) return theme.primaryTextColor;
    return isDarkMode ? '#555' : '#BDBDBD';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRetake}>
      <View style={mStyles.overlay}>
        <Animated.View
          style={[
            mStyles.card,
            {transform: [{translateY: cardSlide}], opacity: cardOpacity},
          ]}>
          {/* Thumbnail */}
          {!!photoUri && (
            <Image
              source={{uri: photoUri}}
              style={mStyles.thumbnail}
              resizeMode="cover"
            />
          )}

          {/* ── ANALYZING ── */}
          {phase === 'analyzing' && (
            <View style={mStyles.section}>
              <View style={mStyles.analyzingTitleRow}>
                <ActivityIndicator size="small" color="#4ECDC4" />
                <Text
                  style={[mStyles.title, {color: theme.primaryTextColor}]}>
                  {t('Analyzing your photo…')}
                </Text>
              </View>
              <Text
                style={[mStyles.subtitle, {color: theme.secondryTextColor}]}>
                {t('quality_check_live_hint')}
              </Text>
              <View style={mStyles.stepsContainer}>
                {STEPS.map((step, i) => {
                  const s = stepStatuses[i];
                  return (
                    <Animated.View
                      key={step.key}
                      style={[
                        mStyles.stepRow,
                        {
                          opacity: stepAnims[i].opacity,
                          transform: [{translateY: stepAnims[i].translateY}],
                        },
                      ]}>
                      <View
                        style={[
                          mStyles.stepIconWrap,
                          s === STEP_STATUS.PASS
                            ? mStyles.stepIconPass
                            : s === STEP_STATUS.FAIL
                            ? mStyles.stepIconFail
                            : s === STEP_STATUS.RUNNING
                            ? mStyles.stepIconRunning
                            : mStyles.stepIconPending,
                        ]}>
                        {renderStepIcon(s, step)}
                      </View>
                      <Text
                        style={[
                          mStyles.stepLabel,
                          {color: stepLabelColor(s)},
                          s === STEP_STATUS.RUNNING && {fontWeight: '700'},
                        ]}>
                        {t(step.label)}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── SUCCESS ── */}
          {phase === 'success' && (
            <View style={mStyles.section}>
              <Animated.View
                style={[
                  mStyles.resultIconWrap,
                  mStyles.resultIconSuccess,
                  {transform: [{scale: resultScale}]},
                ]}>
                <Icon name="check" size={wp(12)} color="#FFF" />
              </Animated.View>
              <Text
                style={[mStyles.resultTitle, {color: theme.primaryTextColor}]}>
                {t('Looking Good!')}
              </Text>
              <Text
                style={[
                  mStyles.resultSubtitle,
                  {color: theme.secondryTextColor},
                ]}>
                {t('Your photo is clear and ready to use.')}
              </Text>
              <View style={mStyles.stepsContainer}>
                {STEPS.map(step => (
                  <View key={step.key} style={mStyles.stepRow}>
                    <View style={[mStyles.stepIconWrap, mStyles.stepIconPass]}>
                      <Icon name="check" size={14} color="#FFF" />
                    </View>
                    <Text style={[mStyles.stepLabel, {color: '#4ECDC4'}]}>
                      {t(step.label.replace('…', ''))}
                    </Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={mStyles.continueBtn}
                onPress={onContinue}
                activeOpacity={0.85}>
                <Icon name="arrow-forward" size={20} color="#FFF" />
                <Text style={mStyles.continueBtnText}>{t('Continue')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── FAILURE ── */}
          {phase === 'failure' && (
            <View style={mStyles.section}>
              <Animated.View
                style={[
                  mStyles.resultIconWrap,
                  mStyles.resultIconFail,
                  {transform: [{scale: resultScale}]},
                ]}>
                <Icon name="close" size={wp(12)} color="#FFF" />
              </Animated.View>
              <Text
                style={[mStyles.resultTitle, {color: theme.primaryTextColor}]}>
                {getFailTitle()}
              </Text>
              <Text
                style={[
                  mStyles.resultSubtitle,
                  {color: theme.secondryTextColor},
                ]}>
                {getFailSubtitle()}
              </Text>
              <View style={mStyles.stepsContainer}>
                {STEPS.map((step, i) => {
                  const s = stepStatuses[i];
                  return (
                    <View key={step.key} style={mStyles.stepRow}>
                      <View
                        style={[
                          mStyles.stepIconWrap,
                          s === STEP_STATUS.PASS
                            ? mStyles.stepIconPass
                            : s === STEP_STATUS.FAIL
                            ? mStyles.stepIconFail
                            : mStyles.stepIconPending,
                        ]}>
                        {renderStepIcon(s, step, 14)}
                      </View>
                      <Text
                        style={[mStyles.stepLabel, {color: stepLabelColor(s)}]}>
                        {t(step.label.replace('…', ''))}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity
                style={mStyles.retakeBtn}
                onPress={onRetake}
                activeOpacity={0.85}>
                <Icon name="refresh" size={20} color="#FFF" />
                <Text style={mStyles.retakeBtnText}>{t('Retake Photo')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const modalStyles = (isDarkMode, theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.82)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    card: {
      width: '100%',
      backgroundColor:
        theme.backgroundColor || (isDarkMode ? '#1C1C1E' : '#FFFFFF'),
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingBottom: hp(5),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -4},
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 20,
    },
    thumbnail: {
      width: '100%',
      height: hp(22),
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    section: {
      paddingHorizontal: wp(6),
      paddingTop: hp(3),
      alignItems: 'center',
      width: '100%',
    },
    analyzingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2.5),
      width: '100%',
      marginBottom: hp(0.8),
      paddingHorizontal: wp(1),
    },
    title: {
      fontSize: wp(5),
      fontWeight: '700',
      textAlign: 'center',
      flexShrink: 1,
    },
    subtitle: {
      fontSize: wp(3.5),
      textAlign: 'center',
      marginBottom: hp(2.5),
      width: '100%',
      paddingHorizontal: wp(1),
      lineHeight: hp(2.6),
    },
    stepsContainer: {width: '100%', marginBottom: hp(3), gap: hp(1.4)},
    stepRow: {flexDirection: 'row', alignItems: 'center', gap: wp(3)},
    stepIconWrap: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepIconPending: {backgroundColor: isDarkMode ? '#2C2C2E' : '#F0F0F0'},
    stepIconRunning: {backgroundColor: '#4ECDC4'},
    stepIconPass: {backgroundColor: '#4ECDC4'},
    stepIconFail: {backgroundColor: '#FF6B6B'},
    stepLabel: {fontSize: wp(3.6), fontWeight: '500', flex: 1},
    resultIconWrap: {
      width: wp(22),
      height: wp(22),
      borderRadius: wp(11),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: hp(2),
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 10,
    },
    resultIconSuccess: {backgroundColor: '#4ECDC4', shadowColor: '#4ECDC4'},
    resultIconFail: {backgroundColor: '#FF6B6B', shadowColor: '#FF6B6B'},
    resultTitle: {
      fontSize: wp(5.5),
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: hp(0.8),
    },
    resultSubtitle: {
      fontSize: wp(3.6),
      textAlign: 'center',
      lineHeight: hp(2.8),
      marginBottom: hp(3),
      paddingHorizontal: wp(2),
    },
    continueBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4ECDC4',
      width: '100%',
      paddingVertical: hp(2),
      borderRadius: wp(3),
      gap: wp(2),
      shadowColor: '#4ECDC4',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    continueBtnText: {color: '#FFF', fontSize: wp(4.2), fontWeight: '700'},
    retakeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF6B6B',
      width: '100%',
      paddingVertical: hp(2),
      borderRadius: wp(3),
      gap: wp(2),
      shadowColor: '#FF6B6B',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    retakeBtnText: {color: '#FFF', fontSize: wp(4.2), fontWeight: '700'},
  });

// ─────────────────────────────────────────────────────────────────────────────
// FACE DETECTOR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const FaceDetector = forwardRef(
  (
    {
      containerStyle = {},
      cameraSize = null,
      borderColor = '#FF6B6B',
      readyBorderColor = '#4ECDC4',
      showStatusBadge = true,
      showCaptureButton = true,
      captureButtonText = '',
      captureButtonStyle = {},
      captureButtonTextStyle = {},
      onCapture = null,
      onStatusChange = null,
      onFaceReady = null,
      onReset = null,
      faceAreaConfig = {min: MIN_FACE_AREA, max: MAX_FACE_AREA},
      renderCustomStatus = null,
      renderCustomButtons = null,
      /** If true: no periodic/live face detection; user taps capture, then we validate the still photo */
      manualCaptureOnly = false,
      /** If true: quality modal skips staged steps and shows pass/fail as soon as checks finish */
      instantQualityCheck = false,
      /** If true: after manual capture, skip local FaceQualityModal and let parent handle validation (e.g. API) */
      skipPostCaptureQualityModal = false,
    },
    ref,
  ) => {
    const {t} = useTranslation();
    const {isDarkMode} = useSelector(s => s.theme);
    const {width: screenWidth, height: screenHeight} = useWindowDimensions();
    const responsiveCameraSize =
      cameraSize || Math.min(screenWidth * 0.92, screenHeight * 0.45);

    // ── State ─────────────────────────────────────────────────────────────────
    const [hasPermission, setHasPermission] = useState(false);
    const [isCheckingPermission, setIsCheckingPermission] = useState(true);
    const [photoUri, setPhotoUri] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [faceStatus, setFaceStatus] = useState(FACE_STATUS.WAITING_CAMERA);
    const [faceBounds, setFaceBounds] = useState(null);
    const [deviceOrientation, setDeviceOrientation] = useState('PORTRAIT');
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isStable, setIsStable] = useState(false);
    const [isAutoCaptured, setIsAutoCaptured] = useState(false);
    const [isDetectionRunning, setIsDetectionRunning] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [pendingPhotoUri, setPendingPhotoUri] = useState(null);
    const [pendingFace, setPendingFace] = useState(null);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const cameraRef = useRef(null);
    const borderAnim = useRef(new Animated.Value(0)).current;
    const captureAnim = useRef(new Animated.Value(0)).current;
    const scanAnim = useRef(new Animated.Value(0)).current;
    const detectionTimeoutRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const stablePositionStartTime = useRef(null);
    const lastFaceBounds = useRef(null);
    const autoCaptureTimeoutRef = useRef(null);

    // ── Imperative API ────────────────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          setPhotoUri(null);
          setIsAutoCaptured(false);
          setFaceStatus(FACE_STATUS.WAITING_CAMERA);
          setModalVisible(false);
          setPendingPhotoUri(null);
          setPendingFace(null);
          stablePositionStartTime.current = null;
          lastFaceBounds.current = null;
        },
        validateCapture: async () => {
          if (!photoUri) return {valid: false, error: 'No photo captured'};
          try {
            const faces = await FaceDetection.detect(photoUri, {
              landmarkMode: 'accurate',
              classificationMode: 'none',
              performanceMode: 'accurate',
            });
            if (!faces?.length) return {valid: false, error: 'NO_FACE'};
            if (faces.length > 1)
              return {valid: false, error: 'MULTIPLE_FACES'};
            const bounds = faces[0].frame;
            const area = (bounds.width * bounds.height) / (1280 * 720);
            if (area < 0.05) return {valid: false, error: 'FACE_TOO_SMALL'};
            if (!faces[0].landmarks || faces[0].landmarks.length < 2)
              return {valid: false, error: 'INCOMPLETE_FACE'};
            return {valid: true, error: null};
          } catch {
            return {valid: false, error: 'VALIDATION_ERROR'};
          }
        },
      }),
      [photoUri],
    );

    // ── Permissions ───────────────────────────────────────────────────────────
    useEffect(() => {
      let cancelled = false;
      (async () => {
        faceDebugLog('permission:init:start');
        setIsCheckingPermission(true);
        try {
          const ok = await resolveCameraPermissionForDetector();
          faceDebugLog('permission:init:resolved', {ok});
          if (!cancelled) setHasPermission(ok);
        } catch {
          faceDebugLog('permission:init:failed');
          if (!cancelled) setHasPermission(false);
        } finally {
          faceDebugLog('permission:init:done');
          if (!cancelled) setIsCheckingPermission(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []);

    const checkPermissions = async () => {
      faceDebugLog('permission:manual:start');
      setIsCheckingPermission(true);
      try {
        const ok = await resolveCameraPermissionForDetector();
        faceDebugLog('permission:manual:resolved', {ok});
        setHasPermission(ok);
      } catch {
        faceDebugLog('permission:manual:failed');
        setHasPermission(false);
      } finally {
        faceDebugLog('permission:manual:done');
        setIsCheckingPermission(false);
      }
    };

    // ── Orientation ───────────────────────────────────────────────────────────
    useEffect(() => {
      Orientation.lockToPortrait();
      Orientation.getDeviceOrientation((err, o) => {
        if (!err && o) setDeviceOrientation(o);
      });
      const listener = o => setDeviceOrientation(o);
      Orientation.addDeviceOrientationListener(listener);
      return () => {
        Orientation.removeDeviceOrientationListener(listener);
        // Keep portrait app-wide — do not unlock here (that allowed landscape after face scan)
        Orientation.lockToPortrait();
        clearTimeout(detectionTimeoutRef.current);
        clearTimeout(autoCaptureTimeoutRef.current);
      };
    }, []);

    // ── Camera device & best format ───────────────────────────────────────────
    const deviceCam = useCameraDevice('front');
    // eslint-disable-next-line no-unused-vars
    const selectedFormat = useMemo(() => {
      if (!deviceCam?.formats) return undefined;
      const square = deviceCam.formats.find(
        f => f.photoWidth === f.photoHeight,
      );
      if (square) return square;
      const target = 1280 * 720;
      return deviceCam.formats.reduce(
        (best, f) =>
          Math.abs(f.photoWidth * f.photoHeight - target) <
          Math.abs(best.photoWidth * best.photoHeight - target)
            ? f
            : best,
        deviceCam.formats[0],
      );
    }, [deviceCam]);

    // ── Camera init ───────────────────────────────────────────────────────────
    useEffect(() => {
      if (deviceCam && !photoUri) {
        faceDebugLog('camera:init:arming-ready-timer', {
          delayMs: CAMERA_INIT_DELAY,
          hasDevice: !!deviceCam,
          photoUriPresent: !!photoUri,
        });
        detectionTimeoutRef.current = setTimeout(
          () => {
            faceDebugLog('camera:init:ready-true');
            setIsCameraReady(true);
          },
          CAMERA_INIT_DELAY,
        );
      } else {
        faceDebugLog('camera:init:ready-false', {
          hasDevice: !!deviceCam,
          photoUriPresent: !!photoUri,
        });
        setIsCameraReady(false);
      }
      return () => clearTimeout(detectionTimeoutRef.current);
    }, [deviceCam, photoUri]);

    useEffect(() => {
      faceDebugLog('state:snapshot', {
        manualCaptureOnly,
        hasPermission,
        isCheckingPermission,
        isCameraReady,
        isProcessing,
        faceStatus,
        photoUriPresent: !!photoUri,
        modalVisible,
      });
    }, [
      manualCaptureOnly,
      hasPermission,
      isCheckingPermission,
      isCameraReady,
      isProcessing,
      faceStatus,
      photoUri,
      modalVisible,
    ]);

    // ── Border animation ──────────────────────────────────────────────────────
    useEffect(() => {
      const looksReady =
        faceStatus === FACE_STATUS.READY ||
        faceStatus === FACE_STATUS.CAMERA_PREVIEW;
      Animated.timing(borderAnim, {
        toValue: looksReady ? 1 : 0,
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    }, [faceStatus]);

    // ── Scan animation ────────────────────────────────────────────────────────
    const prevFaceStatus = useRef(faceStatus);
    useEffect(() => {
      if (!photoUri) {
        if (
          prevFaceStatus.current === FACE_STATUS.READY &&
          faceStatus !== FACE_STATUS.READY
        ) {
          scanAnim.stopAnimation();
          scanAnim.setValue(0);
        }
        scanAnim.setValue(0);
        Animated.loop(
          Animated.sequence([
            Animated.timing(scanAnim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(scanAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      } else {
        scanAnim.stopAnimation();
        scanAnim.setValue(0);
      }
      prevFaceStatus.current = faceStatus;
      return () => scanAnim.stopAnimation();
    }, [photoUri, faceStatus]);

    useEffect(() => {
      if (onStatusChange) onStatusChange(faceStatus, faceBounds);
    }, [faceStatus, faceBounds, onStatusChange]);
    useEffect(() => {
      if (onFaceReady && faceStatus === FACE_STATUS.READY)
        onFaceReady(faceBounds);
    }, [faceStatus, faceBounds, onFaceReady]);

    const playCaptureAnimation = useCallback(() => {
      Animated.sequence([
        Animated.timing(captureAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(captureAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, [captureAnim]);

    // ── Face detection processing ─────────────────────────────────────────────
    const processFaceDetectionResult = useCallback(
      (faces, photoWidth = 1280, photoHeight = 720) => {
        const isUpright = ['PORTRAIT', 'PORTRAIT_UP'].includes(
          deviceOrientation,
        );
        const reset = () => {
          setFaceBounds(null);
          setIsStable(false);
          stablePositionStartTime.current = null;
          lastFaceBounds.current = null;
        };

        if (!isUpright) {
          setFaceStatus(FACE_STATUS.DEVICE_NOT_UPRIGHT);
          reset();
          return;
        }
        if (!faces.length) {
          setFaceStatus(FACE_STATUS.NO_FACE);
          reset();
          return;
        }
        if (faces.length > 1) {
          setFaceStatus(FACE_STATUS.MULTIPLE_FACES);
          reset();
          return;
        }

        const face = faces[0];
        const bounds = face.frame;
        if (!bounds) {
          setFaceStatus(FACE_STATUS.NO_FACE);
          reset();
          return;
        }

        if (
          face.rotationZ != null &&
          Math.abs(face.rotationZ) > ANGLE_TOLERANCE
        ) {
          setFaceStatus(FACE_STATUS.FACE_TILTED);
          reset();
          return;
        }
        if (
          face.rotationX != null &&
          Math.abs(face.rotationX) > PITCH_TOLERANCE
        ) {
          setFaceStatus(FACE_STATUS.FACE_TILTED);
          reset();
          return;
        }
        if (
          face.rotationY != null &&
          Math.abs(face.rotationY) > YAW_TOLERANCE
        ) {
          setFaceStatus(FACE_STATUS.FACE_TURNED);
          reset();
          return;
        }
        if (!hasRequiredLandmarks(face) && face.landmarks) {
          setFaceStatus(FACE_STATUS.FACE_TURNED);
          reset();
          return;
        }

        let xPct = bounds.left / photoWidth;
        let yPct = bounds.top / photoHeight;
        let wPct = bounds.width / photoWidth;
        let hPct = bounds.height / photoHeight;

        if (photoWidth > photoHeight) {
          const vLeft = (photoWidth - photoHeight) / 2;
          xPct = Math.max(0, (bounds.left - vLeft) / photoHeight);
          const right = Math.min(
            1,
            (bounds.left + bounds.width - vLeft) / photoHeight,
          );
          yPct = Math.max(0, bounds.top / photoHeight);
          const bottom = Math.min(
            1,
            (bounds.top + bounds.height) / photoHeight,
          );
          wPct = right - xPct;
          hPct = bottom - yPct;
        }

        if (
          xPct < MARGIN ||
          xPct + wPct > 1 - MARGIN ||
          yPct < MARGIN ||
          yPct + hPct > 1 - MARGIN
        ) {
          setFaceStatus(FACE_STATUS.PARTIAL_FACE);
          setFaceBounds({x: xPct, y: yPct, width: wPct, height: hPct});
          setIsStable(false);
          stablePositionStartTime.current = null;
          lastFaceBounds.current = null;
          return;
        }

        const area = wPct * hPct;
        const minArea = faceAreaConfig?.min || MIN_FACE_AREA;
        const maxArea = faceAreaConfig?.max || MAX_FACE_AREA;
        if (area < minArea) {
          setFaceStatus(FACE_STATUS.TOO_FAR);
          setFaceBounds({x: xPct, y: yPct, width: wPct, height: hPct});
          reset();
          return;
        }
        if (area > maxArea) {
          setFaceStatus(FACE_STATUS.TOO_CLOSE);
          setFaceBounds({x: xPct, y: yPct, width: wPct, height: hPct});
          reset();
          return;
        }

        const current = {x: xPct, y: yPct, width: wPct, height: hPct};
        const stable = isFacePositionStable(current, lastFaceBounds.current);
        lastFaceBounds.current = current;

        if (stable || STABILITY_DURATION <= 0) {
          if (!stablePositionStartTime.current)
            stablePositionStartTime.current = Date.now();
          const elapsed = Date.now() - stablePositionStartTime.current;
          if (elapsed >= STABILITY_DURATION) {
            setIsStable(true);
            setFaceStatus(FACE_STATUS.READY);
            setFaceBounds(current);
            if (
              !manualCaptureOnly &&
              AUTO_CAPTURE_ENABLED &&
              onCapture &&
              !photoUri &&
              !isProcessing
            )
              triggerAutoCapture();
          } else {
            setIsStable(false);
            setFaceStatus(FACE_STATUS.STABILIZING);
            setFaceBounds(current);
          }
        } else {
          stablePositionStartTime.current = Date.now();
          setIsStable(false);
          setFaceStatus(FACE_STATUS.STABILIZING);
          setFaceBounds(current);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [deviceOrientation, faceAreaConfig, manualCaptureOnly, onCapture, photoUri],
    );

    // Manual mode: camera is ready → show preview state (no live ML)
    useEffect(() => {
      if (!manualCaptureOnly || photoUri || !isCameraReady) return;
      setFaceStatus(FACE_STATUS.CAMERA_PREVIEW);
    }, [manualCaptureOnly, isCameraReady, photoUri]);

    // ── Periodic detection ────────────────────────────────────────────────────
    useEffect(() => {
      if (
        manualCaptureOnly ||
        photoUri ||
        !cameraRef.current ||
        !isCameraReady
      ) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
        return;
      }
      const detect = async () => {
        if (
          !cameraRef.current ||
          isProcessing ||
          isDetectionRunning ||
          photoUri
        )
          return;
        setIsDetectionRunning(true);
        try {
          const photo = await cameraRef.current.takePhoto({
            flash: 'off',
            qualityPrioritization: 'speed',
            enableShutterSound: false,
          });
          const imagePath = processImagePath(photo.path);
          const faces = await FaceDetection.detect(imagePath, {
            landmarkMode: 'accurate',
            classificationMode: 'none',
            performanceMode: 'accurate',
          });
          if (faces.length === 1) {
            const {rotationZ: roll, rotationX: pitch} = faces[0];
            if (
              (roll != null && Math.abs(roll) > PHONE_ROTATED_ROLL_THRESHOLD) ||
              (pitch != null && Math.abs(pitch) > PHONE_ROTATED_PITCH_THRESHOLD)
            ) {
              setFaceStatus(FACE_STATUS.DEVICE_NOT_UPRIGHT);
              setFaceBounds(null);
              return;
            }
          }
          processFaceDetectionResult(faces, photo.width, photo.height);
        } catch {
          /* silently ignore */
        } finally {
          setIsDetectionRunning(false);
        }
      };
      detectionIntervalRef.current = setInterval(detect, DETECTION_INTERVAL);
      return () => {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      };
    }, [
      manualCaptureOnly,
      photoUri,
      isCameraReady,
      processFaceDetectionResult,
    ]);

    // ── Auto-capture ──────────────────────────────────────────────────────────
    const triggerAutoCapture = useCallback(async () => {
      if (manualCaptureOnly) return;
      if (isProcessing || photoUri || !cameraRef.current) return;
      try {
        setFaceStatus(FACE_STATUS.AUTO_CAPTURING);
        playCaptureAnimation();
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'quality',
          enableShutterSound: false,
        });
        setIsProcessing(true);
        const path = processImagePath(photo.path);
        const faces = await FaceDetection.detect(path, {
          landmarkMode: 'accurate',
          classificationMode: 'none',
          performanceMode: 'accurate',
        });
        if (faces.length > 0) {
          setPendingPhotoUri(path);
          setPendingFace(faces[0]);
          setPhotoUri(path);
          setIsAutoCaptured(true);
          if (skipPostCaptureQualityModal && onCapture) {
            onCapture(path, faces[0], true);
          } else {
            setModalVisible(true);
          }
        } else {
          setFaceStatus(FACE_STATUS.NO_FACE);
          stablePositionStartTime.current = null;
        }
      } catch {
        setFaceStatus(FACE_STATUS.READY);
        stablePositionStartTime.current = null;
      } finally {
        setIsProcessing(false);
      }
    }, [
      manualCaptureOnly,
      onCapture,
      photoUri,
      playCaptureAnimation,
      skipPostCaptureQualityModal,
    ]);

    // ── Manual capture ────────────────────────────────────────────────────────
    const takeSelfie = async () => {
      faceDebugLog('takeSelfie:attempt', {
        manualCaptureOnly,
        isProcessing,
        isCameraReady,
        faceStatus,
        photoUriPresent: !!photoUri,
      });
      if (!cameraRef.current || isProcessing) return;
      if (
        !manualCaptureOnly &&
        faceStatus !== FACE_STATUS.READY
      ) {
        Alert.alert(t('Cannot capture'), getStatusMessage());
        return;
      }
      if (manualCaptureOnly && !isCameraReady) {
        Alert.alert(t('Cannot capture'), t('Preparing camera...'));
        return;
      }
      try {
        setIsProcessing(true);
        if (manualCaptureOnly) {
          faceDebugLog('takeSelfie:single-shot:start');
          playCaptureAnimation();
          const photo = await cameraRef.current.takePhoto({
            flash: 'off',
            qualityPrioritization: 'quality',
            enableShutterSound: false,
          });
          const path = processImagePath(photo.path);
          faceDebugLog('takeSelfie:single-shot:captured', {path});
          setPendingPhotoUri(path);
          setPendingFace(null);
          setPhotoUri(path);
          if (skipPostCaptureQualityModal && onCapture) {
            onCapture(path, null, false);
          } else {
            setModalVisible(true);
          }
          return;
        }

        playCaptureAnimation();
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'quality',
          enableShutterSound: false,
        });
        const path = processImagePath(photo.path);
        const faces = await FaceDetection.detect(path, {
          landmarkMode: 'accurate',
          classificationMode: 'none',
          performanceMode: 'accurate',
        });
        if (faces.length > 1) {
          Alert.alert(
            t('Error'),
            t('Only one person should be in the photo. Please try again.'),
          );
        } else if (faces.length === 1) {
          setPendingPhotoUri(path);
          setPendingFace(faces[0]);
          setPhotoUri(path);
          if (skipPostCaptureQualityModal && onCapture) {
            onCapture(path, faces[0], false);
          } else {
            setModalVisible(true);
          }
        } else {
          Alert.alert(t('Error'), t('No face detected. Please try again.'));
        }
      } catch (err) {
        faceDebugLog('takeSelfie:error', {message: err?.message});
        Alert.alert(t('Error'), err.message || 'Capture error');
      } finally {
        faceDebugLog('takeSelfie:finally:set-processing-false');
        setIsProcessing(false);
      }
    };

    // ── Modal handlers ────────────────────────────────────────────────────────
    const handleModalContinue = useCallback(() => {
      setModalVisible(false);
      if (onCapture && pendingPhotoUri)
        onCapture(pendingPhotoUri, pendingFace, isAutoCaptured);
    }, [onCapture, pendingPhotoUri, pendingFace, isAutoCaptured]);

    const handleModalRetake = useCallback(() => {
      // Clear all states for a fresh start
      setModalVisible(false);
      setPhotoUri(null);
      setPendingPhotoUri(null);
      setPendingFace(null);
      setIsAutoCaptured(false);
      setIsProcessing(false);
      setFaceStatus(FACE_STATUS.WAITING_CAMERA);
      setFaceBounds(null);
      setIsCameraReady(false);
      setIsStable(false);
      setIsDetectionRunning(false);

      // Clear ref tracking
      stablePositionStartTime.current = null;
      lastFaceBounds.current = null;

      // Reset detection interval
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }

      // Trigger parent reset if provided
      if (onReset) onReset();
    }, [onReset]);

    const removeImage = () => {
      setPhotoUri(null);
      setIsAutoCaptured(false);
      stablePositionStartTime.current = null;
      lastFaceBounds.current = null;
      if (onReset) onReset();
    };

    const retakePhoto = () => {
      setPhotoUri(null);
      setIsAutoCaptured(false);
      stablePositionStartTime.current = null;
      lastFaceBounds.current = null;
      setFaceStatus(FACE_STATUS.WAITING_CAMERA);
      if (onReset) onReset();
    };

    // ── Status helpers ────────────────────────────────────────────────────────
    const getStatusMessage = useCallback(() => {
      switch (faceStatus) {
        case FACE_STATUS.WAITING_CAMERA:
          return t('Preparing camera...');
        case FACE_STATUS.NO_FACE:
          return t('No face detected');
        case FACE_STATUS.TOO_FAR:
          return t('Move closer');
        case FACE_STATUS.TOO_CLOSE:
          return t('Move back');
        case FACE_STATUS.MULTIPLE_FACES:
          return t('Only one face allowed');
        case FACE_STATUS.PARTIAL_FACE:
          return t('Keep your face fully in frame');
        case FACE_STATUS.DEVICE_NOT_UPRIGHT:
          return t('Please hold your phone upright');
        case FACE_STATUS.FACE_TILTED:
          return t('Please hold your face straight');
        case FACE_STATUS.FACE_TURNED:
          return t('Please face the camera directly');
        case FACE_STATUS.STABILIZING:
          return t('Hold still - capturing...');
        case FACE_STATUS.AUTO_CAPTURING:
          return t('Auto-capturing...');
        case FACE_STATUS.TOO_DARK:
          return t('Too dark - need more light');
        case FACE_STATUS.TOO_BRIGHT:
          return t('Too bright - find softer lighting');
        case FACE_STATUS.IMAGE_BLURRY:
          return t('Image is blurry - hold steady');
        case FACE_STATUS.READY:
          return AUTO_CAPTURE_ENABLED
            ? t('Hold steady for auto-capture')
            : t('Face ready - tap to capture');
        case FACE_STATUS.CAMERA_PREVIEW:
          return t('When ready, tap capture to take your photo');
        default:
          return t('Position your face in the frame');
      }
    }, [faceStatus, t]);

    const getStatusColor = useCallback(() => {
      switch (faceStatus) {
        case FACE_STATUS.CAMERA_PREVIEW:
        case FACE_STATUS.READY:
          return readyBorderColor;
        case FACE_STATUS.AUTO_CAPTURING:
        case FACE_STATUS.STABILIZING:
          return '#4ECDC4';
        case FACE_STATUS.NO_FACE:
          return '#FF6B6B';
        case FACE_STATUS.TOO_DARK:
        case FACE_STATUS.TOO_BRIGHT:
        case FACE_STATUS.IMAGE_BLURRY:
        case FACE_STATUS.DEVICE_NOT_UPRIGHT:
        case FACE_STATUS.FACE_TILTED:
        case FACE_STATUS.FACE_TURNED:
          return '#FFA726';
        default:
          return '#FFA726';
      }
    }, [faceStatus, readyBorderColor]);

    const styles = dynamicStyles(
      isDarkMode,
      responsiveCameraSize,
      borderColor,
      readyBorderColor,
    );
    const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
    const isCaptureEnabled = manualCaptureOnly
      ? isCameraReady && !isProcessing && !photoUri
      : faceStatus === FACE_STATUS.READY && !isProcessing && !photoUri;

    const qualityModalOpts = useMemo(
      () => ({
        minFaceArea: faceAreaConfig?.min ?? MIN_FACE_AREA,
        maxFaceArea: faceAreaConfig?.max ?? MAX_FACE_AREA,
      }),
      [faceAreaConfig?.min, faceAreaConfig?.max],
    );

    // ── Early returns ─────────────────────────────────────────────────────────
    if (isCheckingPermission) {
      return (
        <View
          style={[
            styles.container,
            containerStyle,
            {backgroundColor: theme.backgroundColor},
          ]}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primaryColor} />
            <Text style={styles.loadingText}>
              {t('Checking camera permissions...')}
            </Text>
          </View>
        </View>
      );
    }

    if (!hasPermission) {
      return (
        <View
          style={[
            styles.container,
            containerStyle,
            {backgroundColor: theme.backgroundColor},
          ]}>
          <View style={styles.centerContent}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: '#FF6B6B',
                  padding: wp(4),
                  borderRadius: responsiveCameraSize / 2,
                },
              ]}>
              <Icon name="camera-off" size={50} color="#FFF" />
            </View>
            <Text style={styles.permissionTitle}>
              {t('Camera Access Required')}
            </Text>
            <Text style={styles.permissionText}>
              {t('Camera access is required for face verification.')}
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={checkPermissions}>
              <Text style={styles.permissionButtonText}>
                {t('Grant Permission')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!deviceCam) {
      return (
        <View
          style={[
            styles.container,
            containerStyle,
            {backgroundColor: theme.backgroundColor},
          ]}>
          <View style={styles.centerContent}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: '#FFA726',
                  padding: wp(4),
                  borderRadius: responsiveCameraSize / 2,
                },
              ]}>
              <Icon name="error-outline" size={50} color="#FFF" />
            </View>
            <Text style={styles.errorText}>
              {t('Front camera not available')}
            </Text>
          </View>
        </View>
      );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
      <View
        style={[
          styles.container,
          containerStyle,
          {backgroundColor: theme.backgroundColor},
        ]}>
        <FaceQualityModal
          visible={modalVisible}
          photoUri={pendingPhotoUri}
          isDarkMode={isDarkMode}
          onContinue={handleModalContinue}
          onRetake={handleModalRetake}
          instantResult={instantQualityCheck}
          qualityOptions={qualityModalOpts}
        />

        <Animated.View
          style={[
            styles.cameraContainer,
            {
              borderColor: borderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [borderColor, readyBorderColor],
              }),
            },
          ]}>
          {photoUri ? (
            <Image source={{uri: photoUri}} style={styles.previewImage} />
          ) : (
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={deviceCam}
              // In manual burst mode, keep camera active while processing shots
              isActive={!photoUri && (!isProcessing || manualCaptureOnly)}
              photo
              audio={false}
              photoOrientation="portrait"
            />
          )}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.capturePulse,
              {
                borderColor: readyBorderColor,
                transform: [
                  {
                    scale: captureAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2.0],
                    }),
                  },
                ],
                opacity: captureAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.75, 0],
                }),
              },
            ]}
          />

          {!photoUri &&
            faceStatus !== FACE_STATUS.READY &&
            faceStatus !== FACE_STATUS.CAMERA_PREVIEW && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  height: responsiveCameraSize,
                  transform: [
                    {
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          -responsiveCameraSize,
                          responsiveCameraSize,
                        ],
                      }),
                    },
                  ],
                  opacity: scanAnim.interpolate({
                    inputRange: [0, 0.15, 0.85, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                },
              ]}>
              <View
                style={[
                  styles.scanLineInner,
                  {height: 2, top: responsiveCameraSize / 2 - 1},
                ]}
              />
            </Animated.View>
          )}

          {!photoUri && (
            <View style={styles.cornerContainer}>
              {[
                'cornerTopLeft',
                'cornerTopRight',
                'cornerBottomLeft',
                'cornerBottomRight',
              ].map(pos => (
                <Animated.View
                  key={pos}
                  style={[
                    styles.corner,
                    styles[pos],
                    (faceStatus === FACE_STATUS.READY ||
                      faceStatus === FACE_STATUS.CAMERA_PREVIEW) &&
                      styles.cornerReady,
                    (faceStatus === FACE_STATUS.READY ||
                      faceStatus === FACE_STATUS.CAMERA_PREVIEW) && {
                      transform: [{scale: 1.1}],
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {renderCustomStatus ? (
          renderCustomStatus({
            faceStatus,
            photoUri,
            getStatusMessage,
            getStatusColor,
          })
        ) : (
          <>
            {showStatusBadge && !photoUri && (
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: getStatusColor()},
                  ]}>
                  <Icon
                    name={
                      faceStatus === FACE_STATUS.READY ||
                      faceStatus === FACE_STATUS.CAMERA_PREVIEW
                        ? 'check-circle'
                        : 'info'
                    }
                    size={16}
                    color="#FFF"
                  />
                  <Text style={styles.statusText}>{getStatusMessage()}</Text>
                </View>
              </View>
            )}
            {photoUri && !modalVisible && (
              <View style={styles.capturedBadgeContainer}>
                <View style={styles.successBadge}>
                  <Icon name="check-circle" size={18} color="#FFF" />
                  <Text style={styles.successText}>{t('Image captured')}</Text>
                </View>
              </View>
            )}
            {!photoUri &&
              faceStatus !== FACE_STATUS.READY &&
              faceStatus !== FACE_STATUS.CAMERA_PREVIEW && (
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionTitle}>{t('Tips')}</Text>
                {[
                  {icon: 'wb-sunny', text: t('Good lighting helps detection')},
                  {
                    icon: 'center-focus-strong',
                    text: t('Keep your face centered'),
                  },
                  {icon: 'face', text: t('Face the camera directly')},
                ].map(({icon, text}) => (
                  <View key={icon} style={styles.instructionItem}>
                    <Icon
                      name={icon}
                      size={16}
                      style={styles.instructionIcon}
                    />
                    <Text style={styles.instructionText}>{text}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {renderCustomButtons ? (
          renderCustomButtons({
            photoUri,
            isProcessing,
            isCaptureEnabled,
            takeSelfie,
            removeImage,
            confirmCapture: handleModalContinue,
            retakePhoto,
            isAutoCaptured,
            manualCaptureOnly,
          }) ?? null
        ) : (
          <>
            {photoUri && isAutoCaptured && !isProcessing && !modalVisible && (
              <View style={styles.autoCaptureButtonsContainer}>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={retakePhoto}>
                  <Icon name="refresh" size={20} color="#666" />
                  <Text style={styles.retakeButtonText}>{t('Retake')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// FACE DETECTOR STYLES
// ─────────────────────────────────────────────────────────────────────────────
const dynamicStyles = (
  isDarkMode,
  cameraSize,
  borderColor,
  readyBorderColor,
) => {
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  return StyleSheet.create({
    container: {alignItems: 'center'},
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(4),
    },
    cameraContainer: {
      width: cameraSize,
      height: cameraSize,
      borderRadius: cameraSize / 2,
      overflow: 'hidden',
      borderWidth: wp(1),
      backgroundColor: '#000',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    camera: {width: '100%', height: '100%'},
    previewImage: {width: '100%', height: '100%'},
    capturePulse: {
      position: 'absolute',
      left: '4%',
      right: '4%',
      top: '4%',
      bottom: '4%',
      borderRadius: 9999,
      borderWidth: wp(1.4),
      backgroundColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    scanLine: {
      position: 'absolute',
      left: wp(3),
      right: wp(3),
      top: 0,
      backgroundColor: 'transparent',
    },
    scanLineInner: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: readyBorderColor,
      borderRadius: 1,
      shadowColor: readyBorderColor,
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0.8,
      shadowRadius: 8,
    },
    cornerContainer: {...StyleSheet.absoluteFillObject, padding: wp(2)},
    corner: {
      position: 'absolute',
      width: wp(7),
      height: wp(7),
      borderColor: readyBorderColor,
      opacity: 0.7,
    },
    cornerTopLeft: {
      top: wp(1.5),
      left: wp(1.5),
      borderTopWidth: wp(1),
      borderLeftWidth: wp(1),
      borderTopLeftRadius: wp(4),
    },
    cornerTopRight: {
      top: wp(1.5),
      right: wp(1.5),
      borderTopWidth: wp(1),
      borderRightWidth: wp(1),
      borderTopRightRadius: wp(4),
    },
    cornerBottomLeft: {
      bottom: wp(1.5),
      left: wp(1.5),
      borderBottomWidth: wp(1),
      borderLeftWidth: wp(1),
      borderBottomLeftRadius: wp(4),
    },
    cornerBottomRight: {
      bottom: wp(1.5),
      right: wp(1.5),
      borderBottomWidth: wp(1),
      borderRightWidth: wp(1),
      borderBottomRightRadius: wp(4),
    },
    cornerReady: {borderColor: '#4ECDC4', opacity: 1},
    statusContainer: {alignItems: 'center', marginTop: hp(1.5)},
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(0.8),
      borderRadius: wp(6),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    statusText: {
      color: '#FFF',
      fontSize: wp(2.8),
      fontWeight: '600',
      marginLeft: wp(1.5),
    },
    captureButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryColor,
      paddingHorizontal: wp(6),
      paddingVertical: hp(1.5),
      borderRadius: wp(8),
      marginTop: hp(2),
      minWidth: wp(50),
      shadowColor: theme.primaryColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    captureButtonText: {color: '#FFF', fontSize: wp(3.5), fontWeight: '600'},
    buttonDisabled: {
      backgroundColor: isDarkMode ? '#4a4a4a' : '#b0b0b0',
      shadowOpacity: 0,
      elevation: 0,
    },
    loadingText: {
      marginTop: hp(2),
      fontSize: wp(4),
      color: theme.primaryTextColor,
      fontWeight: '500',
    },
    permissionTitle: {
      fontSize: wp(5),
      fontWeight: '700',
      color: theme.primaryTextColor,
      marginTop: hp(2),
      marginBottom: hp(1),
      textAlign: 'center',
    },
    permissionText: {
      fontSize: wp(3.8),
      color: theme.secondryTextColor,
      textAlign: 'center',
      lineHeight: hp(2.5),
      marginBottom: hp(3),
    },
    permissionButton: {
      backgroundColor: theme.primaryColor,
      paddingVertical: hp(1.8),
      paddingHorizontal: wp(8),
      borderRadius: 30,
      shadowColor: theme.primaryColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    permissionButtonText: {color: '#FFF', fontSize: wp(4), fontWeight: '600'},
    errorText: {
      fontSize: wp(4.5),
      color: theme.primaryTextColor,
      marginTop: hp(2),
      textAlign: 'center',
    },
    instructionContainer: {
      backgroundColor: theme.cardBackground,
      padding: wp(3),
      borderRadius: wp(4),
      marginTop: hp(1.5),
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    instructionTitle: {
      fontSize: wp(3.5),
      fontWeight: '700',
      color: theme.primaryTextColor,
      marginBottom: hp(1),
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(0.5),
    },
    instructionIcon: {color: theme.primaryColor, marginRight: wp(1.5)},
    instructionText: {
      fontSize: wp(2.8),
      color: theme.secondryTextColor,
      flex: 1,
    },
    capturedBadgeContainer: {alignItems: 'center', marginTop: hp(1.5)},
    successBadge: {
      backgroundColor: '#4ECDC4',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: wp(7),
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#4ECDC4',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    successText: {
      color: '#FFF',
      fontSize: wp(2.8),
      fontWeight: '600',
      marginLeft: wp(1.5),
    },
    autoCaptureButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: hp(2),
      gap: wp(3),
    },
    retakeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E9ECEF',
      paddingHorizontal: wp(5),
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
      minWidth: wp(30),
    },
    retakeButtonText: {
      color: '#333',
      fontSize: wp(3.5),
      fontWeight: '600',
      marginLeft: wp(1.5),
    },
    continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: wp(5),
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
      minWidth: wp(30),
    },
    continueButtonText: {
      color: '#FFF',
      fontSize: wp(3.5),
      fontWeight: '600',
      marginLeft: wp(1.5),
    },
  });
};

export default FaceDetector;
