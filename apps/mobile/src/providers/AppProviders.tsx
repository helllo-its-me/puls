import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { LocalizationProvider } from '@/i18n/LocalizationProvider';
import { ApiError } from '@/lib/api/api-error';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState<QueryClient>(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status === 401) {
                return false;
              }

              return failureCount < 1;
            }
          }
        }
      })
  );

  return (
    <SafeAreaProvider>
      <LocalizationProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
}
