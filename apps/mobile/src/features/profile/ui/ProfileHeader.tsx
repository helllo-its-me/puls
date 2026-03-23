import { StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

type ProfileHeaderProps = {
  fullName: string;
  ageLabel: string;
  planLabel: string;
  nextVisitLabel: string;
  completionLabel: string;
};

export function ProfileHeader({
  fullName,
  ageLabel,
  planLabel,
  nextVisitLabel,
  completionLabel
}: ProfileHeaderProps) {
  const avatarLabel = fullName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <AppText variant="title">{avatarLabel}</AppText>
      </View>
      <View style={styles.infoBlock}>
        <AppText variant="title">{fullName}</AppText>
        <AppText>{ageLabel}</AppText>
        <AppText>{planLabel}</AppText>
      </View>
      <View style={styles.metaBlock}>
        <AppText>{nextVisitLabel}</AppText>
        <AppText>{completionLabel}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  infoBlock: {
    gap: spacing.xs
  },
  metaBlock: {
    gap: spacing.xs
  }
});
