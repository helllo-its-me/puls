import { StyleSheet, View } from 'react-native';

import { ProfileAccentOrb } from '@/features/profile/ui/ProfileAccentOrb';
import type { ProfileHeroViewData } from '@/features/profile/model/profile-screen-view';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileHeroProps = {
  hero: ProfileHeroViewData;
};

export function ProfileHero({ hero }: ProfileHeroProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.membershipBadge}>
          <AppText variant="caption">{hero.membershipTier}</AppText>
        </View>
        <AppText variant="caption">{hero.joinedAtLabel}</AppText>
      </View>
      <View style={styles.orbitRow}>
        <View style={styles.avatarCluster}>
          <ProfileAccentOrb tone="pink" size={54} />
          <View style={styles.centerAvatar}>
            <AppText variant="title">{hero.avatarLabel}</AppText>
          </View>
          <ProfileAccentOrb tone="lavender" size={42} />
        </View>
      </View>
      <View style={styles.copyBlock}>
        <AppText variant="hero">{hero.title}</AppText>
        <AppText variant="muted">{hero.planTitle}</AppText>
        <AppText variant="muted">{hero.nextSessionLabel}</AppText>
      </View>
      <View style={styles.statsRow}>
        {hero.stats.map((stat) => (
          <View key={stat.id} style={styles.statPill}>
            <AppText variant="caption">{stat.label}</AppText>
            <AppText variant="sectionTitle">{stat.value}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.backgroundTint
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md
  },
  membershipBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface
  },
  orbitRow: {
    alignItems: 'center'
  },
  avatarCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  centerAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.lavender
  },
  copyBlock: {
    gap: spacing.sm
  },
  statsRow: {
    gap: spacing.md
  },
  statPill: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface
  }
});
