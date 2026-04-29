import { useQuery } from '@tanstack/react-query';

import { useTranslation } from '@/i18n/LocalizationProvider';
import { getProfile } from '@/features/profile/api/get-profile';
import { buildProfileScreenViewData } from '@/features/profile/model/profile-screen-view';

export function useProfileQuery() {
  const { locale, t } = useTranslation();

  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    select: (profile) => buildProfileScreenViewData(profile, { locale, t })
  });
}
