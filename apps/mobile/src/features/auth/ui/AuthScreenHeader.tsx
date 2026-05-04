import { StyleSheet, View } from 'react-native';

import type { AppLocale } from '@/i18n/locale';
import { LocaleSwitcher } from '@/i18n/ui/LocaleSwitcher';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type AuthScreenHeaderProps = {
  caption: string;
  description: string;
  languageLabel: string;
  locale: AppLocale;
  title: string;
  onSelectLocale: (locale: AppLocale) => void;
};

export function AuthScreenHeader({
  caption,
  description,
  languageLabel,
  locale,
  title,
  onSelectLocale
}: AuthScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <AppText variant="caption">{caption}</AppText>
        <LocaleSwitcher
          compact
          currentLocale={locale}
          label={languageLabel}
          onSelectLocale={onSelectLocale}
        />
      </View>
      <AppText variant="title">{title}</AppText>
      <AppText variant="muted">{description}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  }
});
