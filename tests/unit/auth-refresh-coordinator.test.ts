import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'native' }
}));

describe('auth refresh coordinator', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shares one in-flight refresh between concurrent callers', async () => {
    const operation = vi.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-id',
        email: 'user@example.com'
      }
    });
    const { runCoordinatedRefresh } = await import(
      '../../apps/mobile/src/features/auth/model/auth-refresh-coordinator.js'
    );

    const firstResult = runCoordinatedRefresh(operation);
    const secondResult = runCoordinatedRefresh(operation);

    await expect(firstResult).resolves.toEqual(await secondResult);
    expect(operation).toHaveBeenCalledOnce();
  });

  it('allows a new refresh after the current operation finishes', async () => {
    const operation = vi.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-id',
        email: 'user@example.com'
      }
    });
    const { runCoordinatedRefresh } = await import(
      '../../apps/mobile/src/features/auth/model/auth-refresh-coordinator.js'
    );

    await runCoordinatedRefresh(operation);
    await runCoordinatedRefresh(operation);

    expect(operation).toHaveBeenCalledTimes(2);
  });
});
