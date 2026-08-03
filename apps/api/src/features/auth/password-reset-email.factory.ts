import { isLocalRuntimeMode, readRuntimeMode } from '../../app/runtime-mode.js';
import { readPasswordResetSmtpConfig } from './password-reset-email.config.js';
import { createSmtpPasswordResetEmailSender } from './password-reset-email.smtp.js';
import {
  devPasswordResetEmailSender,
  type PasswordResetEmailSender
} from './password-reset-email.js';

type PasswordResetEmailDeliveryMode = 'log' | 'smtp';

function readPasswordResetEmailDeliveryMode(): PasswordResetEmailDeliveryMode {
  const configuredMode = process.env.PASSWORD_RESET_EMAIL_DELIVERY_MODE;
  const isLocalRuntime = isLocalRuntimeMode(readRuntimeMode());

  if (configuredMode === 'smtp') {
    return configuredMode;
  }

  if (configuredMode === 'log') {
    if (!isLocalRuntime) {
      throw new Error('Password reset codes may only be logged in development or test');
    }

    return configuredMode;
  }

  if (isLocalRuntime) {
    return 'log';
  }

  throw new Error('PASSWORD_RESET_EMAIL_DELIVERY_MODE must be set to smtp');
}

export function createPasswordResetEmailSender(): PasswordResetEmailSender {
  if (readPasswordResetEmailDeliveryMode() === 'log') {
    return devPasswordResetEmailSender;
  }

  return createSmtpPasswordResetEmailSender(readPasswordResetSmtpConfig());
}
