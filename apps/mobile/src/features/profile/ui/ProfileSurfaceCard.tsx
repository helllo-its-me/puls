import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

export function ProfileSurfaceCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  }
});
