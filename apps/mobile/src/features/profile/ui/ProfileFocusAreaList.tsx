import type { ProfileResponse } from '@health/shared';
import { StyleSheet, View } from 'react-native';

import { getProfileFocusTones } from '@/features/profile/model/profile-view';
import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileFocusAreaListProps = {
  profile: ProfileResponse;
};

const toneMap = {
  mint: colors.mint,
  sky: colors.sky,
  lavender: colors.lavender
};

export function ProfileFocusAreaList({ profile }: ProfileFocusAreaListProps) {
  const focusTones = getProfileFocusTones(profile);

  return (
    <View style={styles.container}>
      {profile.focusAreas.map((focusArea) => {
        const tone = focusTones.find((item) => item.id === focusArea.id)?.tone ?? 'mint';

        return (
          <View key={focusArea.id} style={[styles.item, { backgroundColor: toneMap[tone] }]}>
            <View style={styles.badge} />
            <View style={styles.copyBlock}>
              <AppText variant="sectionTitle">{focusArea.label}</AppText>
              <AppText variant="muted">{focusArea.progressLabel}</AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
  },
  item: {
    minHeight: 116,
    padding: spacing.lg,
    borderRadius: radius.xl,
    justifyContent: 'space-between'
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    opacity: 0.8
  },
  copyBlock: {
    gap: spacing.xs
  }
});
