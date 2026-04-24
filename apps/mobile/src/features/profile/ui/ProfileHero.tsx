import type { ProfileResponse } from '@health/shared';
import { StyleSheet, View } from 'react-native';

import { getProfileHeroStats } from '@/features/profile/model/profile-view';
import { ProfileAccentOrb } from '@/features/profile/ui/ProfileAccentOrb';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileHeroProps = {
  profile: ProfileResponse;
};

export function ProfileHero({ profile }: ProfileHeroProps) {
  const heroStats = getProfileHeroStats(profile);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.membershipBadge}>
          <AppText variant="caption">{profile.membershipTier}</AppText>
        </View>
        <AppText variant="caption">{profile.joinedAtLabel}</AppText>
      </View>
      <View style={styles.orbitRow}>
        <View style={styles.avatarCluster}>
          <ProfileAccentOrb tone="pink" size={54} />
          <View style={styles.centerAvatar}>
            <AppText variant="title">{profile.firstName.charAt(0)}</AppText>
          </View>
          <ProfileAccentOrb tone="lavender" size={42} />
        </View>
      </View>
      <View style={styles.copyBlock}>
        <AppText variant="hero">{profile.firstName}, your profile</AppText>
        <AppText variant="muted">{profile.planTitle}</AppText>
        <AppText variant="muted">{profile.nextSessionLabel}</AppText>
      </View>
      <View style={styles.statsRow}>
        {heroStats.map((stat) => (
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
