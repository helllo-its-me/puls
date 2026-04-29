import { describe, expect, it } from 'vitest';

import { appLocales, getIntlLocale, isAppLocale, normalizeAppLocale } from '../../apps/mobile/src/i18n/locale.js';
import { createTranslator } from '../../apps/mobile/src/i18n/translation.js';

describe('i18n locale helpers', () => {
  it('recognizes supported locales', () => {
    expect(isAppLocale('en')).toBe(true);
    expect(isAppLocale('ru')).toBe(true);
    expect(isAppLocale('de')).toBe(false);
  });

  it('normalizes runtime locale strings into supported app locales', () => {
    expect(normalizeAppLocale('ru-RU')).toBe(appLocales.ru);
    expect(normalizeAppLocale('ru')).toBe(appLocales.ru);
    expect(normalizeAppLocale('en-US')).toBe(appLocales.en);
    expect(normalizeAppLocale('fr-FR')).toBe(appLocales.en);
  });

  it('returns matching Intl locale identifiers', () => {
    expect(getIntlLocale(appLocales.en)).toBe('en-US');
    expect(getIntlLocale(appLocales.ru)).toBe('ru-RU');
  });
});

describe('translator', () => {
  it('returns translations for both supported locales', () => {
    const enTranslator = createTranslator(appLocales.en);
    const ruTranslator = createTranslator(appLocales.ru);

    expect(enTranslator('language.switch.label')).toBe('Language');
    expect(ruTranslator('language.switch.label')).toBe('Язык');
    expect(ruTranslator('profile.content.focusArea.sleep.label')).toBe('Ритм сна');
  });
});
