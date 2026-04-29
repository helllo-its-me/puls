import { appLocales, type AppLocale } from '@/i18n/locale';

import { enTranslations, ruTranslations, type TranslationDictionary, type TranslationKey } from '@/i18n/dictionaries';

const translationsByLocale: Record<AppLocale, TranslationDictionary> = {
  [appLocales.en]: enTranslations,
  [appLocales.ru]: ruTranslations
};

export type Translate = (key: TranslationKey) => string;

export function createTranslator(locale: AppLocale): Translate {
  const dictionary = translationsByLocale[locale];

  return (key) => dictionary[key];
}
