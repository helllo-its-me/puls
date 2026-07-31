import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/i18n/LocalizationProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

export function AuthLoadingScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.loading}>
        <AppText variant="sectionTitle">{t('auth.loading')}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg
  }
});
