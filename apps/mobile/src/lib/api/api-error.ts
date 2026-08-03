import type { AuthErrorCode } from '@health/shared';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: AuthErrorCode | null = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
