import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { LocalizationProvider } from '@/i18n/LocalizationProvider';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState<QueryClient>(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1
          }
        }
      })
  );

  return (
    <SafeAreaProvider>
      <LocalizationProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AuthProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
}
