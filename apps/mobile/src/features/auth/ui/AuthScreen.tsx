import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { useAuthForm } from '@/features/auth/model/use-auth-form';
import { useTranslation } from '@/i18n/LocalizationProvider';
import { colors, spacing } from '@/theme/tokens';
import { Screen } from '@/ui/Screen';

import { AuthFooterActions } from './AuthFooterActions';
import { AuthFormCard } from './AuthFormCard';
import { AuthScreenHeader } from './AuthScreenHeader';

export function AuthScreen() {
  const authForm = useAuthForm();
  const { locale, setLocale, t } = useTranslation();
  const isPrimaryAuthMode = !authForm.isPasswordResetRequestMode
    && !authForm.isPasswordResetVerifyMode
    && !authForm.isPasswordResetCompleteMode;
  const shouldDisableSubmit = authForm.isSubmitting
    || (authForm.isPasswordResetVerifyMode && authForm.canResendPasswordResetCode);

  const title = (() => {
    if (authForm.isRegisterMode) {
      return t('auth.register.title');
    }

    if (authForm.isPasswordResetRequestMode) {
      return t('auth.passwordReset.request.title');
    }

    if (authForm.isPasswordResetVerifyMode) {
      return t('auth.passwordReset.verify.title');
    }

    if (authForm.isPasswordResetCompleteMode) {
      return t('auth.passwordReset.complete.title');
    }

    return t('auth.login.title');
  })();
  const description = (() => {
    if (authForm.isRegisterMode) {
      return t('auth.register.description');
    }

    if (authForm.isPasswordResetRequestMode) {
      return t('auth.passwordReset.request.description');
    }

    if (authForm.isPasswordResetVerifyMode) {
      return t('auth.passwordReset.verify.description');
    }

    if (authForm.isPasswordResetCompleteMode) {
      return t('auth.passwordReset.complete.description');
    }

    return t('auth.login.description');
  })();
  const submitLabel = (() => {
    if (authForm.isRegisterMode) {
      return t('auth.register.submit');
    }

    if (authForm.isPasswordResetRequestMode) {
      return t('auth.passwordReset.request.submit');
    }

    if (authForm.isPasswordResetVerifyMode) {
      return t('auth.passwordReset.verify.submit');
    }

    if (authForm.isPasswordResetCompleteMode) {
      return t('auth.passwordReset.complete.submit');
    }

    return t('auth.login.submit');
  })();

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthScreenHeader
            caption={t('profile.screen.caption')}
            description={description}
            languageLabel={t('language.switch.label')}
            locale={locale}
            title={title}
            onSelectLocale={(nextLocale) => {
              void setLocale(nextLocale);
            }}
          />
          <AuthFormCard
            canResendPasswordResetCode={authForm.canResendPasswordResetCode}
            countdownSeconds={authForm.passwordResetCountdownSeconds}
            errorMessage={authForm.errorKey ? t(authForm.errorKey) : null}
            isPasswordResetCompleteMode={authForm.isPasswordResetCompleteMode}
            isPasswordResetRequestMode={authForm.isPasswordResetRequestMode}
            isPasswordResetVerifyMode={authForm.isPasswordResetVerifyMode}
            isPasswordVisible={authForm.isPasswordVisible}
            isPrimaryAuthMode={isPrimaryAuthMode}
            isRegisterMode={authForm.isRegisterMode}
            isResendDisabled={authForm.isSubmitting}
            isSubmitDisabled={shouldDisableSubmit}
            submitLabel={submitLabel}
            successMessage={authForm.successKey ? t(authForm.successKey) : null}
            text={{
              email: t('auth.form.email'),
              firstName: t('auth.form.firstName'),
              lastName: t('auth.form.lastName'),
              password: t('auth.form.password'),
              passwordConfirmation: t('auth.form.passwordConfirmation'),
              passwordHide: t('auth.form.password.hide'),
              passwordShow: t('auth.form.password.show'),
              resendCode: t('auth.passwordReset.resend'),
              resetCode: t('auth.form.resetCode'),
              countdownPrefix: t('auth.passwordReset.countdownPrefix'),
              countdownSuffix: t('auth.passwordReset.countdownSuffix')
            }}
            values={authForm.values}
            setters={authForm.setters}
            onPressResendCode={() => {
              void authForm.resendPasswordResetCode();
            }}
            onPressSubmit={() => {
              void authForm.submit();
            }}
            onTogglePasswordVisibility={authForm.togglePasswordVisibility}
          />
          <AuthFooterActions
            backToLoginLabel={t('auth.passwordReset.backToLogin')}
            forgotPasswordLabel={t('auth.login.forgotPassword')}
            isPrimaryAuthMode={isPrimaryAuthMode}
            isRegisterMode={authForm.isRegisterMode}
            switchActionLabel={
              authForm.isRegisterMode
                ? t('auth.register.switchAction')
                : t('auth.login.switchAction')
            }
            switchPromptLabel={
              authForm.isRegisterMode
                ? t('auth.register.switchPrompt')
                : t('auth.login.switchPrompt')
            }
            onBackToLogin={authForm.goToLogin}
            onForgotPassword={authForm.goToPasswordResetRequest}
            onSwitchMode={authForm.switchMode}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
    backgroundColor: colors.background
  }
});
