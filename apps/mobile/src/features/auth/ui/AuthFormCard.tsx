import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

import { AuthTextField } from './AuthTextField';

type AuthFormCardText = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirmation: string;
  passwordHide: string;
  passwordShow: string;
  resendCode: string;
  resetCode: string;
  countdownPrefix: string;
  countdownSuffix: string;
};

type AuthFormCardValues = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirmation: string;
  resetCode: string;
};

type AuthFormCardSetters = {
  setEmail: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setPassword: (value: string) => void;
  setPasswordConfirmation: (value: string) => void;
  setResetCode: (value: string) => void;
};

type AuthFormCardProps = {
  canResendPasswordResetCode: boolean;
  countdownSeconds: number | null;
  errorMessage: string | null;
  isPasswordResetCompleteMode: boolean;
  isPasswordResetRequestMode: boolean;
  isPasswordResetVerifyMode: boolean;
  isPasswordVisible: boolean;
  isPrimaryAuthMode: boolean;
  isRegisterMode: boolean;
  isResendDisabled: boolean;
  isSubmitDisabled: boolean;
  submitLabel: string;
  successMessage: string | null;
  text: AuthFormCardText;
  values: AuthFormCardValues;
  setters: AuthFormCardSetters;
  onPressResendCode: () => void;
  onPressSubmit: () => void;
  onTogglePasswordVisibility: () => void;
};

export function AuthFormCard({
  canResendPasswordResetCode,
  countdownSeconds,
  errorMessage,
  isPasswordResetCompleteMode,
  isPasswordResetRequestMode,
  isPasswordResetVerifyMode,
  isPasswordVisible,
  isPrimaryAuthMode,
  isRegisterMode,
  isResendDisabled,
  isSubmitDisabled,
  submitLabel,
  successMessage,
  text,
  values,
  setters,
  onPressResendCode,
  onPressSubmit,
  onTogglePasswordVisibility
}: AuthFormCardProps) {
  const isPasswordResetCodeFlow = isPasswordResetVerifyMode;

  return (
    <View style={styles.card}>
      {isRegisterMode && isPrimaryAuthMode ? (
        <>
          <AuthTextField
            label={text.firstName}
            value={values.firstName}
            onChangeText={setters.setFirstName}
          />
          <AuthTextField
            label={text.lastName}
            value={values.lastName}
            onChangeText={setters.setLastName}
          />
        </>
      ) : null}
      {!isPasswordResetVerifyMode && !isPasswordResetCompleteMode ? (
        <AuthTextField
          keyboardType="email-address"
          label={text.email}
          value={values.email}
          onChangeText={setters.setEmail}
        />
      ) : null}
      {isPasswordResetVerifyMode ? (
        <AuthTextField
          keyboardType="number-pad"
          label={text.resetCode}
          value={values.resetCode}
          onChangeText={setters.setResetCode}
        />
      ) : null}
      {!isPasswordResetRequestMode && !isPasswordResetVerifyMode ? (
        <AuthTextField
          actionLabel={isPasswordVisible ? text.passwordHide : text.passwordShow}
          label={text.password}
          secureTextEntry={!isPasswordVisible}
          value={values.password}
          onPressAction={onTogglePasswordVisibility}
          onChangeText={setters.setPassword}
        />
      ) : null}
      {isPasswordResetCompleteMode ? (
        <AuthTextField
          label={text.passwordConfirmation}
          secureTextEntry={!isPasswordVisible}
          value={values.passwordConfirmation}
          onChangeText={setters.setPasswordConfirmation}
        />
      ) : null}
      {errorMessage ? <AppText variant="muted">{errorMessage}</AppText> : null}
      {successMessage ? <AppText variant="muted">{successMessage}</AppText> : null}
      {isPasswordResetCodeFlow && countdownSeconds !== null ? (
        <View style={styles.resetCodeStatus}>
          {canResendPasswordResetCode ? (
            <Button
              disabled={isResendDisabled}
              label={text.resendCode}
              variant="secondary"
              onPress={onPressResendCode}
            />
          ) : (
            <AppText variant="muted">
              {text.countdownPrefix} {countdownSeconds}
              {text.countdownSuffix}
            </AppText>
          )}
        </View>
      ) : null}
      <Button disabled={isSubmitDisabled} label={submitLabel} onPress={onPressSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  resetCodeStatus: {
    gap: spacing.sm
  }
});
