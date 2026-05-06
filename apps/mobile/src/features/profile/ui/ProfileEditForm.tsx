import { StyleSheet, View } from 'react-native';

import type { ProfileEditFormValues } from '@/features/profile/model/profile-edit-form';
import { ProfileEditTextField } from '@/features/profile/ui/ProfileEditTextField';
import { ProfileGenderSelector } from '@/features/profile/ui/ProfileGenderSelector';
import type { Translate } from '@/i18n/translation';
import { spacing } from '@/theme/tokens';
import { Button } from '@/ui/Button';

type ProfileEditFormProps = {
  values: ProfileEditFormValues;
  isSubmitting: boolean;
  t: Translate;
  onChangeValues: (values: ProfileEditFormValues) => void;
  onSubmit: () => void;
};

export function ProfileEditForm({
  values,
  isSubmitting,
  t,
  onChangeValues,
  onSubmit
}: ProfileEditFormProps) {
  function updateField<TKey extends keyof ProfileEditFormValues>(
    key: TKey,
    value: ProfileEditFormValues[TKey]
  ) {
    onChangeValues({
      ...values,
      [key]: value
    });
  }

  return (
    <View style={styles.form}>
      <ProfileEditTextField
        label={t('profile.edit.field.firstName')}
        value={values.firstName}
        onChangeText={(firstName) => updateField('firstName', firstName)}
      />
      <ProfileEditTextField
        label={t('profile.edit.field.lastName')}
        value={values.lastName}
        onChangeText={(lastName) => updateField('lastName', lastName)}
      />
      <ProfileEditTextField
        label={t('profile.edit.field.birthDate')}
        placeholder={t('profile.edit.placeholder.birthDate')}
        value={values.birthDate}
        onChangeText={(birthDate) => updateField('birthDate', birthDate)}
      />
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <ProfileEditTextField
            keyboardType="number-pad"
            label={t('profile.edit.field.heightCm')}
            value={values.heightCm}
            onChangeText={(heightCm) => updateField('heightCm', heightCm)}
          />
        </View>
        <View style={styles.rowItem}>
          <ProfileEditTextField
            keyboardType="number-pad"
            label={t('profile.edit.field.weightKg')}
            value={values.weightKg}
            onChangeText={(weightKg) => updateField('weightKg', weightKg)}
          />
        </View>
      </View>
      <ProfileGenderSelector
        label={t('profile.edit.field.gender')}
        value={values.gender}
        t={t}
        onChange={(gender) => updateField('gender', gender)}
      />
      <Button
        disabled={isSubmitting}
        label={isSubmitting ? t('profile.edit.saving') : t('profile.edit.save')}
        onPress={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md
  },
  rowItem: {
    flex: 1
  }
});
