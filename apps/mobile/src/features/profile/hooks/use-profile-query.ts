import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';
import { useTranslation } from '@/i18n/LocalizationProvider';
import { getProfile } from '@/features/profile/api/get-profile';
import { buildProfileScreenViewData } from '@/features/profile/model/profile-screen-view';
import { ApiError } from '@/lib/api/api-error';

export function useProfileQuery() {
  const { accessToken, refreshSession } = useAuth();
  const { locale, t } = useTranslation();

  return useQuery({
    queryKey: ['profile', accessToken],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      try {
        return await getProfile(accessToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        const nextSession = await refreshSession();

        if (!nextSession) {
          throw error;
        }

        return getProfile(nextSession.accessToken);
      }
    },
    enabled: Boolean(accessToken),
    select: (profile) => buildProfileScreenViewData(profile, { locale, t })
  });
}
