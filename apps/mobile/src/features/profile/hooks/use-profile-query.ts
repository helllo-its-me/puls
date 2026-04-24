import { useQuery } from '@tanstack/react-query';

import { getProfile } from '@/features/profile/api/get-profile';

export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  });
}
