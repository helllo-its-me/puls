import { Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';
import { AuthLoadingScreen } from '@/features/auth/ui/AuthLoadingScreen';

export default function SessionLayout() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!auth.session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(auth.session)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
