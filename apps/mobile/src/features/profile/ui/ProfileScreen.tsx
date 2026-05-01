import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { useProfileQuery } from '@/features/profile/hooks/use-profile-query';
import { useTranslation } from '@/i18n/LocalizationProvider';
import { LocaleSwitcher } from '@/i18n/ui/LocaleSwitcher';
import { ApiError } from '@/lib/api/api-error';
import { ProfileFocusAreaList } from '@/features/profile/ui/ProfileFocusAreaList';
import { ProfileHero } from '@/features/profile/ui/ProfileHero';
import { ProfileHighlights } from '@/features/profile/ui/ProfileHighlights';
import { ProfileQuickActions } from '@/features/profile/ui/ProfileQuickActions';
import { ProfileSectionHeader } from '@/features/profile/ui/ProfileSectionHeader';
import { ProfileSummaryCard } from '@/features/profile/ui/ProfileSummaryCard';
import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

function ProfileLoadingState() {
  const { t } = useTranslation();

  return (
    <ProfileSurfaceCard>
      <AppText variant="sectionTitle">{t('profile.loading.title')}</AppText>
      <AppText variant="muted">{t('profile.loading.description')}</AppText>
    </ProfileSurfaceCard>
  );
}

type ProfileErrorStateProps = {
  onRetry: () => void;
};

function ProfileErrorState({ onRetry }: ProfileErrorStateProps) {
  const { t } = useTranslation();

  return (
    <ProfileSurfaceCard>
      <AppText variant="sectionTitle">{t('profile.error.title')}</AppText>
      <AppText variant="muted">{t('profile.error.description')}</AppText>
      <Button label={t('profile.error.retry')} onPress={onRetry} />
    </ProfileSurfaceCard>
  );
}

export function ProfileScreen() {
  const auth = useAuth();
  const profileQuery = useProfileQuery();
  const { locale, setLocale, t } = useTranslation();

  useEffect(() => {
    const error = profileQuery.error;

    if (!(error instanceof ApiError) || error.status !== 401) {
      return;
    }

    void auth.logout();
  }, [auth, profileQuery.error]);

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTopRow}>
            <AppText variant="caption">{t('profile.screen.caption')}</AppText>
            <LocaleSwitcher
              compact
              currentLocale={locale}
              label={t('language.switch.label')}
              onSelectLocale={(nextLocale) => {
                void setLocale(nextLocale);
              }}
            />
          </View>
          <AppText variant="title">{t('profile.screen.title')}</AppText>
          <Button
            label={t('auth.logout')}
            variant="secondary"
            onPress={() => {
              void auth.logout();
            }}
          />
        </View>
        {profileQuery.isPending ? <ProfileLoadingState /> : null}
        {profileQuery.isError ? <ProfileErrorState onRetry={() => void profileQuery.refetch()} /> : null}
        {profileQuery.data ? (
          <View style={styles.sections}>
            <ProfileHero hero={profileQuery.data.hero} />
            <ProfileSummaryCard summary={profileQuery.data.summary} />
            <View style={styles.section}>
              <ProfileSectionHeader
                title={t('profile.section.focus.title')}
                description={t('profile.section.focus.description')}
              />
              <ProfileFocusAreaList focusAreas={profileQuery.data.focusAreas} />
            </View>
            <View style={styles.section}>
              <ProfileSectionHeader
                title={t('profile.section.insights.title')}
                description={t('profile.section.insights.description')}
              />
              <ProfileHighlights highlights={profileQuery.data.highlights} />
            </View>
            <View style={styles.section}>
              <ProfileSectionHeader
                title={t('profile.section.quickActions.title')}
                description={t('profile.section.quickActions.description')}
              />
              <ProfileQuickActions quickActions={profileQuery.data.quickActions} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    backgroundColor: colors.background
  },
  headerBlock: {
    gap: spacing.sm
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  sections: {
    gap: spacing.xl
  },
  section: {
    gap: spacing.md
  }
});
