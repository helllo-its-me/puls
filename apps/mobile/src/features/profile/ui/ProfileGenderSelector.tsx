import type { ProfileGender } from '@health/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Translate } from '@/i18n/translation';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type GenderOption = {
  value: ProfileGender | null;
  label: string;
};

type ProfileGenderSelectorProps = {
  label: string;
  value: ProfileGender | null;
  onChange: (value: ProfileGender | null) => void;
  t: Translate;
};

function buildGenderOptions(t: Translate): GenderOption[] {
  return [
    {
      value: 'female',
      label: t('profile.edit.gender.female')
    },
    {
      value: 'male',
      label: t('profile.edit.gender.male')
    },
    {
      value: 'other',
      label: t('profile.edit.gender.other')
    },
    {
      value: 'prefer_not_to_say',
      label: t('profile.edit.gender.preferNotToSay')
    },
    {
      value: null,
      label: t('profile.edit.gender.notSet')
    }
  ];
}

export function ProfileGenderSelector({
  label,
  value,
  onChange,
  t
}: ProfileGenderSelectorProps) {
  return (
    <View style={styles.container}>
      <AppText variant="captionStrong">{label}</AppText>
      <View style={styles.options}>
        {buildGenderOptions(t).map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              key={option.label}
              style={[styles.option, isSelected ? styles.optionSelected : undefined]}
              onPress={() => onChange(option.value)}
            >
              <AppText variant="captionStrong">{option.label}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  optionSelected: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.mint
  }
});
