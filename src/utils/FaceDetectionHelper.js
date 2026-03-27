import FaceDetection from '@react-native-ml-kit/face-detection';
import {getImageOrientation, rotateImage} from './imageOrientation';
import RNFS from 'react-native-fs';

/**
 * Try face detection with different rotations when no face is found
 * This handles cases where the server rotates the image
 * Returns the rotation that makes the most sense based on face detection
 */
const detectWithRotations = async (localPath) => {
  const rotations = [90, 0, 270, 180]; // Start with 90° since that's common
  const results = [];

  for (const degrees of rotations) {
    try {
      let testPath = localPath;

      // If rotation needed, create rotated version
      if (degrees > 0) {
        testPath = await rotateImage(localPath, degrees);
        if (!testPath) continue;
      }

      const uri = `file://${testPath}`;
      const faces = await FaceDetection.detect(uri, {
        landmarkMode: 'none',
        classificationMode: 'none',
        performanceMode: 'accurate',
      });

      console.log(
        `[FaceDetectionHelper] Rotation ${degrees}°: ${faces?.length || 0} faces`,
      );

      if (faces && faces.length > 0) {
        results.push({degrees, faces, path: testPath});
      }
    } catch (err) {
      console.log(`[FaceDetectionHelper] Rotation ${degrees}° failed:`, err.message);
    }
  }

  if (results.length === 0) return null;

  // If only one rotation found a face, use that
  if (results.length === 1) return results[0];

  // Multiple rotations found faces - this happens when server compresses the image
  // Prioritize 90° since that's the common server rotation issue
  const preferred = results.find(r => r.degrees === 90);
  if (preferred) {
    console.log('[FaceDetectionHelper] Multiple rotations found, preferring 90° (server rotation)');
    return preferred;
  }

  // Fallback to first result
  return results[0];
};

/**
 * Check if an image URL contains a human face
 * Handles server-side image rotation by trying multiple orientations
 *
 * @param {string} imageUrl - The URL of the image to check
 * @param {Object} options - Detection options
 * @param {boolean} options.singleFace - If true, returns false if multiple faces detected (default: true)
 * @returns {Promise<{hasFace: boolean, faceCount: number, faces: Array, error: string|null, orientation: object|null}>}
 */
export const checkImageForFace = async (imageUrl, options = {}) => {
  const {singleFace = true} = options;

  try {
    if (!imageUrl) {
      return {
        hasFace: false,
        faceCount: 0,
        faces: [],
        error: 'Image URL is required',
      };
    }

    console.log('[FaceDetectionHelper] Checking image URL:', imageUrl);

    // First try: Use imageOrientation utility
    const orientationResult = await getImageOrientation(imageUrl);

    let faceCount = orientationResult.facesDetected || 0;
    console.log(
      '[FaceDetectionHelper] Initial detection:',
      faceCount,
      'Assessment:',
      orientationResult.assessment,
    );

    // If no face found initially, try detecting with different rotations
    // This handles cases where server rotates the image
    if (faceCount === 0 && orientationResult.imagePath) {
      console.log(
        '[FaceDetectionHelper] No face detected in initial check, trying rotation detection...',
      );
      const rotatedResult = await detectWithRotations(orientationResult.imagePath);

      if (rotatedResult) {
        console.log(
          `[FaceDetectionHelper] Found face at rotation ${rotatedResult.degrees}°`,
        );

        // If face was found at 0° but initial detection failed, it means
        // the initial detection failed due to server processing issues
        // but the image is actually valid - use original URL
        if (rotatedResult.degrees === 0) {
          console.log('[FaceDetectionHelper] Face found at 0° - using original URL');
          return {
            hasFace: true,
            faceCount: rotatedResult.faces.length,
            faces: rotatedResult.faces,
            error: null,
            orientation: orientationResult,
          };
        }

        // If rotation needed (90/180/270), upload corrected image
        console.log(
          `[FaceDetectionHelper] Face detected at ${rotatedResult.degrees}° - rotation needed`,
        );
        return {
          hasFace: true,
          faceCount: rotatedResult.faces.length,
          faces: rotatedResult.faces,
          error: null,
          orientation: {
            ...orientationResult,
            assessment: 'ROTATED_SELFIE',
            correctionDegrees: rotatedResult.degrees,
            correctedUri: rotatedResult.path,
          },
        };
      }
    }

    if (faceCount === 0) {
      return {
        hasFace: false,
        faceCount: 0,
        faces: [],
        error: null,
      };
    }

    if (singleFace && faceCount > 1) {
      return {
        hasFace: false,
        faceCount,
        faces: [],
        error: 'Multiple faces detected',
      };
    }

    return {
      hasFace: true,
      faceCount,
      faces: [],
      error: null,
      orientation: orientationResult,
    };
  } catch (error) {
    console.log('[FaceDetectionHelper] Error:', error.message);
    return {
      hasFace: false,
      faceCount: 0,
      faces: [],
      error: error.message || 'Face detection failed',
    };
  }
};

/**
 * Check if image contains exactly one face (strict validation)
 * @param {string} imageUrl - The URL of the image to check
 * @returns {Promise<boolean>}
 */
export const hasSingleFace = async (imageUrl) => {
  const result = await checkImageForFace(imageUrl, { singleFace: true });
  return result.hasFace;
};

/**
 * Check if image contains at least one face
 * @param {string} imageUrl - The URL of the image to check
 * @returns {Promise<boolean>}
 */
export const hasAnyFace = async (imageUrl) => {
  const result = await checkImageForFace(imageUrl, { singleFace: false });
  return result.hasFace;
};

export default checkImageForFace;
