import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  actionLabel?: string;
  onPressAction?: () => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
};

export function AuthTextField({
  label,
  value,
  onChangeText,
  actionLabel,
  onPressAction,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default'
}: AuthTextFieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="captionStrong">{label}</AppText>
      <View style={styles.inputShell}>
        <TextInput
          autoCapitalize="none"
          keyboardType={keyboardType}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
        {actionLabel && onPressAction ? (
          <Pressable style={styles.inputAction} onPress={onPressAction}>
            <AppText variant="captionStrong">{actionLabel}</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs
  },
  inputShell: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted
  },
  input: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    fontSize: 17
  },
  inputAction: {
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  }
});
