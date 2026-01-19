import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enUS from './en-us.json'
import ptBR from './pt-br.json'
import esMX from './es-mx.json'

const resources = {
  'en-US': { translation: enUS },
  'pt-BR': { translation: ptBR },
  'es-MX': { translation: esMX },
}

i18n.use(initReactI18next).init({
  resources,
  lng: navigator.language || 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
