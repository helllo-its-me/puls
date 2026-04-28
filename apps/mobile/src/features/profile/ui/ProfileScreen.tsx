import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useProfileQuery } from '@/features/profile/hooks/use-profile-query';
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
  return (
    <ProfileSurfaceCard>
      <AppText variant="sectionTitle">Loading your profile</AppText>
      <AppText variant="muted">Preparing your current plan, focus areas and support details.</AppText>
    </ProfileSurfaceCard>
  );
}

type ProfileErrorStateProps = {
  onRetry: () => void;
};

function ProfileErrorState({ onRetry }: ProfileErrorStateProps) {
  return (
    <ProfileSurfaceCard>
      <AppText variant="sectionTitle">Profile is unavailable</AppText>
      <AppText variant="muted">
        We could not load your profile data. Make sure the API is running and try again.
      </AppText>
      <Button label="Retry" onPress={onRetry} />
    </ProfileSurfaceCard>
  );
}

export function ProfileScreen() {
  const profileQuery = useProfileQuery();

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <AppText variant="caption">Profile</AppText>
          <AppText variant="title">A softer, clearer view of your care journey.</AppText>
        </View>
        {profileQuery.isPending ? <ProfileLoadingState /> : null}
        {profileQuery.isError ? <ProfileErrorState onRetry={() => void profileQuery.refetch()} /> : null}
        {profileQuery.data ? (
          <View style={styles.sections}>
            <ProfileHero hero={profileQuery.data.hero} />
            <ProfileSummaryCard summary={profileQuery.data.summary} />
            <View style={styles.section}>
              <ProfileSectionHeader
                title="Focus right now"
                description="A clean snapshot of the habits and routines that matter most this week."
              />
              <ProfileFocusAreaList focusAreas={profileQuery.data.focusAreas} />
            </View>
            <View style={styles.section}>
              <ProfileSectionHeader
                title="Insights"
                description="Calm, actionable signals based on your recent activity and support plan."
              />
              <ProfileHighlights highlights={profileQuery.data.highlights} />
            </View>
            <View style={styles.section}>
              <ProfileSectionHeader
                title="Quick actions"
                description="The fastest ways to continue your flow without extra navigation."
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
  sections: {
    gap: spacing.xl
  },
  section: {
    gap: spacing.md
  }
});
