import type { ProfileGender, ProfileResponse, UpdateProfileRequest } from '@health/shared';

import type { TranslationKey } from '@/i18n/dictionaries';

export type ProfileEditFormValues = {
  firstName: string;
  lastName: string;
  birthDate: string;
  heightCm: string;
  weightKg: string;
  gender: ProfileGender | null;
};

export type ProfileEditPayloadResult =
  | {
      success: true;
      payload: UpdateProfileRequest;
    }
  | {
      success: false;
      errorKey: TranslationKey;
    };

const birthDatePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const isoBirthDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function hasValidDateParts(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseBirthDateInput(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const match = birthDatePattern.exec(trimmedValue);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!hasValidDateParts(year, month, day)) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseNullableIntegerInput(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return Number(trimmedValue);
}

function isValidNullableInteger(value: number | null): boolean {
  return value === null || Number.isInteger(value);
}

export function formatBirthDateForInput(value: string | null): string {
  if (!value) {
    return '';
  }

  const match = isoBirthDatePattern.exec(value);

  if (!match) {
    return '';
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function buildInitialProfileEditFormValues(profile: ProfileResponse): ProfileEditFormValues {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    birthDate: formatBirthDateForInput(profile.birthDate),
    heightCm: profile.heightCm?.toString() ?? '',
    weightKg: profile.weightKg?.toString() ?? '',
    gender: profile.gender
  };
}

export function buildProfileEditPayload(
  values: ProfileEditFormValues
): ProfileEditPayloadResult {
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();

  if (!firstName || !lastName) {
    return {
      success: false,
      errorKey: 'profile.edit.error.nameRequired'
    };
  }

  const birthDate = parseBirthDateInput(values.birthDate);

  if (values.birthDate.trim() && !birthDate) {
    return {
      success: false,
      errorKey: 'profile.edit.error.invalidBirthDate'
    };
  }

  const heightCm = parseNullableIntegerInput(values.heightCm);
  const weightKg = parseNullableIntegerInput(values.weightKg);

  if (!isValidNullableInteger(heightCm) || !isValidNullableInteger(weightKg)) {
    return {
      success: false,
      errorKey: 'profile.edit.error.invalidNumber'
    };
  }

  return {
    success: true,
    payload: {
      firstName,
      lastName,
      birthDate,
      heightCm,
      weightKg,
      gender: values.gender
    }
  };
}
