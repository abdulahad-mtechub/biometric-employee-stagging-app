import {Platform} from 'react-native';
import {API_BASE_URL} from '../Constants/Base_URL';

export const CHECK_LABELS = {
  face_tilt: 'Face tilt',
  face_position: 'Face position',
  image_sharpness: 'Sharpness',
  lighting: 'Lighting',
  face_clarity: 'Face clarity',
  face_size: 'Face size',
};

export const formatCheckLabel = key =>
  CHECK_LABELS[key] ||
  String(key).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export async function validateImageQuality(uri) {
  const fileUri =
    Platform.OS === 'android' && uri && !uri.startsWith('file://')
      ? `file://${uri}`
      : uri;
  const formData = new FormData();
  formData.append('image', {
    uri: fileUri,
    type: 'image/jpeg',
    name: 'face_quality.jpg',
  });
  const response = await fetch(`${API_BASE_URL}image-quality/validate`, {
    method: 'POST',
    body: formData,
  });
  const text = await response.text();
  try {
    return {ok: response.ok, status: response.status, body: JSON.parse(text)};
  } catch {
    return {
      ok: false,
      status: response.status,
      body: null,
      rawText: text,
    };
  }
}

/**
 * Map /image-quality/validate response into modal payload + path to use on Continue.
 * @param {(key: string) => string} t - i18next t
 */
export function mapImageQualityApiToModalState(result, uploadPath, t) {
  if (!result.body) {
    return {parseFailed: true};
  }
  const {error, message, data} = result.body;
  if (error === true || result.ok === false) {
    return {
      parseFailed: false,
      qualityPayload: {
        overall_valid: false,
        checks: data?.checks ?? null,
        serverMessage: message || t('Quality check failed'),
      },
      pendingPath: null,
    };
  }
  const payload = data ?? {overall_valid: false, checks: {}};
  return {
    parseFailed: false,
    qualityPayload: payload,
    pendingPath: payload.overall_valid ? uploadPath : null,
  };
}
