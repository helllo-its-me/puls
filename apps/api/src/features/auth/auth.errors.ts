export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidRefreshSessionError extends Error {
  constructor() {
    super('Invalid or expired refresh session');
    this.name = 'InvalidRefreshSessionError';
  }
}

export class InvalidEmailVerificationCodeError extends Error {
  constructor() {
    super('Invalid or expired email verification code');
    this.name = 'InvalidEmailVerificationCodeError';
  }
}

export class InvalidPasswordResetCodeError extends Error {
  constructor() {
    super('Invalid or expired reset code');
    this.name = 'InvalidPasswordResetCodeError';
  }
}

export class InvalidPasswordResetSessionError extends Error {
  constructor() {
    super('Invalid or expired password reset session');
    this.name = 'InvalidPasswordResetSessionError';
  }
}

export class AuthRateLimitExceededError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Too many authentication attempts');
    this.name = 'AuthRateLimitExceededError';
  }
}
