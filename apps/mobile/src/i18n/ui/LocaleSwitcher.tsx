import { Pressable, StyleSheet, View } from 'react-native';

import { appLocales, type AppLocale } from '@/i18n/locale';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type LocaleSwitcherProps = {
  compact?: boolean;
  currentLocale: AppLocale;
  label: string;
  onSelectLocale: (locale: AppLocale) => void;
};

type LocaleOption = {
  label: string;
  value: AppLocale;
};

const localeOptions: readonly LocaleOption[] = [
  {
    label: 'EN',
    value: appLocales.en
  },
  {
    label: 'RU',
    value: appLocales.ru
  }
] as const;

export function LocaleSwitcher({
  compact = false,
  currentLocale,
  label,
  onSelectLocale
}: LocaleSwitcherProps) {
  return (
    <View style={[styles.container, compact ? styles.containerCompact : undefined]}>
      {compact ? null : <AppText variant="caption">{label}</AppText>}
      <View style={[styles.control, compact ? styles.controlCompact : undefined]}>
        {localeOptions.map((option) => {
          const isActive = option.value === currentLocale;

          return (
            <Pressable
              key={option.value}
              style={[
                styles.option,
                compact ? styles.optionCompact : undefined,
                isActive ? styles.optionActive : undefined
              ]}
              onPress={() => {
                onSelectLocale(option.value);
              }}
            >
              <AppText variant={isActive ? 'buttonDark' : 'captionStrong'}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md
  },
  containerCompact: {
    alignSelf: 'flex-start'
  },
  control: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface
  },
  controlCompact: {
    padding: 2,
    backgroundColor: colors.surfaceMuted
  },
  option: {
    minWidth: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center'
  },
  optionCompact: {
    minWidth: 38,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm
  },
  optionActive: {
    backgroundColor: colors.accent
  }
});
