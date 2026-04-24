import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary,
        pressed ? styles.buttonPressed : undefined
      ]}
      onPress={onPress}
    >
      <AppText variant="button">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center'
  },
  buttonPrimary: {
    backgroundColor: colors.accent
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceMuted
  },
  buttonPressed: {
    backgroundColor: colors.accentPressed
  }
});
