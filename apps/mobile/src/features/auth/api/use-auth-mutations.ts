import { useMutation } from '@tanstack/react-query';

import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode
} from '@/features/auth/api/auth-api';

export function usePasswordResetRequestMutation() {
  return useMutation({
    mutationFn: requestPasswordReset
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
