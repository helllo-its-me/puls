export const authModes = {
  login: 'login',
  register: 'register',
  requestPasswordReset: 'requestPasswordReset',
  verifyPasswordResetCode: 'verifyPasswordResetCode',
  resetPassword: 'resetPassword'
} as const;

export type AuthMode = typeof authModes[keyof typeof authModes];
