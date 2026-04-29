import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { detectAppLocale, isAppLocale, type AppLocale } from '@/i18n/locale';
import { createTranslator, type Translate } from '@/i18n/translation';

const appLocaleStorageKey = 'app-locale';

type LocalizationContextValue = {
  locale: AppLocale;
  t: Translate;
  setLocale: (locale: AppLocale) => Promise<void>;
};

const defaultLocale = detectAppLocale();

const LocalizationContext = createContext<LocalizationContextValue>({
  locale: defaultLocale,
  t: createTranslator(defaultLocale),
  setLocale: async () => undefined
});

export function LocalizationProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>(detectAppLocale);

  useEffect(() => {
    async function loadStoredLocale() {
      const storedLocale = await AsyncStorage.getItem(appLocaleStorageKey);

      if (storedLocale && isAppLocale(storedLocale)) {
        setLocaleState(storedLocale);
      }
    }

    void loadStoredLocale();
  }, []);

  const value = useMemo<LocalizationContextValue>(() => ({
    locale,
    t: createTranslator(locale),
    setLocale: async (nextLocale) => {
      setLocaleState(nextLocale);
      await AsyncStorage.setItem(appLocaleStorageKey, nextLocale);
    }
  }), [locale]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useTranslation(): LocalizationContextValue {
  return useContext(LocalizationContext);
}
