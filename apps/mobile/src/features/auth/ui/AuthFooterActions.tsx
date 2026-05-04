import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type AuthFooterActionsProps = {
  backToLoginLabel: string;
  forgotPasswordLabel: string;
  isPrimaryAuthMode: boolean;
  isRegisterMode: boolean;
  switchActionLabel: string;
  switchPromptLabel: string;
  onBackToLogin: () => void;
  onForgotPassword: () => void;
  onSwitchMode: () => void;
};

export function AuthFooterActions({
  backToLoginLabel,
  forgotPasswordLabel,
  isPrimaryAuthMode,
  isRegisterMode,
  switchActionLabel,
  switchPromptLabel,
  onBackToLogin,
  onForgotPassword,
  onSwitchMode
}: AuthFooterActionsProps) {
  if (!isPrimaryAuthMode) {
    return (
      <View style={styles.switchRow}>
        <Pressable onPress={onBackToLogin}>
          <AppText variant="captionStrong">{backToLoginLabel}</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.switchColumn}>
      {!isRegisterMode ? (
        <Pressable onPress={onForgotPassword}>
          <AppText variant="captionStrong">{forgotPasswordLabel}</AppText>
        </Pressable>
      ) : null}
      <View style={styles.switchRow}>
        <AppText variant="muted">{switchPromptLabel}</AppText>
        <Pressable onPress={onSwitchMode}>
          <AppText variant="captionStrong">{switchActionLabel}</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  switchColumn: {
    alignItems: 'center',
    gap: spacing.md
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm
  }
});
