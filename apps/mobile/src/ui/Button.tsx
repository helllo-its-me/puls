import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary,
        pressed && !disabled ? styles.buttonPressed : undefined,
        disabled ? styles.buttonDisabled : undefined
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <AppText variant={variant === 'secondary' ? 'buttonDark' : 'button'}>{label}</AppText>
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
  },
  buttonDisabled: {
    backgroundColor: colors.textTertiary
  }
});
