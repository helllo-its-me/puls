import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type ButtonProps = {
  label: string;
  onPress: () => void;
};

export function Button({ label, onPress }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : undefined]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center'
  },
  buttonPressed: {
    backgroundColor: colors.accentPressed
  },
  label: {
    color: colors.surface,
    fontSize: typography.button,
    fontWeight: '600'
  }
});
