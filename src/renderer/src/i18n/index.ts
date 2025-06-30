import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from '../locales/en_US/translation.json'
import viVN from '../locales/vi_VN/translation.json'

export const supportedLanguages = [
  { code: 'en_US', name: 'English', flag: '🇺🇸' },
  { code: 'vi_VN', name: 'Tiếng Việt', flag: '🇻🇳' }
] as const

export type LanguageCode = typeof supportedLanguages[number]['code']

const resources = {
  en_US: {
    translation: enUS
  },
  vi_VN: {
    translation: viVN
  }
}

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en_US',
    fallbackLng: 'en_US',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    react: {
      useSuspense: false
    }
  })

export default i18n