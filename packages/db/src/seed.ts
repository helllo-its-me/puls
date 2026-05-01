import {
  db,
  dbClient,
  profileFocusAreasTable,
  profileHighlightsTable,
  profileQuickActionsTable,
  profilesTable,
  usersTable
} from './index.js';

const seededUserId = 'user-primary';
const seededProfileId = 'profile-primary';

async function seedProfile() {
  await db.insert(usersTable).values({
    id: seededUserId,
    email: 'tanya@example.com',
    passwordHash: null,
    createdAt: new Date('2026-04-01T08:30:00.000Z')
  }).onConflictDoUpdate({
    target: usersTable.id,
    set: {
      email: 'tanya@example.com',
      passwordHash: null,
      createdAt: new Date('2026-04-01T08:30:00.000Z')
    }
  });

  await db.insert(profilesTable).values({
    id: seededProfileId,
    userId: seededUserId,
    firstName: 'Tanya',
    lastName: 'Vorobyova',
    membershipTier: 'Premium care',
    planTitle: 'Mindful reset plan',
    joinedAt: new Date('2026-04-01T09:00:00.000Z'),
    nextSessionAt: new Date('2026-04-25T17:30:00.000Z'),
    streakDays: 12,
    completionPercent: 84,
    energyLabel: 'Calm focus',
    consistencyNote: '4 of 5 habits this week',
    supportNote: 'Coach support is active'
  }).onConflictDoUpdate({
    target: profilesTable.id,
    set: {
      userId: seededUserId,
      firstName: 'Tanya',
      lastName: 'Vorobyova',
      membershipTier: 'Premium care',
      planTitle: 'Mindful reset plan',
      joinedAt: new Date('2026-04-01T09:00:00.000Z'),
      nextSessionAt: new Date('2026-04-25T17:30:00.000Z'),
      streakDays: 12,
      completionPercent: 84,
      energyLabel: 'Calm focus',
      consistencyNote: '4 of 5 habits this week',
      supportNote: 'Coach support is active'
    }
  });

  await db.delete(profileFocusAreasTable);
  await db.delete(profileHighlightsTable);
  await db.delete(profileQuickActionsTable);

  await db.insert(profileFocusAreasTable).values([
    {
      id: 'sleep',
      profileId: seededProfileId,
      label: 'Sleep rhythm',
      progressLabel: '7 nights tracked',
      position: 0
    },
    {
      id: 'movement',
      profileId: seededProfileId,
      label: 'Gentle mobility',
      progressLabel: '3 sessions completed',
      position: 1
    },
    {
      id: 'stress',
      profileId: seededProfileId,
      label: 'Stress relief',
      progressLabel: 'Breathing streak: 5 days',
      position: 2
    }
  ]);

  await db.insert(profileHighlightsTable).values([
    {
      id: 'routine',
      profileId: seededProfileId,
      title: 'Your routine is stabilizing',
      description: 'Evening check-ins became more consistent and recovery mornings feel lighter.',
      position: 0
    },
    {
      id: 'coach',
      profileId: seededProfileId,
      title: 'Coach recommendation',
      description: 'Keep the bedtime window fixed for the next 4 days to reinforce the new rhythm.',
      position: 1
    }
  ]);

  await db.insert(profileQuickActionsTable).values([
    {
      id: 'plan',
      profileId: seededProfileId,
      label: 'Open my plan',
      description: 'See the full schedule, habits and progress checkpoints.',
      accent: 'mint',
      position: 0
    },
    {
      id: 'coach',
      profileId: seededProfileId,
      label: 'Message coach',
      description: 'Send a note, ask a question or share how today went.',
      accent: 'sky',
      position: 1
    },
    {
      id: 'edit',
      profileId: seededProfileId,
      label: 'Adjust preferences',
      description: 'Update profile details and tune your care experience.',
      accent: 'lavender',
      position: 2
    }
  ]);
}

async function main() {
  try {
    await seedProfile();
  } finally {
    await dbClient.end();
  }
}

void main();
