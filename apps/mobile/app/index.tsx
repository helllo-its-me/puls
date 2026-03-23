import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';

import { profileViewData } from '@/features/profile/model/profile';
import { ProfileActions } from '@/features/profile/ui/ProfileActions';
import { ProfileCard } from '@/features/profile/ui/ProfileCard';
import { ProfileFocusAreas } from '@/features/profile/ui/ProfileFocusAreas';
import { ProfileHeader } from '@/features/profile/ui/ProfileHeader';
import { ProfileInsights } from '@/features/profile/ui/ProfileInsights';
import { ProfileMetrics } from '@/features/profile/ui/ProfileMetrics';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

export default function HomeScreen() {
  const profile = profileViewData;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileCard>
          <ProfileHeader
            fullName={profile.fullName}
            ageLabel={profile.ageLabel}
            planLabel={profile.planLabel}
            nextVisitLabel={profile.nextVisitLabel}
            completionLabel={profile.completionLabel}
          />
        </ProfileCard>
        <ProfileMetrics metrics={profile.metrics} />
        <ProfileFocusAreas focusAreas={profile.focusAreas} />
        <ProfileInsights insights={profile.insights} />
        <View style={styles.sectionHeader}>
          <AppText variant="title">Your Space</AppText>
          <AppText>Everything important for the current recovery cycle in one place.</AppText>
        </View>
        <ProfileActions actions={profile.actions} />
      </ScrollView>
      <StatusBar style="auto" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl
  },
  sectionHeader: {
    gap: spacing.xs
  }
});
