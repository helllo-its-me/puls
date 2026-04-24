import { expect, test } from '@playwright/test';

test('renders the profile screen with live API data', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Tanya, your profile')).toBeVisible();
  await expect(page.getByText('Mindful reset plan')).toBeVisible();
  await expect(page.getByText('Focus right now')).toBeVisible();
  await expect(page.getByText('Quick actions')).toBeVisible();
  await expect(page.getByText('Open my plan').last()).toBeVisible();
  await expect(page.getByText('See the full schedule, habits and progress checkpoints.')).toBeVisible();
});
