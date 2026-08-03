import { beforeEach, describe, expect, it, vi } from 'vitest';

const claimPasswordResetEmailJobMock = vi.fn();
const deleteFinishedPasswordResetEmailJobsMock = vi.fn();
const markPasswordResetEmailJobFailedMock = vi.fn();
const markPasswordResetEmailJobSentMock = vi.fn();
const retryPasswordResetEmailJobMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/password-reset-email-job.repository.js', () => ({
  claimPasswordResetEmailJob: claimPasswordResetEmailJobMock,
  deleteFinishedPasswordResetEmailJobs: deleteFinishedPasswordResetEmailJobsMock,
  markPasswordResetEmailJobFailed: markPasswordResetEmailJobFailedMock,
  markPasswordResetEmailJobSent: markPasswordResetEmailJobSentMock,
  retryPasswordResetEmailJob: retryPasswordResetEmailJobMock
}));

describe('password reset email worker', () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-token-secret-value-01';
    claimPasswordResetEmailJobMock.mockReset();
    deleteFinishedPasswordResetEmailJobsMock.mockReset();
    markPasswordResetEmailJobFailedMock.mockReset();
    markPasswordResetEmailJobSentMock.mockReset();
    retryPasswordResetEmailJobMock.mockReset();
    deleteFinishedPasswordResetEmailJobsMock.mockResolvedValue(undefined);
    markPasswordResetEmailJobFailedMock.mockResolvedValue(undefined);
    markPasswordResetEmailJobSentMock.mockResolvedValue(undefined);
    retryPasswordResetEmailJobMock.mockResolvedValue(undefined);
  });

  it('delivers a queued reset code outside the HTTP request', async () => {
    const { encryptPasswordResetCode } = await import(
      '../../apps/api/src/features/auth/password-reset-email.cipher.js'
    );
    const sender = {
      sendEmailVerificationCode: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetCode: vi.fn().mockResolvedValue(undefined),
      sendPasswordChangedNotice: vi.fn().mockResolvedValue(undefined)
    };
    const job = {
      id: 'reset-email-job',
      kind: 'reset-code' as const,
      email: 'user@example.com',
      encryptedCode: encryptPasswordResetCode('123456'),
      codeExpiresAt: new Date('2099-08-01T10:10:00.000Z'),
      attempts: 1
    };
    claimPasswordResetEmailJobMock
      .mockResolvedValueOnce(job)
      .mockResolvedValueOnce(null);
    const { processPasswordResetEmailJobs } = await import(
      '../../apps/api/src/features/auth/password-reset-email.delivery.js'
    );

    const now = new Date('2026-08-01T10:00:00.000Z');

    await processPasswordResetEmailJobs(sender, () => now);

    expect(sender.sendPasswordResetCode).toHaveBeenCalledWith({
      email: 'user@example.com',
      code: '123456',
      expiresAt: job.codeExpiresAt
    });
    expect(markPasswordResetEmailJobSentMock).toHaveBeenCalledWith(
      job,
      now
    );
  });

  it('retries a transient delivery failure without failing the HTTP flow', async () => {
    const { encryptPasswordResetCode } = await import(
      '../../apps/api/src/features/auth/password-reset-email.cipher.js'
    );
    const sender = {
      sendEmailVerificationCode: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetCode: vi.fn().mockRejectedValue(new Error('SMTP unavailable')),
      sendPasswordChangedNotice: vi.fn().mockResolvedValue(undefined)
    };
    const job = {
      id: 'reset-email-job',
      kind: 'reset-code' as const,
      email: 'user@example.com',
      encryptedCode: encryptPasswordResetCode('123456'),
      codeExpiresAt: new Date('2026-08-01T10:10:00.000Z'),
      attempts: 1
    };
    claimPasswordResetEmailJobMock
      .mockResolvedValueOnce(job)
      .mockResolvedValueOnce(null);
    const { processPasswordResetEmailJobs } = await import(
      '../../apps/api/src/features/auth/password-reset-email.delivery.js'
    );

    const now = new Date('2026-08-01T10:00:00.000Z');
    const failedAt = new Date('2026-08-01T10:00:01.000Z');
    const getCurrentTime = vi.fn()
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(failedAt)
      .mockReturnValueOnce(failedAt);

    await processPasswordResetEmailJobs(sender, getCurrentTime);

    expect(retryPasswordResetEmailJobMock).toHaveBeenCalledWith(
      job,
      new Date('2026-08-01T10:00:06.000Z')
    );
    expect(markPasswordResetEmailJobSentMock).not.toHaveBeenCalled();
  });
});
