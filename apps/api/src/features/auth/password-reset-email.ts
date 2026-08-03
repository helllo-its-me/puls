import { logger } from '../../common/logger.js';

export type PasswordResetEmail = {
  email: string;
  code: string;
  expiresAt: Date;
};

export type PasswordResetEmailSender = {
  sendPasswordResetCode: (email: PasswordResetEmail) => Promise<void>;
  sendEmailVerificationCode: (email: PasswordResetEmail) => Promise<void>;
  sendPasswordChangedNotice: (email: string) => Promise<void>;
};

export const devPasswordResetEmailSender: PasswordResetEmailSender = {
  sendPasswordResetCode: async (email) => {
    logger.info(
      {
        email: email.email,
        code: email.code,
        expiresAt: email.expiresAt.toISOString()
      },
      'Password reset code'
    );
  },
  sendEmailVerificationCode: async (email) => {
    logger.info(
      {
        email: email.email,
        code: email.code,
        expiresAt: email.expiresAt.toISOString()
      },
      'Email verification code'
    );
  },
  sendPasswordChangedNotice: async (email) => {
    logger.info({ email }, 'Password changed notification');
  }
};
