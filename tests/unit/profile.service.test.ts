import { describe, expect, it, vi } from 'vitest';

import { profileResponseSchema } from '@health/shared';

import * as profileRepository from '../../apps/api/src/features/profile/profile.repository.js';
import {
  getProfileByUserId,
  mapProfileAggregateToResponse,
  updateProfileByUserId
} from '../../apps/api/src/features/profile/profile.service.js';
import { profileAggregateFixture } from '../fixtures/profile.js';

describe('mapProfileRecordToResponse', () => {
  it('returns a profile that matches the shared contract', () => {
    const profile = mapProfileAggregateToResponse(profileAggregateFixture);
    const parsedProfile = profileResponseSchema.parse(profile);

    expect(parsedProfile.id).toBe('profile-primary');
    expect(parsedProfile.lastName).toBe('Vorobyova');
    expect(parsedProfile.birthDate).toBe('1992-04-12');
    expect(parsedProfile.heightCm).toBe(168);
    expect(parsedProfile.weightKg).toBe(58);
    expect(parsedProfile.gender).toBe('female');
    expect(parsedProfile.joinedAt).toBe('2026-04-01T09:00:00.000Z');
    expect(parsedProfile.nextSessionAt).toBe('2026-04-25T17:30:00.000Z');
    expect(parsedProfile.focusAreas).toHaveLength(3);
    expect(parsedProfile.quickActions.map((action) => action.accent)).toEqual([
      'mint',
      'sky',
      'lavender'
    ]);
  });

  it('loads the profile by user id', async () => {
    const getProfileByUserIdSpy = vi
      .spyOn(profileRepository, 'getProfileByUserId')
      .mockResolvedValue(profileAggregateFixture);

    const profile = await getProfileByUserId('user-primary');

    expect(getProfileByUserIdSpy).toHaveBeenCalledWith('user-primary');
    expect(profile?.id).toBe('profile-primary');
  });

  it('updates the profile by user id', async () => {
    const updatedAggregate = {
      ...profileAggregateFixture,
      profile: {
        ...profileAggregateFixture.profile,
        firstName: 'Tata',
        lastName: 'Vorobeva',
        birthDate: '1991-05-20',
        heightCm: 170,
        weightKg: 59,
        gender: 'female'
      }
    };
    const updateProfileByUserIdSpy = vi
      .spyOn(profileRepository, 'updateProfileByUserId')
      .mockResolvedValue(updatedAggregate);

    const profile = await updateProfileByUserId('user-primary', {
      firstName: 'Tata',
      lastName: 'Vorobeva',
      birthDate: '1991-05-20',
      heightCm: 170,
      weightKg: 59,
      gender: 'female'
    });

    expect(updateProfileByUserIdSpy).toHaveBeenCalledWith('user-primary', {
      firstName: 'Tata',
      lastName: 'Vorobeva',
      birthDate: '1991-05-20',
      heightCm: 170,
      weightKg: 59,
      gender: 'female'
    });
    expect(profile?.fullName).toBe('Tata Vorobeva');
    expect(profile?.birthDate).toBe('1991-05-20');
  });
});
