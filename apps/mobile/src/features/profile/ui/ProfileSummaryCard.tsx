import type { ProfileResponse } from '@health/shared';
import { StyleSheet, View } from 'react-native';

import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileSummaryCardProps = {
  profile: ProfileResponse;
};

export function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  return (
    <ProfileSurfaceCard>
      <View style={styles.row}>
        <View style={styles.badge}>
          <AppText variant="sectionTitle">{profile.completionPercent}%</AppText>
        </View>
        <View style={styles.copyBlock}>
          <AppText variant="sectionTitle">Profile completion is strong</AppText>
          <AppText variant="muted">{profile.consistencyLabel}</AppText>
          <AppText variant="muted">{profile.supportLevel}</AppText>
        </View>
      </View>
    </ProfileSurfaceCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  badge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink
  },
  copyBlock: {
    flex: 1,
    gap: spacing.xs
  }
});
