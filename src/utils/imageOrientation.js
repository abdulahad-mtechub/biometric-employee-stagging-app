/**
 * Image Orientation Utility - Face Detection Based
 *
 * Uses ML Kit face detection to determine if the face is upright or rotated,
 * then corrects the rotation if needed.
 *
 * @module utils/imageOrientation
 */

import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import FaceDetection from '@react-native-ml-kit/face-detection';

/**
 * In-memory cache for downloaded images
 * @type {Map<string, {localPath: string, timestamp: number}>}
 */
const downloadCache = new Map();

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generates a simple hash from a URL string.
 * @param {string} url
 * @returns {string}
 */
const generateUrlHash = url => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // keep 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Returns the local cache file path for a given image URI.
 * @param {string} imageUri
 * @param {string} [cacheDir]
 * @returns {string}
 */
const getLocalFilePath = (imageUri, cacheDir) => {
  const baseDir = cacheDir || RNFS.CachesDirectoryPath;
  const hash = generateUrlHash(imageUri);
  const extension = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
  return `${baseDir}/img_${hash}.${extension}`;
};

/**
 * Returns true if the cached file exists and is within the TTL window.
 * @param {string} localPath
 * @returns {Promise<boolean>}
 */
const isCacheValid = async localPath => {
  try {
    const stat = await RNFS.stat(localPath);
    const age = Date.now() - new Date(stat.mtime).getTime();
    return age < CACHE_TTL;
  } catch {
    return false;
  }
};

/**
 * Downloads a remote image to a local path.
 * @param {string} url
 * @param {string} localPath
 * @returns {Promise<string>} Resolved local path
 */
const downloadImage = async (url, localPath) => {
  const result = await RNFS.downloadFile({
    fromUrl: url,
    toFile: localPath,
    background: true,
    discretionary: true,
  }).promise;

  if (result.statusCode !== 200) {
    throw new Error(
      `Failed to download image. HTTP status: ${result.statusCode}`,
    );
  }

  return localPath;
};

/**
 * Reads the pixel dimensions of an image at the given local path.
 * @param {string} filePath  Bare path (no file:// prefix)
 * @returns {Promise<{width: number, height: number}>}
 */
const getImageDimensions = filePath =>
  new Promise((resolve, reject) => {
    const {Image} = require('react-native');
    Image.getSize(
      `file://${filePath}`,
      (width, height) => resolve({width, height}),
      reject,
    );
  });

/**
 * Runs ML Kit face detection on a local image.
 * @param {string} localPath  Bare path (no file:// prefix)
 * @returns {Promise<Array>} Array of detected face objects
 */
const detectFaces = async localPath => {
  const mlKitUri = `file://${localPath}`;
  console.log('[FACE] Running face detection on:', mlKitUri);

  try {
    const faces = await FaceDetection.detect(mlKitUri, {
      detectLandmarks: true, // required for eye-position checks
      detectContours: false,
      classifyGender: false,
      classifyEmotions: false,
      tracking: false,
    });

    console.log('[FACE] Faces detected:', faces.length);

    if (faces.length > 0) {
      const f = faces[0];
      console.log('[FACE] bounds:', JSON.stringify(f.bounds));
      console.log('[FACE] rollAngle:', f.rollAngle, '  yawAngle:', f.yawAngle);

      if (f.landmarks) {
        for (const lm of f.landmarks) {
          console.log(
            `[FACE]   landmark ${lm.type}:`,
            JSON.stringify(lm.position),
          );
        }
      } else {
        console.log('[FACE] landmarks: none returned');
      }
    }

    return faces;
  } catch (err) {
    console.error('[FACE] Detection error:', err.message);
    return [];
  }
};

/**
 * Rotates a local image by `degrees` and writes the result to the cache dir.
 *
 * ImageResizer expects a URI with the file:// prefix for local files.
 *
 * @param {string} localPath   Bare path (no file:// prefix)
 * @param {number} degrees     Rotation in degrees (e.g. 90, 270)
 * @returns {Promise<string|null>} Bare path to the rotated file, or null on failure
 */
