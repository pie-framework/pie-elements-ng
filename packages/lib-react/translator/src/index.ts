// @ts-nocheck
/**
 * @synced-from pie-lib/packages/translator/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import i18next, { type i18n, type TOptions } from 'i18next';
import en from './en';
import es from './es';

i18next.init({
  fallbackLng: 'en',
  lng: 'en',
  debug: true,
  resources: {
    en: en,
    es: es,
  },
});


interface Translator extends i18n {
  t: (key: string, options: TOptions) => string;
}

interface TranslatorModule {
  translator: Translator;
  languageOptions: Array<{ value: string; label: string }>;
}

const translatorModule: TranslatorModule = {
  translator: {
    ...i18next,
    t: (key, options) => {
      const { lng } = options;

      switch (lng) {
        // these keys don't work with plurals, don't know why, so I added a workaround to convert them to the correct lng
        case 'en_US':
        case 'en-US':
          options.lng = 'en';
          break;
        case 'es_ES':
        case 'es-ES':
        case 'es_MX':
        case 'es-MX':
          options.lng = 'es';
          break;
        default:
          break;
      }
      return i18next.t(key, { lng, ...options });
    },
  },
  languageOptions: [
    { value: 'en_US', label: 'English (US)' },
    { value: 'es_ES', label: 'Spanish' },
  ],
};

export default translatorModule;
