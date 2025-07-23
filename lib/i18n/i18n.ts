import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en';
import frTranslation from './locales/fr';

// Create a new i18n instance
const i18n = i18next.createInstance();

// Define translations inline to avoid import issues
// These would typically be imported from separate files

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      fr: {
        translation: frTranslation
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    }
  })
  .then(() => {
    console.log('i18n initialized successfully');
    console.log('i18n.changeLanguage available:', typeof i18n.changeLanguage === 'function');
  })
  .catch(err => {
    console.error('i18n initialization failed:', err);
  });

// Add debugging to check i18n state
console.log('i18n instance created:', !!i18n);
console.log('i18n methods available:', Object.keys(i18n));

export default i18n;