const rotateImage = async (localPath, degrees) => {
  const sourceName = localPath.split('/').pop();
  const nameWithoutExt = sourceName.replace(/\.[^/.]+$/, '');
  const ext = sourceName.split('.').pop();
  const destPath = `${RNFS.CachesDirectoryPath}/${nameWithoutExt}_rotated${degrees}.${ext}`;

  console.log(`[ROTATE] Rotating ${degrees}°:`, localPath);

  try {
    // ImageResizer needs the file:// scheme for local paths
    const sourceUri = localPath.startsWith('file://')
      ? localPath
      : `file://${localPath}`;

    const result = await ImageResizer.createResizedImage(
      sourceUri,
      1280, // maxWidth
      1280, // maxHeight
      'JPEG',
      80, // quality
      degrees,
      null, // outputPath — let the library choose, we move it below
      false,
      {mode: 'contain', onlyScaleDown: true, forceSquare: false},
    );

    console.log('[ROTATE] Library wrote to:', result.uri);

    // The library may write to a temp path; move it to our desired destination.
    const resultPath = result.uri.replace('file://', '');
    if (resultPath !== destPath) {
      if (await RNFS.exists(resultPath)) {
        await RNFS.moveFile(resultPath, destPath);
      }
    }

    const exists = await RNFS.exists(destPath);
    console.log('[ROTATE] Destination file exists:', exists, destPath);
    return exists ? destPath : null;
  } catch (err) {
    console.error('[ROTATE] Rotation failed:', err.message);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Orientation logic
// ---------------------------------------------------------------------------

/**
 * Decides the correction rotation needed based on ML Kit's rollAngle.
 *
 * ML Kit reports rollAngle in degrees relative to the image's coordinate
 * system. A face that is upright in the scene reads near 0°. Phones held
 * in landscape orientations produce roll angles near ±90° or ±180°.
 *
 * We map those buckets to the counter-clockwise rotation needed to make
 * the face upright:
 *
 *   rollAngle ~  +90° → phone rotated CCW (landscape-left)  → rotate 270° to correct
 *   rollAngle ~ -90°  → phone rotated CW  (landscape-right) → rotate  90° to correct
 *   rollAngle ~ ±180° → phone upside-down                   → rotate 180° to correct
 *
 * @param {number} rollAngle
 * @returns {number} Degrees to rotate (90 | 180 | 270), or 0 if already upright
 */
const correctionDegreesForRoll = rollAngle => {
  const abs = Math.abs(rollAngle);

  if (abs <= 20) {
    // Already upright (or nearly so)
    return 0;
  }

  if (abs >= 160) {
    // Upside-down
    return 180;
  }

  // Landscape — determine which way
  return rollAngle > 0 ? 270 : 90;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ImageOrientationResult
 * @property {'UPRIGHT_SELFIE'|'ROTATED_SELFIE'|'NO_FACE_DETECTED'} assessment
 * @property {number}      faceRollAngle   Roll angle reported by ML Kit (degrees)
 * @property {number}      faceYawAngle    Yaw angle reported by ML Kit (degrees)
 * @property {number}      facesDetected   Total faces found
 * @property {string}      originalUri     The URI passed in
 * @property {string}      imagePath       Bare local path of the (possibly cached) original
 * @property {string|null} correctedUri    Bare local path of the rotation-corrected copy, or null
 * @property {number}      width           Image pixel width
 * @property {number}      height          Image pixel height
 */

/**
 * Analyses `imageUri`, detects whether the face is upright, and — if it is
 * rotated — produces a corrected copy rotated to upright.
 *
 * @param {string} imageUri  Remote URL or local path (with or without file://)
 * @returns {Promise<ImageOrientationResult>}
 */
export const getImageOrientation = async imageUri => {
  if (!imageUri || typeof imageUri !== 'string') {
    throw new Error('Invalid imageUri: must be a non-empty string');
  }

  let localPath = ''; // always bare path, no file:// prefix

  try {
    // ------------------------------------------------------------------
    // 1. Resolve to a local file
    // ------------------------------------------------------------------
    if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      // Check in-memory cache first, then disk cache
      const cached = downloadCache.get(imageUri);
      if (cached && (await isCacheValid(cached.localPath))) {
        localPath = cached.localPath;
        console.log('[CACHE] Using in-memory cached path:', localPath);
      } else {
        // FIX: pass no cacheDir so getLocalFilePath uses RNFS.CachesDirectoryPath
        localPath = getLocalFilePath(imageUri);
        if (!(await isCacheValid(localPath))) {
          await downloadImage(imageUri, localPath);
        } else {
          console.log('[CACHE] Using disk-cached file:', localPath);
        }
        downloadCache.set(imageUri, {localPath, timestamp: Date.now()});
      }
    } else {
      // Local URI — strip the file:// scheme so we have a bare path throughout
      localPath = imageUri.startsWith('file://')
        ? imageUri.slice('file://'.length)
        : imageUri;
    }

    if (!(await RNFS.exists(localPath))) {
      throw new Error(`Image file not found: ${localPath}`);
    }

    // ------------------------------------------------------------------
    // 2. Gather info
    // ------------------------------------------------------------------
    const {width, height} = await getImageDimensions(localPath);
    const faces = await detectFaces(localPath);

    // ------------------------------------------------------------------
    // 3. Determine orientation
    // ------------------------------------------------------------------
    let assessment = 'NO_FACE_DETECTED';
    let faceRollAngle = 0;
    let faceYawAngle = 0;
    let correctionDegrees = 0;

    if (faces.length > 0) {
      const face = faces[0];
      faceRollAngle = face.rollAngle ?? 0;
      faceYawAngle = face.yawAngle ?? 0;

      const hasValidBounds = !!(face.bounds?.width && face.bounds?.height);
      const landmarks = Array.isArray(face.landmarks) ? face.landmarks : [];
      const hasLandmarks = landmarks.length > 0;

      console.log('[ORIENTATION] roll:', faceRollAngle, ' yaw:', faceYawAngle);
      console.log(
        '[ORIENTATION] hasValidBounds:',
        hasValidBounds,
        ' hasLandmarks:',
        hasLandmarks,
      );

      if (hasValidBounds && hasLandmarks) {
        // ----------------------------------------------------------------
        // Primary path: use ML Kit roll angle to determine correction.
        //
        // FIX: removed the secondary `height <= width` gate that was
        // incorrectly overriding an already-correct isUpright determination
        // for square/landscape images that genuinely contain an upright face.
        // ----------------------------------------------------------------
        correctionDegrees = correctionDegreesForRoll(faceRollAngle);

        // Extra sanity: if the eye positions are clearly vertical (i.e. one
        // eye is directly above the other) the image is definitely rotated,
        // regardless of what rollAngle says.
        const leftEye = landmarks.find(l => l.type === 'leftEye');
        const rightEye = landmarks.find(l => l.type === 'rightEye');

        if (leftEye && rightEye && correctionDegrees === 0) {
          const dx = Math.abs(rightEye.position.x - leftEye.position.x);
          const dy = Math.abs(rightEye.position.y - leftEye.position.y);
          if (dy > dx) {
            // Eyes are more vertical than horizontal → face is on its side
            console.log(
              '[ORIENTATION] Eye positions indicate lateral rotation; overriding to 270°',
            );
            correctionDegrees = 270;
          }
        }

        assessment =
          correctionDegrees === 0 ? 'UPRIGHT_SELFIE' : 'ROTATED_SELFIE';
      } else {
        // ----------------------------------------------------------------
        // Fallback: no reliable ML Kit data — use aspect ratio heuristic.
        // Portrait images (height > width) are assumed upright.
        // ----------------------------------------------------------------
        console.log(
          '[ORIENTATION] Insufficient ML Kit data — falling back to aspect ratio',
        );
        const isPortrait = height > width;
        assessment = isPortrait ? 'UPRIGHT_SELFIE' : 'ROTATED_SELFIE';
        correctionDegrees = isPortrait ? 0 : 270;
      }
    }

    // ------------------------------------------------------------------
    // 4. Log summary
    // ------------------------------------------------------------------
    console.log('========================================');
    console.log('[IMAGE ANALYSIS] URI:             ', imageUri);
    console.log('[IMAGE ANALYSIS] Dimensions:      ', `${width}x${height}`);
    console.log('[IMAGE ANALYSIS] Faces detected:  ', faces.length);
    if (faces.length > 0) {
      console.log('[IMAGE ANALYSIS] Roll angle:      ', faceRollAngle + '°');
      console.log('[IMAGE ANALYSIS] Yaw angle:       ', faceYawAngle + '°');
      console.log(
        '[IMAGE ANALYSIS] Correction needed:',
        correctionDegrees + '°',
      );
    }
    console.log('[IMAGE ANALYSIS] ASSESSMENT:      ', assessment);
    console.log('========================================');

    // ------------------------------------------------------------------
    // 5. Correct rotation if required
    // ------------------------------------------------------------------
    let correctedUri = null;

    if (assessment === 'ROTATED_SELFIE' && correctionDegrees > 0) {
      console.log(`[ROTATE] Correcting by ${correctionDegrees}°…`);
      const rotatedPath = await rotateImage(localPath, correctionDegrees);
      if (rotatedPath) {
        correctedUri = rotatedPath;
        console.log('[ROTATE] Corrected image saved to:', correctedUri);
      } else {
        console.warn(
          '[ROTATE] Rotation returned null — correctedUri will be null',
        );
      }
    }

    return {
      assessment,
      faceRollAngle,
      faceYawAngle,
      facesDetected: faces.length,
      originalUri: imageUri,
      imagePath: localPath,
      correctedUri,
      width,
      height,
    };
  } catch (err) {
    const msg = err.message || 'Unknown error';
    console.error('[IMAGE ANALYSIS] Error for', imageUri, ':', msg);
    throw new Error(`Failed to analyse image: ${msg}`);
  }
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Compresses a local image for upload (max 1280px, 80% JPEG quality).
 *
 * @param {string} sourcePath  Bare local path (no file:// prefix)
 * @param {string} [outputDir] Directory for the output file; defaults to CachesDirectoryPath
 * @returns {Promise<string>}  Path to compressed file (falls back to sourcePath on error)
 */
export const compressImageForUpload = async (sourcePath, outputDir) => {
  const baseDir = outputDir || RNFS.CachesDirectoryPath;
  const sourceName = sourcePath.split('/').pop();
  const baseName = sourceName.replace(/\.[^/.]+$/, '');
  const destPath = `${baseDir}/${baseName}_compressed.jpg`;

  console.log('[COMPRESS] Compressing:', sourcePath);

  try {
    // FIX: ImageResizer needs the file:// scheme for local files
    const sourceUri = sourcePath.startsWith('file://')
      ? sourcePath
      : `file://${sourcePath}`;

    const result = await ImageResizer.createResizedImage(
      sourceUri,
      1280,
      1280,
      'JPEG',
      80,
      0, // no rotation
      null,
      false,
      {mode: 'contain', onlyScaleDown: true, forceSquare: false},
    );

    console.log('[COMPRESS] Library result:', result.uri);

    const resultPath = result.uri.replace('file://', '');
    if (resultPath !== destPath && (await RNFS.exists(resultPath))) {
      await RNFS.moveFile(resultPath, destPath);
    }

    const exists = await RNFS.exists(destPath);
    return exists ? destPath : sourcePath;
  } catch (err) {
    console.error('[COMPRESS] Failed:', err.message);
    return sourcePath; // graceful fallback
  }
};

/**
 * Clears the in-memory download cache.
 */
export const clearImageCache = () => {
  downloadCache.clear();
};

export default getImageOrientation;
