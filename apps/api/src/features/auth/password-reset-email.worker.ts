import { logger } from '../../common/logger.js';
import { processPasswordResetEmailJobs } from './password-reset-email.delivery.js';
import { createPasswordResetEmailSender } from './password-reset-email.factory.js';

const workerPollMilliseconds = 1000;

export function startPasswordResetEmailWorker(): () => void {
  const sender = createPasswordResetEmailSender();
  let isProcessing = false;

  const run = async (): Promise<void> => {
    if (isProcessing) {
      return;
    }

    isProcessing = true;

    try {
      await processPasswordResetEmailJobs(sender);
    } catch (error: unknown) {
      logger.error(
        { errorName: error instanceof Error ? error.name : 'UnknownError' },
        'Password reset email worker failed'
      );
    } finally {
      isProcessing = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), workerPollMilliseconds);
  timer.unref();

  return () => clearInterval(timer);
}
