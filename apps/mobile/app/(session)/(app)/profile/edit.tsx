import { useRouter } from 'expo-router';

import { ProfileEditScreen } from '@/features/profile/ui/ProfileEditScreen';

export default function ProfileEditRoute() {
  const router = useRouter();
  const handleClose = () => {
    router.dismissTo('/profile');
  };

  return (
    <ProfileEditScreen
      onCancel={handleClose}
      onSaved={handleClose}
    />
  );
}
