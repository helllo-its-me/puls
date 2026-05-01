import { expect, type Page, test } from '@playwright/test';

async function routeApiToTestServer(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    requestUrl.host = '127.0.0.1:3100';

    await route.continue({
      url: requestUrl.toString()
    });
  });
}

async function registerThroughForm(page: Page, email: string) {
  await routeApiToTestServer(page);
  await page.goto('/');

  await page.getByText('Create one').click();
  await page.getByPlaceholder('First name').fill('Test');
  await page.getByPlaceholder('Last name').fill('Member');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill('strong-password');
  const registrationResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/auth/register')
  );
  await page.getByText('Create account').click();
  const registrationResponse = await registrationResponsePromise;

  expect(registrationResponse.status(), registrationResponse.url()).toBe(201);
}

test('opens the login screen first', async ({ page }) => {
  await routeApiToTestServer(page);
  await page.goto('/');

  await expect(page.getByText('Welcome back')).toBeVisible();
  await expect(page.getByText('Log in').last()).toBeVisible();
  await expect(page.getByText('Need an account?')).toBeVisible();
});

test('shows a readable validation error when login fields are empty', async ({ page }) => {
  await routeApiToTestServer(page);
  await page.goto('/');

  await page.getByText('Log in').last().click();

  await expect(page.getByText('Enter email and password to continue.')).toBeVisible();
});

test('shows a readable error when login credentials are invalid', async ({ page }) => {
  await routeApiToTestServer(page);
  await page.goto('/');

  await page.getByPlaceholder('Email').fill('missing@example.com');
  await page.getByPlaceholder('Password').fill('strong-password');
  await page.getByText('Log in').last().click();

  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('shows a readable registration error when email is invalid', async ({ page }) => {
  await routeApiToTestServer(page);
  await page.goto('/');

  await page.getByText('Create one').click();
  await page.getByPlaceholder('First name').fill('Test');
  await page.getByPlaceholder('Last name').fill('Member');
  await page.getByPlaceholder('Email').fill('invalid-email');
  await page.getByPlaceholder('Password').fill('strong-password');
  await page.getByText('Create account').click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
});

test('shows a readable registration error when password is too short', async ({ page }) => {
  await routeApiToTestServer(page);
  await page.goto('/');

  await page.getByText('Create one').click();
  await page.getByPlaceholder('First name').fill('Test');
  await page.getByPlaceholder('Last name').fill('Member');
  await page.getByPlaceholder('Email').fill('short-password@example.com');
  await page.getByPlaceholder('Password').fill('short');
  await page.getByText('Create account').click();

  await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
});

test('shows a readable registration error when API is unreachable', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    await route.abort();
  });
  await page.goto('/');

  await page.getByText('Create one').click();
  await page.getByPlaceholder('First name').fill('Test');
  await page.getByPlaceholder('Last name').fill('Member');
  await page.getByPlaceholder('Email').fill('network-error@example.com');
  await page.getByPlaceholder('Password').fill('strong-password');
  await page.getByText('Create account').click();

  await expect(page.getByText('Could not connect to the API.')).toBeVisible();
});

test('toggles password visibility on the auth form', async ({ page }) => {
  await routeApiToTestServer(page);
  await page.goto('/');

  const passwordField = page.getByPlaceholder('Password');
  await passwordField.fill('strong-password');

  await expect(passwordField).toHaveAttribute('type', 'password');

  await page.getByText('Show').click();
  await expect(passwordField).toHaveAttribute('type', 'text');

  await page.getByText('Hide').click();
  await expect(passwordField).toHaveAttribute('type', 'password');
});

test('switches language from the login screen before authentication', async ({ page }) => {
  await routeApiToTestServer(page);
  await page.goto('/');

  await page.getByText('RU', { exact: true }).click();

  await expect(page.getByText('С возвращением')).toBeVisible();
  await expect(page.getByText('Войти').last()).toBeVisible();
  await expect(page.getByText('Нет аккаунта?')).toBeVisible();

  await page.getByText('Создать').click();

  await expect(page.getByText('Создайте аккаунт')).toBeVisible();
});

test('registers and renders the profile screen with live API data', async ({ page }) => {
  await registerThroughForm(page, `profile-${Date.now()}@example.com`);

  await expect(page.getByText('Test, your profile')).toBeVisible();
  await expect(page.getByText('Focus right now')).toBeVisible();
  await expect(page.getByText('Quick actions')).toBeVisible();
});

test('switches profile interface and system content to russian', async ({ page }) => {
  await registerThroughForm(page, `russian-${Date.now()}@example.com`);

  await page.getByText('RU', { exact: true }).click();

  await expect(page.getByText('Профиль', { exact: true })).toBeVisible();
  await expect(page.getByText('В фокусе сейчас')).toBeVisible();
  await expect(page.getByText('Быстрые действия')).toBeVisible();
});

test('persists selected language after reload', async ({ page }) => {
  await registerThroughForm(page, `locale-${Date.now()}@example.com`);

  await page.getByText('RU', { exact: true }).click();
  await page.reload();

  await expect(page.getByText('Профиль', { exact: true })).toBeVisible();
  await expect(page.getByText('Быстрые действия')).toBeVisible();
});
