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

test('switches profile interface and system content to russian', async ({ page }) => {
  await page.goto('/');

  await page.getByText('RU', { exact: true }).click();

  await expect(page.getByText('Профиль', { exact: true })).toBeVisible();
  await expect(page.getByText('Премиум сопровождение')).toBeVisible();
  await expect(page.getByText('План мягкого восстановления')).toBeVisible();
  await expect(page.getByText('В фокусе сейчас')).toBeVisible();
  await expect(page.getByText('Ритм сна')).toBeVisible();
  await expect(page.getByText('Быстрые действия')).toBeVisible();
  await expect(page.getByText('Открыть мой план').last()).toBeVisible();
});

test('persists selected language after reload', async ({ page }) => {
  await page.goto('/');

  await page.getByText('RU', { exact: true }).click();
  await page.reload();

  await expect(page.getByText('Профиль', { exact: true })).toBeVisible();
  await expect(page.getByText('Открыть мой план').last()).toBeVisible();
});
