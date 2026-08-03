import nodemailer from 'nodemailer';

import type { PasswordResetSmtpConfig } from './password-reset-email.config.js';
import type { PasswordResetEmailSender } from './password-reset-email.js';

const passwordResetEmailSubject = 'Your Puls password reset code';
const passwordChangedEmailSubject = 'Your Puls password was changed';
const emailVerificationSubject = 'Verify your Puls email';
const smtpConnectionTimeoutMilliseconds = 10_000;
const smtpGreetingTimeoutMilliseconds = 10_000;
const smtpSocketTimeoutMilliseconds = 30_000;

function createPasswordResetEmailText(code: string, expiresAt: Date): string {
  return [
    `Your Puls password reset code is ${code}.`,
    `It expires at ${expiresAt.toISOString()}.`,
    'If you did not request this code, you can ignore this email.'
  ].join('\n\n');
}

export function createSmtpPasswordResetEmailSender(
  config: PasswordResetSmtpConfig
): PasswordResetEmailSender {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    connectionTimeout: smtpConnectionTimeoutMilliseconds,
    greetingTimeout: smtpGreetingTimeoutMilliseconds,
    socketTimeout: smtpSocketTimeoutMilliseconds,
    auth: config.user && config.password
      ? {
          user: config.user,
          pass: config.password
        }
      : undefined
  });

  return {
    sendPasswordResetCode: async (email) => {
      await transporter.sendMail({
        from: config.from,
        to: email.email,
        subject: passwordResetEmailSubject,
        text: createPasswordResetEmailText(email.code, email.expiresAt)
      });
    },
    sendEmailVerificationCode: async (email) => {
      await transporter.sendMail({
        from: config.from,
        to: email.email,
        subject: emailVerificationSubject,
        text: [
          `Your Puls email verification code is ${email.code}.`,
          `It expires at ${email.expiresAt.toISOString()}.`,
          'If you did not create this account, you can ignore this email.'
        ].join('\n\n')
      });
    },
    sendPasswordChangedNotice: async (email) => {
      await transporter.sendMail({
        from: config.from,
        to: email,
        subject: passwordChangedEmailSubject,
        text: [
          'Your Puls password was changed.',
          'If you did not make this change, contact support immediately.'
        ].join('\n\n')
      });
    }
  };
}
