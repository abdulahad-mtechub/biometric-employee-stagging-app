import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json'; // Rename sp.json to es.json for clarity

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // For React Native
    lng: 'en',               // default language
    fallbackLng: 'en',       // fallback language
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    interpolation: {
      escapeValue: false, // not needed for React
    },
  });

export default i18n;
