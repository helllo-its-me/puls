import { logger } from '../../common/logger.js';
import { decryptPasswordResetCode } from './password-reset-email.cipher.js';
import {
  emailVerificationCodeEmailJobKind,
  passwordChangedEmailJobKind,
  passwordResetCodeEmailJobKind,
  type PasswordResetEmailJob
} from './password-reset-email-job.domain.js';
import {
  claimPasswordResetEmailJob,
  deleteFinishedPasswordResetEmailJobs,
  markPasswordResetEmailJobFailed,
  markPasswordResetEmailJobSent,
  retryPasswordResetEmailJob
} from './password-reset-email-job.repository.js';
import type { PasswordResetEmailSender } from './password-reset-email.js';

const millisecondsPerSecond = 1000;
const millisecondsPerMinute = 60 * millisecondsPerSecond;
const millisecondsPerHour = 60 * millisecondsPerMinute;
const millisecondsPerDay = 24 * millisecondsPerHour;
const staleJobLockMilliseconds = 15 * millisecondsPerMinute;
const finishedJobRetentionMilliseconds = 7 * millisecondsPerDay;
const maximumJobsPerRun = 20;
const retryDelaysMilliseconds = [
  5 * millisecondsPerSecond,
  15 * millisecondsPerSecond,
  30 * millisecondsPerSecond,
  millisecondsPerMinute
];
const maximumDeliveryAttempts = retryDelaysMilliseconds.length + 1;

function isCodeEmailJob(job: PasswordResetEmailJob): boolean {
  return job.kind === passwordResetCodeEmailJobKind
    || job.kind === emailVerificationCodeEmailJobKind;
}

async function sendEmailJob(
  sender: PasswordResetEmailSender,
  job: PasswordResetEmailJob,
  now: Date
): Promise<void> {
  if (job.kind === passwordChangedEmailJobKind) {
    await sender.sendPasswordChangedNotice(job.email);
    return;
  }

  if (
    job.kind !== passwordResetCodeEmailJobKind
    && job.kind !== emailVerificationCodeEmailJobKind
    || !job.encryptedCode
    || !job.codeExpiresAt
  ) {
    throw new Error('Password reset code email job is incomplete');
  }

  if (job.codeExpiresAt <= now) {
    throw new Error('Password reset code email job expired');
  }

  const codeEmail = {
    email: job.email,
    code: decryptPasswordResetCode(job.encryptedCode),
    expiresAt: job.codeExpiresAt
  };

  if (job.kind === emailVerificationCodeEmailJobKind) {
    await sender.sendEmailVerificationCode(codeEmail);
    return;
  }

  await sender.sendPasswordResetCode(codeEmail);
}

async function handleDeliveryFailure(job: PasswordResetEmailJob, now: Date): Promise<void> {
  if (job.attempts >= maximumDeliveryAttempts) {
    await markPasswordResetEmailJobFailed(job, now);
    return;
  }

  const retryDelay = retryDelaysMilliseconds[job.attempts - 1];

  if (retryDelay === undefined) {
    await markPasswordResetEmailJobFailed(job, now);
    return;
  }

  await retryPasswordResetEmailJob(job, new Date(now.getTime() + retryDelay));
}

export async function processPasswordResetEmailJobs(
  sender: PasswordResetEmailSender,
  getCurrentTime: () => Date = () => new Date()
): Promise<void> {
  const cleanupStartedAt = getCurrentTime();

  await deleteFinishedPasswordResetEmailJobs(
    new Date(cleanupStartedAt.getTime() - finishedJobRetentionMilliseconds)
  );

  for (let processedJobs = 0; processedJobs < maximumJobsPerRun; processedJobs += 1) {
    const now = getCurrentTime();
    const job = await claimPasswordResetEmailJob(
      now,
      new Date(now.getTime() - staleJobLockMilliseconds)
    );

    if (!job) {
      return;
    }

    if (isCodeEmailJob(job) && job.codeExpiresAt && job.codeExpiresAt <= now) {
      await markPasswordResetEmailJobFailed(job, now);
      continue;
    }

    try {
      await sendEmailJob(sender, job, now);
      await markPasswordResetEmailJobSent(job, getCurrentTime());
    } catch (error: unknown) {
      await handleDeliveryFailure(job, getCurrentTime());
      logger.error(
        {
          jobId: job.id,
          attempt: job.attempts,
          errorName: error instanceof Error ? error.name : 'UnknownError'
        },
        'Failed to deliver password reset email job'
      );
    }
  }
}
