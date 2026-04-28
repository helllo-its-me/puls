import { StyleSheet, View } from 'react-native';

import type { ProfileHighlightViewData } from '@/features/profile/model/profile-screen-view';
import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileHighlightsProps = {
  highlights: ProfileHighlightViewData[];
};

export function ProfileHighlights({ highlights }: ProfileHighlightsProps) {
  return (
    <View style={styles.container}>
      {highlights.map((highlight) => (
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
