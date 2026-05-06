import { StyleSheet, View } from 'react-native';

import type { ProfileBmiViewData } from '@/features/profile/model/profile-screen-view';
import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileBmiCardProps = {
  bmi: ProfileBmiViewData;
};

const bmiToneColors = {
  empty: colors.surfaceMuted,
  ok: colors.success,
  attention: colors.mint,
  high: colors.pink
} as const;

export function ProfileBmiCard({ bmi }: ProfileBmiCardProps) {
  return (
    <ProfileSurfaceCard>
      <View style={styles.row}>
        <View style={[styles.valueBadge, { backgroundColor: bmiToneColors[bmi.tone] }]}>
          <AppText variant="sectionTitle">{bmi.value}</AppText>
        </View>
        <View style={styles.copyBlock}>
          <AppText variant="captionStrong">{bmi.title}</AppText>
          <AppText variant="sectionTitle">{bmi.label}</AppText>
          <AppText variant="muted">{bmi.description}</AppText>
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
  valueBadge: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  copyBlock: {
    flex: 1,
    gap: spacing.xs
  }
});
