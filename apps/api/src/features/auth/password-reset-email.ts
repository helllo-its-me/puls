import { logger } from '../../common/logger.js';

export type PasswordResetEmail = {
  email: string;
  code: string;
  expiresAt: Date;
};

export type PasswordResetEmailSender = {
  sendPasswordResetCode: (email: PasswordResetEmail) => Promise<void>;
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
  }
};
