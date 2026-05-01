import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';
import { useTranslation } from '@/i18n/LocalizationProvider';
import { getProfile } from '@/features/profile/api/get-profile';
import { buildProfileScreenViewData } from '@/features/profile/model/profile-screen-view';

export function useProfileQuery() {
  const { accessToken } = useAuth();
  const { locale, t } = useTranslation();

  return useQuery({
    queryKey: ['profile', accessToken],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      return getProfile(accessToken);
    },
    enabled: Boolean(accessToken),
    select: (profile) => buildProfileScreenViewData(profile, { locale, t })
  });
}
