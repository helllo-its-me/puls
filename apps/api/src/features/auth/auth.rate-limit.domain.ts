export type AuthRateLimitAction =
  | 'login'
  | 'register'
  | 'registration-verify'
  | 'password-reset-request'
  | 'password-reset-verify';

export type AuthRateLimitScope = 'account' | 'network';

export type AuthRateLimitState = {
  attempts: number;
  windowStartedAt: Date;
};
