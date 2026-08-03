import { useMutation } from '@tanstack/react-query';

import {
  completePasswordReset,
  requestPasswordReset,
  verifyRegisteredEmail,
  verifyPasswordResetCode
} from '@/features/auth/api/auth-api';

export function usePasswordResetRequestMutation() {
  return useMutation({
    mutationFn: requestPasswordReset
  });
}

export function useRegistrationVerifyMutation() {
  return useMutation({
    mutationFn: verifyRegisteredEmail
  });
}

export function usePasswordResetVerifyMutation() {
  return useMutation({
    mutationFn: verifyPasswordResetCode
  });
}

export function usePasswordResetCompleteMutation() {
  return useMutation({
    mutationFn: completePasswordReset
  });
}
