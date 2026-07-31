import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/i18n/LocalizationProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

export function DashboardScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <AppText variant="title">{t('dashboard.screen.title')}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  }
});
