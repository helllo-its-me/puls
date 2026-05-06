import { expect, type Page, test } from '@playwright/test';

import { passwordResetCodeTtlSeconds } from '../../packages/shared/src/auth/constants';
import { profileResponseFixture } from '../fixtures/profile';

const millisecondsPerSecond = 1000;

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

test('completes the password reset UI flow', async ({ page }) => {
  let resetRequestCount = 0;

  await page.route('**/api/v1/auth/password-reset/**', async (route) => {
    if (route.request().url().includes('/password-reset/request')) {
      resetRequestCount += 1;
    }

    const responseBody = route.request().url().includes('/password-reset/verify')
      ? {
          resetToken: 'verified-reset-token'
        }
      : {
          status: 'ok'
        };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody)
    });
  });
  await page.goto('/');
  await page.clock.install({ time: new Date('2026-05-03T10:00:00.000Z') });

  await page.getByText('Forgot password?').click();
  await expect(page.getByText('Reset your password')).toBeVisible();

  await page.getByPlaceholder('Email').fill('reset@example.com');
  await page.getByText('Send code').click();
  await expect(page.getByText('Enter the code')).toBeVisible();
  await expect(page.getByText('Code expires in')).toBeVisible();

  await page.clock.runFor((passwordResetCodeTtlSeconds + 1) * millisecondsPerSecond);
  await expect(page.getByText('Send a new code')).toBeVisible();
  await page.getByText('Send a new code').click();
  await expect.poll(() => resetRequestCount).toBe(2);
  await expect(page.getByText('Code expires in')).toBeVisible();

  await page.getByPlaceholder('Reset code').fill('123456');
  await page.getByText('Verify code').click();
  await expect(page.getByText('Create a new password')).toBeVisible();
  await expect(page.getByPlaceholder('Reset code')).toBeHidden();
  await expect(page.getByText('Code expires in')).toBeHidden();

  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('new-password');
  await page.getByPlaceholder('Confirm password').fill('new-password');
  await page.getByText('Update password').click();

  await expect(page.getByText('Welcome back')).toBeVisible();
  await expect(page.getByText('Password updated. Log in with your new password.')).toBeVisible();
});

test('keeps password reset steps locked until email and code are verified', async ({ page }) => {
  await page.route('**/api/v1/auth/password-reset/request', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok'
      })
    });
  });
  await page.route('**/api/v1/auth/password-reset/verify', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Invalid or expired reset code'
      })
    });
  });
  await page.goto('/');

  await page.getByText('Forgot password?').click();
  await page.getByText('Send code').click();
  await expect(page.getByText('Enter your email to continue.')).toBeVisible();
  await expect(page.getByText('Enter the code')).toBeHidden();

  await page.getByPlaceholder('Email').fill('reset@example.com');
  await page.getByText('Send code').click();
  await expect(page.getByText('Enter the code')).toBeVisible();

  await page.getByPlaceholder('Reset code').fill('123456');
  await page.getByText('Verify code').click();
  await expect(page.getByText('The reset code is invalid or expired.')).toBeVisible();
  await expect(page.getByText('Create a new password')).toBeHidden();
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

test('edits profile details on a separate page', async ({ page }) => {
  await registerThroughForm(page, `edit-${Date.now()}@example.com`);

  await page.getByText('Edit profile').click();

  await expect(page.getByText('Profile details', { exact: true })).toBeVisible();
  await expect(page.getByText('Tune the basics that shape your care.')).toBeVisible();

  await page.getByPlaceholder('First name').fill('Tata');
  await page.getByPlaceholder('Last name').fill('Vorobeva');
  await page.getByPlaceholder('DD.MM.YYYY').fill('20.05.1991');
  await page.getByPlaceholder('Height, cm').fill('170');
  await page.getByPlaceholder('Weight, kg').fill('59');
  await page.getByText('Female').click();

  const updateResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/profile') && response.request().method() === 'PATCH'
  );
  await page.getByText('Save changes').click();
  const updateResponse = await updateResponsePromise;

  expect(updateResponse.status(), updateResponse.url()).toBe(200);
  await expect(page.getByText('Tata, your profile').last()).toBeVisible();
});

test('refreshes the auth session after an expired profile access token', async ({ page }) => {
  let profileRequestCount = 0;
  let refreshRequestCount = 0;

  await page.route('**/api/v1/**', async (route) => {
    const requestUrl = route.request().url();

    if (requestUrl.includes('/auth/register')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'expired-access-token',
          refreshToken: 'current-refresh-token',
          user: {
            id: 'user-primary',
            email: 'refresh@example.com'
          }
        })
      });
      return;
    }

    if (requestUrl.includes('/auth/refresh')) {
      refreshRequestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'next-access-token',
          refreshToken: 'next-refresh-token',
          user: {
            id: 'user-primary',
            email: 'refresh@example.com'
          }
        })
      });
      return;
    }

    if (requestUrl.includes('/profile')) {
      profileRequestCount += 1;

      if (profileRequestCount === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Current user is required'
          })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...profileResponseFixture,
          firstName: 'Refresh',
          fullName: 'Refresh Member'
        })
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Unexpected test route'
      })
    });
  });

  await page.goto('/');
  await page.getByText('Create one').click();
  await page.getByPlaceholder('First name').fill('Refresh');
  await page.getByPlaceholder('Last name').fill('Member');
  await page.getByPlaceholder('Email').fill('refresh@example.com');
  await page.getByPlaceholder('Password').fill('strong-password');
  await page.getByText('Create account').click();

  await expect(page.getByText('Refresh, your profile')).toBeVisible();
  await expect.poll(() => refreshRequestCount).toBe(1);
  await expect.poll(() => profileRequestCount).toBe(2);
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
