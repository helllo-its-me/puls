import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type ProfileEditTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'number-pad';
  placeholder?: string;
};

export function ProfileEditTextField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder
}: ProfileEditTextFieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="captionStrong">{label}</AppText>
      <TextInput
        autoCapitalize="words"
        keyboardType={keyboardType}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs
  },
  input: {
    minHeight: 54,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    fontSize: 17
  }
});
