import { describe, expect, it } from 'vitest';

import {
  buildProfileEditPayload,
  formatBirthDateForInput
} from '../../apps/mobile/src/features/profile/model/profile-edit-form';

describe('profile edit form model', () => {
  it('formats ISO birth date for the editable form', () => {
    expect(formatBirthDateForInput('1992-04-12')).toBe('12.04.1992');
    expect(formatBirthDateForInput(null)).toBe('');
  });

  it('builds an update payload from valid form values', () => {
    const result = buildProfileEditPayload({
      firstName: ' Tata ',
      lastName: ' Vorobeva ',
      birthDate: '20.05.1991',
      heightCm: '170',
      weightKg: '59',
      gender: 'female'
    });

    expect(result).toEqual({
      success: true,
      payload: {
        firstName: 'Tata',
        lastName: 'Vorobeva',
        birthDate: '1991-05-20',
        heightCm: 170,
        weightKg: 59,
        gender: 'female'
      }
    });
  });

  it('returns nullable profile details when optional fields are empty', () => {
    const result = buildProfileEditPayload({
      firstName: 'Tata',
      lastName: 'Vorobeva',
      birthDate: '',
      heightCm: '',
      weightKg: '',
      gender: null
    });

    expect(result).toEqual({
      success: true,
      payload: {
        firstName: 'Tata',
        lastName: 'Vorobeva',
        birthDate: null,
        heightCm: null,
        weightKg: null,
        gender: null
      }
    });
  });

  it('returns a readable validation key for invalid birth date', () => {
    const result = buildProfileEditPayload({
      firstName: 'Tata',
      lastName: 'Vorobeva',
      birthDate: '1991-05-20',
      heightCm: '170',
      weightKg: '59',
      gender: 'female'
    });

    expect(result).toEqual({
      success: false,
      errorKey: 'profile.edit.error.invalidBirthDate'
    });
  });
});
