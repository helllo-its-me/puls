import { Alert, StyleSheet, View } from 'react-native';

import type { ProfileQuickActionViewData } from '@/features/profile/model/profile-screen-view';
import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { Button } from '@/ui/Button';
import { AppText } from '@/ui/AppText';
import { colors, radius, spacing } from '@/theme/tokens';

type ProfileQuickActionsProps = {
  quickActions: ProfileQuickActionViewData[];
};

const toneMap = {
  mint: colors.mint,
  sky: colors.sky,
  lavender: colors.lavender
};

export function ProfileQuickActions({ quickActions }: ProfileQuickActionsProps) {
  return (
    <View style={styles.container}>
      {quickActions.map((action) => (
        <ProfileSurfaceCard key={action.id}>
          <View style={styles.row}>
            <View style={[styles.iconStub, { backgroundColor: toneMap[action.tone] }]} />
            <View style={styles.copyBlock}>
              <AppText variant="sectionTitle">{action.label}</AppText>
              <AppText variant="muted">{action.description}</AppText>
            </View>
          </View>
          <Button
            label={action.actionLabel}
            onPress={() => {
              Alert.alert(action.label, 'Action flow will be connected in the next slice.');
            }}
          />
        </ProfileSurfaceCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  iconStub: {
    width: 56,
    height: 56,
    borderRadius: radius.lg
  },
  copyBlock: {
    flex: 1,
    gap: spacing.xs
  }
});
