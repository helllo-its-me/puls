import type { AuthResponse } from '@health/shared';
import { Platform } from 'react-native';

const webRefreshLockName = 'puls-auth-refresh';
let activeRefreshPromise: Promise<AuthResponse> | null = null;

async function runWithWebRefreshLock(
  operation: () => Promise<AuthResponse>
): Promise<AuthResponse> {
  if (
    Platform.OS !== 'web'
    || typeof navigator === 'undefined'
    || !navigator.locks
  ) {
    return operation();
  }

  return navigator.locks.request(webRefreshLockName, operation);
}

export function runCoordinatedRefresh(
  operation: () => Promise<AuthResponse>
): Promise<AuthResponse> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  const refreshPromise = (async () => {
    try {
      return await runWithWebRefreshLock(operation);
    } finally {
      activeRefreshPromise = null;
    }
  })();

  activeRefreshPromise = refreshPromise;

  return refreshPromise;
}
