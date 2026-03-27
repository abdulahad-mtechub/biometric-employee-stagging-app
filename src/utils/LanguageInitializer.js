import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {getLocales} from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../Translations/i18n';
import {setLanguage} from '../redux/Slices/authSlice';

const LANGUAGE_STORAGE_KEY = 'app-language-initialized';

const LanguageInitializer = () => {
  const dispatch = useDispatch();
  const language = useSelector(store => store.auth.language);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        if (language) {
          // Apply existing language to i18n
          const langCode =
            language === 'Español' || language === 'Spanish' ? 'es' : 'en';
          i18n.changeLanguage(langCode);
          return;
        }

        const languageInitialized = await AsyncStorage.getItem(
          LANGUAGE_STORAGE_KEY,
        );

        if (!languageInitialized) {
          const locales = getLocales();
          const deviceLang = locales[0]?.languageCode || 'en';

          const selectedLanguage = deviceLang === 'es' ? 'Spanish' : 'English';
          const langCode = deviceLang === 'es' ? 'es' : 'en';

          dispatch(setLanguage(selectedLanguage));
          i18n.changeLanguage(langCode);
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'true');
        }
      } catch (error) {
        console.error('Language initialization error:', error);
        dispatch(setLanguage('English'));
        i18n.changeLanguage('en');
      }
    };

    initializeLanguage();
  }, [dispatch, language]);

  // Sync i18n on language changes
  useEffect(() => {
    if (language) {
      const langCode =
        language === 'Español' || language === 'Spanish' ? 'es' : 'en';
      i18n.changeLanguage(langCode);
    }
  }, [language]);

  return null;
};

export default LanguageInitializer;
