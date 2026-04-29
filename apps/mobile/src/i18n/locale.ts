export const appLocales = {
  en: 'en',
  ru: 'ru'
} as const;

export type AppLocale = typeof appLocales[keyof typeof appLocales];

export function isAppLocale(value: string): value is AppLocale {
  return value === appLocales.en || value === appLocales.ru;
}

export function normalizeAppLocale(locale: string): AppLocale {
  if (locale.toLowerCase().startsWith(appLocales.ru)) {
    return appLocales.ru;
  }

  return appLocales.en;
}

export function detectAppLocale(): AppLocale {
  return normalizeAppLocale(Intl.DateTimeFormat().resolvedOptions().locale);
}

export function getIntlLocale(locale: AppLocale): string {
  if (locale === appLocales.ru) {
    return 'ru-RU';
  }

  return 'en-US';
}
