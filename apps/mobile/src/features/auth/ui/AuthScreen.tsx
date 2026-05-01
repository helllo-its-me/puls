import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

import { useAuthForm } from '@/features/auth/model/use-auth-form';
import { useTranslation } from '@/i18n/LocalizationProvider';
import { LocaleSwitcher } from '@/i18n/ui/LocaleSwitcher';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  actionLabel?: string;
  onPressAction?: () => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
};

function AuthTextField({
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

export function AuthScreen() {
  const authForm = useAuthForm();
  const { locale, setLocale, t } = useTranslation();

  const title = authForm.isRegisterMode ? t('auth.register.title') : t('auth.login.title');
  const description = authForm.isRegisterMode
    ? t('auth.register.description')
    : t('auth.login.description');

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <AppText variant="caption">{t('profile.screen.caption')}</AppText>
              <LocaleSwitcher
                compact
                currentLocale={locale}
                label={t('language.switch.label')}
                onSelectLocale={(nextLocale) => {
                  void setLocale(nextLocale);
                }}
              />
            </View>
            <AppText variant="title">{title}</AppText>
            <AppText variant="muted">{description}</AppText>
          </View>
          <View style={styles.card}>
            {authForm.isRegisterMode ? (
              <>
                <AuthTextField
                  label={t('auth.form.firstName')}
                  value={authForm.values.firstName}
                  onChangeText={authForm.setters.setFirstName}
                />
                <AuthTextField
                  label={t('auth.form.lastName')}
                  value={authForm.values.lastName}
                  onChangeText={authForm.setters.setLastName}
                />
              </>
            ) : null}
            <AuthTextField
              keyboardType="email-address"
              label={t('auth.form.email')}
              value={authForm.values.email}
              onChangeText={authForm.setters.setEmail}
            />
            <AuthTextField
              actionLabel={
                authForm.isPasswordVisible
                  ? t('auth.form.password.hide')
                  : t('auth.form.password.show')
              }
              label={t('auth.form.password')}
              secureTextEntry={!authForm.isPasswordVisible}
              value={authForm.values.password}
              onPressAction={authForm.togglePasswordVisibility}
              onChangeText={authForm.setters.setPassword}
            />
            {authForm.errorKey ? <AppText variant="muted">{t(authForm.errorKey)}</AppText> : null}
            <Button
              disabled={authForm.isSubmitting}
              label={
                authForm.isRegisterMode ? t('auth.register.submit') : t('auth.login.submit')
              }
              onPress={() => {
                void authForm.submit();
              }}
            />
          </View>
          <View style={styles.switchRow}>
            <AppText variant="muted">
              {authForm.isRegisterMode
                ? t('auth.register.switchPrompt')
                : t('auth.login.switchPrompt')}
            </AppText>
            <Pressable onPress={authForm.switchMode}>
              <AppText variant="captionStrong">
                {authForm.isRegisterMode
                  ? t('auth.register.switchAction')
                  : t('auth.login.switchAction')}
              </AppText>
            </Pressable>
          </View>
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
  },
  header: {
    gap: spacing.sm
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
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
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm
  }
});
