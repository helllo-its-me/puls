import type { ProfileResponse } from '@health/shared';
import { StyleSheet, View } from 'react-native';

import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileHighlightsProps = {
  profile: ProfileResponse;
};

export function ProfileHighlights({ profile }: ProfileHighlightsProps) {
  return (
    <View style={styles.container}>
      {profile.highlights.map((highlight) => (
        <ProfileSurfaceCard key={highlight.id}>
          <AppText variant="sectionTitle">{highlight.title}</AppText>
          <AppText variant="muted">{highlight.description}</AppText>
        </ProfileSurfaceCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
  }
});
