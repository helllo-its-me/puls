import { StyleSheet, View } from 'react-native';

import type { ProfileFocusAreaItemViewData } from '@/features/profile/model/profile-screen-view';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileFocusAreaListProps = {
  focusAreas: ProfileFocusAreaItemViewData[];
};

const toneMap = {
  mint: colors.mint,
  sky: colors.sky,
  lavender: colors.lavender
};

export function ProfileFocusAreaList({ focusAreas }: ProfileFocusAreaListProps) {
  return (
    <View style={styles.container}>
      {focusAreas.map((focusArea) => (
        <View key={focusArea.id} style={[styles.item, { backgroundColor: toneMap[focusArea.tone] }]}>
          <View style={styles.badge} />
          <View style={styles.copyBlock}>
            <AppText variant="sectionTitle">{focusArea.label}</AppText>
            <AppText variant="muted">{focusArea.progressLabel}</AppText>
          </View>
        </View>
      ))}
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
