// AlertService.js
import i18n from '../Translations/i18n';

export const showLocalizedAlert = (
  response,
  showAlert,
  type = 'success',
  defaultMsg,
) => {
  const language = i18n.language || 'en';
  let message = '';

  // Try to safely stringify the response for logging
  try {
    if (typeof response === 'string') {
      console.log('Response in showLocalizedAlert (string):', response);
      message = response;
    } else if (response) {
      console.log('Response in showLocalizedAlert (object):', response);
      // First check top-level keys
      message =
        language === 'es'
          ? response?.message_es || response?.message || defaultMsg
          : response?.message_en || response?.message || defaultMsg;
    }
  } catch (e) {
    console.log('Error logging response:', e.message);
    message = 'An error occurred';
  }

  if (!message) {
    message = language === 'es' ? 'Ocurrió un error' : 'Error occurred';
  }

  showAlert(message, type);
};
