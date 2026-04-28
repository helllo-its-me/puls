import { StyleSheet, View } from 'react-native';

import type { ProfileSummaryViewData } from '@/features/profile/model/profile-screen-view';
import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileSummaryCardProps = {
  summary: ProfileSummaryViewData;
};

export function ProfileSummaryCard({ summary }: ProfileSummaryCardProps) {
  return (
    <ProfileSurfaceCard>
      <View style={styles.row}>
        <View style={styles.badge}>
          <AppText variant="sectionTitle">{summary.completionPercent}%</AppText>
        </View>
        <View style={styles.copyBlock}>
          <AppText variant="sectionTitle">{summary.title}</AppText>
          <AppText variant="muted">{summary.consistencyLabel}</AppText>
          <AppText variant="muted">{summary.supportLevel}</AppText>
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
