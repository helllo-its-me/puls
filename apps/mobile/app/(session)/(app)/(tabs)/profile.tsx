import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileScreen } from '@/features/profile/ui/ProfileScreen';

export default function ProfileRoute() {
  const { logout } = useAuth();
  const router = useRouter();
  const handleEditProfile = useCallback(() => {
    router.push('/profile/edit');
  }, [router]);
  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  return (
    <ProfileScreen
      onEditProfile={handleEditProfile}
      onLogout={handleLogout}
      onUnauthorized={handleLogout}
    />
  );
}
