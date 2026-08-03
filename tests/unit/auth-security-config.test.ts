import { describe, expect, it } from 'vitest';

import { readApiSecurityConfig } from '../../apps/api/src/app/api-security.config.js';
import { resolveAuthClientAddress } from '../../apps/api/src/features/auth/auth.client-address.js';
import { readPasswordResetSmtpConfig } from '../../apps/api/src/features/auth/password-reset-email.config.js';

describe('auth security configuration', () => {
  it('uses the socket address unless trusted proxy hops are configured', () => {
    expect(resolveAuthClientAddress({
      directAddress: '192.0.2.10',
      forwardedForHeader: '198.51.100.20',
      trustedProxyHops: 0
    })).toBe('192.0.2.10');

    expect(resolveAuthClientAddress({
      directAddress: '192.0.2.10',
      forwardedForHeader: '198.51.100.20',
      trustedProxyHops: 1
    })).toBe('198.51.100.20');
  });

  it('parses explicit web origins and minimum response timings', () => {
    expect(readApiSecurityConfig({
      NODE_ENV: 'staging',
      AUTH_TRUST_PROXY_HOPS: '2',
      REGISTRATION_MIN_RESPONSE_MS: '1200',
      PASSWORD_RESET_MIN_RESPONSE_MS: '1500',
      WEB_APP_ORIGINS: 'https://app.example.com,https://admin.example.com'
    })).toEqual({
      trustedProxyHops: 2,
      registrationMinimumResponseMilliseconds: 1200,
      passwordResetMinimumResponseMilliseconds: 1500,
      webAppOrigins: ['https://app.example.com', 'https://admin.example.com'],
      allowUnlistedWebOrigins: false,
      secureWebCookies: true
    });
  });

  it('allows local timing overrides and an empty origin list only in explicit local modes', () => {
    expect(readApiSecurityConfig({
      NODE_ENV: 'test',
      REGISTRATION_MIN_RESPONSE_MS: '0',
      PASSWORD_RESET_MIN_RESPONSE_MS: '0'
    })).toMatchObject({
      registrationMinimumResponseMilliseconds: 0,
      passwordResetMinimumResponseMilliseconds: 0,
      allowUnlistedWebOrigins: true,
      secureWebCookies: false
    });
  });

  it('requires a secure origin allowlist outside development and test', () => {
    expect(() => readApiSecurityConfig({
      NODE_ENV: 'staging'
    })).toThrow('WEB_APP_ORIGINS is required');

    expect(() => readApiSecurityConfig({
      NODE_ENV: 'production',
      WEB_APP_ORIGINS: 'http://app.example.com'
    })).toThrow('must use HTTPS');
  });

  it('rejects disabled enumeration timing outside development and test', () => {
    expect(() => readApiSecurityConfig({
      NODE_ENV: 'staging',
      REGISTRATION_MIN_RESPONSE_MS: '0',
      WEB_APP_ORIGINS: 'https://app.example.com'
    })).toThrow('REGISTRATION_MIN_RESPONSE_MS must be at least 1000');

    expect(() => readApiSecurityConfig({
      NODE_ENV: 'production',
      PASSWORD_RESET_MIN_RESPONSE_MS: '0',
      WEB_APP_ORIGINS: 'https://app.example.com'
    })).toThrow('PASSWORD_RESET_MIN_RESPONSE_MS must be at least 1000');
  });

  it('rejects an unset runtime environment', () => {
    expect(() => readApiSecurityConfig({})).toThrow();
  });

  it('rejects web origin values containing paths', () => {
    expect(() => readApiSecurityConfig({
      NODE_ENV: 'development',
      WEB_APP_ORIGINS: 'https://app.example.com/path'
    })).toThrow('WEB_APP_ORIGINS entry must be an origin');
  });

  it('parses a production SMTP configuration with paired credentials', () => {
    expect(readPasswordResetSmtpConfig({
      PASSWORD_RESET_SMTP_HOST: 'smtp.example.com',
      PASSWORD_RESET_SMTP_PORT: '465',
      PASSWORD_RESET_SMTP_SECURE: 'true',
      PASSWORD_RESET_SMTP_USER: 'mailer',
      PASSWORD_RESET_SMTP_PASSWORD: 'secret',
      PASSWORD_RESET_EMAIL_FROM: 'Puls <no-reply@example.com>'
    })).toEqual({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'mailer',
      password: 'secret',
      from: 'Puls <no-reply@example.com>'
    });
  });

  it('supports trusted SMTP relays without authentication credentials', () => {
    expect(readPasswordResetSmtpConfig({
      PASSWORD_RESET_SMTP_HOST: 'smtp.internal.example.com',
      PASSWORD_RESET_SMTP_PORT: '25',
      PASSWORD_RESET_SMTP_SECURE: 'false',
      PASSWORD_RESET_SMTP_USER: '',
      PASSWORD_RESET_SMTP_PASSWORD: '',
      PASSWORD_RESET_EMAIL_FROM: 'Puls <no-reply@example.com>'
    })).toMatchObject({
      user: null,
      password: null
    });
  });
});
