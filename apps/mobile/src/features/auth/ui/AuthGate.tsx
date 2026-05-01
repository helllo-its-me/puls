import { View, StyleSheet } from 'react-native';

import { AuthScreen } from '@/features/auth/ui/AuthScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileScreen } from '@/features/profile/ui/ProfileScreen';
import { useTranslation } from '@/i18n/LocalizationProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

function AuthLoadingState() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.loading}>
        <AppText variant="sectionTitle">{t('auth.loading')}</AppText>
      </View>
    </Screen>
  );
}

export function AuthGate() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <AuthLoadingState />;
  }

  if (!auth.session) {
    return <AuthScreen />;
  }

  return <ProfileScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg
  }
});
