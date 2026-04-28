import { useQuery } from '@tanstack/react-query';

import { getProfile } from '@/features/profile/api/get-profile';
import { buildProfileScreenViewData } from '@/features/profile/model/profile-screen-view';

export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    select: buildProfileScreenViewData
  });
}
