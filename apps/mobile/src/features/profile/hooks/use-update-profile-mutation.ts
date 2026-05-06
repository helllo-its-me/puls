import type { UpdateProfileRequest } from '@health/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';
import { updateProfile } from '@/features/profile/api/get-profile';
import { ApiError } from '@/lib/api/api-error';

export function useUpdateProfileMutation() {
  const { accessToken, refreshSession } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileRequest) => {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      try {
        return await updateProfile(input, accessToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        const nextSession = await refreshSession();

        if (!nextSession) {
          throw error;
        }

        return updateProfile(input, nextSession.accessToken);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
}
