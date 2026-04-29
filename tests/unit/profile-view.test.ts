import { describe, expect, it } from 'vitest';

import { createTranslator } from '../../apps/mobile/src/i18n/translation.js';
import { buildProfileScreenViewData } from '../../apps/mobile/src/features/profile/model/profile-screen-view.js';
import { profileResponseFixture } from '../fixtures/profile.js';

describe('profile view model', () => {
  it('builds english screen-specific data from the API response', () => {
    const viewData = buildProfileScreenViewData(profileResponseFixture, {
      locale: 'en',
      t: createTranslator('en')
    });

    expect(viewData.hero.membershipTier).toBe('Premium care');
    expect(viewData.hero.planTitle).toBe('Mindful reset plan');
    expect(viewData.hero.stats).toEqual([
      {
        id: 'streak',
        label: 'Streak',
        value: '12 days'
      },
      {
        id: 'completion',
        label: 'Completion',
        value: '84%'
      },
      {
        id: 'energy',
        label: 'Energy',
        value: 'Calm focus'
      }
    ]);

    expect(viewData.focusAreas).toEqual([
      {
        id: 'sleep',
        label: 'Sleep rhythm',
        progressLabel: '7 nights tracked',
        tone: 'mint'
      },
      {
        id: 'movement',
        label: 'Gentle mobility',
        progressLabel: '3 sessions completed',
        tone: 'sky'
      },
      {
        id: 'stress',
        label: 'Stress relief',
        progressLabel: 'Breathing streak: 5 days',
        tone: 'lavender'
      }
    ]);

    expect(viewData.quickActions.map((action) => action.tone)).toEqual(['mint', 'sky', 'lavender']);
    expect(viewData.quickActions[0]?.label).toBe('Open my plan');
    expect(viewData.quickActions[0]?.description).toBe('See the full schedule, habits and progress checkpoints.');
  });

  it('builds russian localized labels for the screen', () => {
    const viewData = buildProfileScreenViewData(profileResponseFixture, {
      locale: 'ru',
      t: createTranslator('ru')
    });

    expect(viewData.hero.title).toBe('Tanya, ваш профиль');
    expect(viewData.hero.membershipTier).toBe('Премиум сопровождение');
    expect(viewData.hero.planTitle).toBe('План мягкого восстановления');
    expect(viewData.hero.joinedAtLabel).toBe('С нами с апрель 2026 г.');
    expect(viewData.hero.stats[0]?.label).toBe('Серия');
    expect(viewData.hero.stats[2]?.value).toBe('Спокойная концентрация');
    expect(viewData.summary.title).toBe('Профиль заполнен хорошо');
    expect(viewData.focusAreas[0]?.label).toBe('Ритм сна');
    expect(viewData.focusAreas[0]?.progressLabel).toBe('Отслежено 7 ночей');
    expect(viewData.highlights[0]?.title).toBe('Ваш ритм становится стабильнее');
    expect(viewData.quickActions[0]?.label).toBe('Открыть мой план');
    expect(viewData.quickActions[0]?.description).toBe('Посмотрите полное расписание, привычки и контрольные точки прогресса.');
  });
});
