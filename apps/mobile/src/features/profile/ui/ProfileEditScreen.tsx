import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen } from '@/features/auth/ui/AuthScreen';
import { useProfileDataQuery } from '@/features/profile/hooks/use-profile-query';
import { useUpdateProfileMutation } from '@/features/profile/hooks/use-update-profile-mutation';
import {
  buildInitialProfileEditFormValues,
  buildProfileEditPayload,
  type ProfileEditFormValues
} from '@/features/profile/model/profile-edit-form';
import { ProfileEditForm } from '@/features/profile/ui/ProfileEditForm';
import { ProfileSurfaceCard } from '@/features/profile/ui/ProfileSurfaceCard';
import { useTranslation } from '@/i18n/LocalizationProvider';
import { ApiError } from '@/lib/api/api-error';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

const emptyProfileEditFormValues: ProfileEditFormValues = {
  firstName: '',
  lastName: '',
  birthDate: '',
  heightCm: '',
  weightKg: '',
  gender: null
};

function ProfileEditLoadingState() {
  const { t } = useTranslation();

  return (
    <ProfileSurfaceCard>
      <AppText variant="sectionTitle">{t('profile.edit.loading.title')}</AppText>
      <AppText variant="muted">{t('profile.edit.loading.description')}</AppText>
    </ProfileSurfaceCard>
  );
}

type ProfileEditErrorStateProps = {
  onRetry: () => void;
};

function ProfileEditErrorState({ onRetry }: ProfileEditErrorStateProps) {
  const { t } = useTranslation();

  return (
    <ProfileSurfaceCard>
      <AppText variant="sectionTitle">{t('profile.edit.error.loadTitle')}</AppText>
      <AppText variant="muted">{t('profile.edit.error.loadDescription')}</AppText>
      <Button label={t('profile.error.retry')} onPress={onRetry} />
    </ProfileSurfaceCard>
  );
}

export function ProfileEditScreen() {
  const auth = useAuth();
  const router = useRouter();
  const profileQuery = useProfileDataQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const { t } = useTranslation();
  const [values, setValues] = useState<ProfileEditFormValues>(emptyProfileEditFormValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setValues(buildInitialProfileEditFormValues(profileQuery.data));
  }, [profileQuery.data]);

  if (auth.isLoading) {
    return (
      <Screen>
        <ProfileEditLoadingState />
      </Screen>
    );
  }

  if (!auth.session) {
    return <AuthScreen />;
  }

  async function handleSubmit() {
    setErrorMessage(null);

    const result = buildProfileEditPayload(values);

    if (!result.success) {
      setErrorMessage(t(result.errorKey));
      return;
    }

    try {
      await updateProfileMutation.mutateAsync(result.payload);
      router.replace('/');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }

      if (error instanceof TypeError) {
        setErrorMessage(t('profile.edit.error.network'));
        return;
      }

      setErrorMessage(t('profile.edit.error.generic'));
    }
  }

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="caption">{t('profile.edit.caption')}</AppText>
          <AppText variant="title">{t('profile.edit.title')}</AppText>
          <AppText variant="muted">{t('profile.edit.description')}</AppText>
        </View>
        {profileQuery.isPending ? <ProfileEditLoadingState /> : null}
        {profileQuery.isError ? (
          <ProfileEditErrorState onRetry={() => void profileQuery.refetch()} />
        ) : null}
        {profileQuery.data ? (
          <ProfileSurfaceCard>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <AppText variant="captionStrong">{errorMessage}</AppText>
              </View>
            ) : null}
            <ProfileEditForm
              values={values}
              isSubmitting={updateProfileMutation.isPending}
              t={t}
              onChangeValues={setValues}
              onSubmit={() => {
                void handleSubmit();
              }}
            />
            <Button
              label={t('profile.edit.cancel')}
              variant="secondary"
              onPress={() => router.back()}
            />
          </ProfileSurfaceCard>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    backgroundColor: colors.background
  },
  header: {
    gap: spacing.sm
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.pink
  }
});
