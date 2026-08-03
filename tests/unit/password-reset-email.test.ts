import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendMailMock = vi.fn();
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
const initialNodeEnvironment = process.env.NODE_ENV;

vi.mock('nodemailer', () => ({
  default: {
    createTransport: createTransportMock
  }
}));

describe('password reset email security', () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = 'current-auth-secret-value-with-32-characters';
    process.env.NODE_ENV = 'test';
    delete process.env.AUTH_TOKEN_PREVIOUS_SECRETS;
    delete process.env.PASSWORD_RESET_EMAIL_DELIVERY_MODE;
    createTransportMock.mockClear();
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.AUTH_TOKEN_SECRET;
    delete process.env.AUTH_TOKEN_PREVIOUS_SECRETS;
    delete process.env.PASSWORD_RESET_EMAIL_DELIVERY_MODE;
    if (initialNodeEnvironment === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = initialNodeEnvironment;
    }
  });

  it('requires STARTTLS for SMTP connections that do not use implicit TLS', async () => {
    const { createSmtpPasswordResetEmailSender } = await import(
      '../../apps/api/src/features/auth/password-reset-email.smtp.js'
    );

    createSmtpPasswordResetEmailSender({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'smtp-user',
      password: 'smtp-password',
      from: 'security@example.com'
    });

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        secure: false,
        requireTLS: true,
        socketTimeout: 30_000
      })
    );
  });

  it('refuses to log reset codes outside development and test', async () => {
    process.env.NODE_ENV = 'staging';
    process.env.PASSWORD_RESET_EMAIL_DELIVERY_MODE = 'log';
    const { createPasswordResetEmailSender } = await import(
      '../../apps/api/src/features/auth/password-reset-email.factory.js'
    );

    expect(() => createPasswordResetEmailSender()).toThrow(
      'Password reset codes may only be logged in development or test'
    );
  });

  it('decrypts queued codes after an auth secret rotation', async () => {
    const { decryptPasswordResetCode, encryptPasswordResetCode } = await import(
      '../../apps/api/src/features/auth/password-reset-email.cipher.js'
    );
    const encryptedCode = encryptPasswordResetCode('123456');

    process.env.AUTH_TOKEN_SECRET = 'next-auth-secret-value-with-32-characters';
    process.env.AUTH_TOKEN_PREVIOUS_SECRETS =
      'current-auth-secret-value-with-32-characters';

    expect(decryptPasswordResetCode(encryptedCode)).toBe('123456');
    expect(encryptedCode).not.toContain('123456');
  });
});
