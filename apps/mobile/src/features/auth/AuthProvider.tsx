import type { AuthResponse, LoginRequest, RegisterRequest } from '@health/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import {
  getCurrentUser,
  login,
  logout,
  refreshSession,
  register
} from '@/features/auth/api/auth-api';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession
} from '@/features/auth/model/auth-storage';
import { ApiError } from '@/lib/api/api-error';

type AuthContextValue = {
  session: AuthResponse | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (input: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  refreshSession: () => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function shouldClearStoredSession(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

async function refreshStoredSession(refreshToken: string): Promise<AuthResponse> {
  const nextSession = await refreshSession({ refreshToken });
  await saveAuthSession(nextSession);

  return nextSession;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (nextSession) => {
      await saveAuthSession(nextSession);
      setSession(nextSession);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: async (nextSession) => {
      await saveAuthSession(nextSession);
      setSession(nextSession);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  async function clearSessionState(): Promise<void> {
    await clearAuthSession();
    setSession(null);
    queryClient.removeQueries({ queryKey: ['profile'] });
  }

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedSession = await loadAuthSession();

      if (!storedSession) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser(storedSession.accessToken);
        const verifiedSession: AuthResponse = {
          accessToken: storedSession.accessToken,
          refreshToken: storedSession.refreshToken,
          user: currentUser.user
        };

        await saveAuthSession(verifiedSession);

        if (isMounted) {
          setSession(verifiedSession);
        }
      } catch (error) {
        if (shouldClearStoredSession(error)) {
          try {
            const refreshedSession = await refreshStoredSession(storedSession.refreshToken);

            if (isMounted) {
              setSession(refreshedSession);
            }
          } catch (refreshError) {
            if (shouldClearStoredSession(refreshError)) {
              await clearAuthSession();
              queryClient.removeQueries({ queryKey: ['profile'] });

              if (isMounted) {
                setSession(null);
              }
            } else if (isMounted) {
              setSession(storedSession);
            }
          }
        } else if (isMounted) {
          setSession(storedSession);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      accessToken: session?.accessToken ?? null,
      isLoading,
      login: async (input) => {
        await loginMutation.mutateAsync(input);
      },
      register: async (input) => {
        await registerMutation.mutateAsync(input);
      },
      refreshSession: async () => {
        if (!session) {
          return null;
        }

        try {
          const nextSession = await refreshStoredSession(session.refreshToken);

          setSession(nextSession);
          await queryClient.invalidateQueries({ queryKey: ['profile'] });

          return nextSession;
        } catch (error) {
          if (shouldClearStoredSession(error)) {
            await clearSessionState();
            return null;
          }

          throw error;
        }
      },
      logout: async () => {
        if (session) {
          await logout({ refreshToken: session.refreshToken }).catch(() => undefined);
        }

        await clearSessionState();
      }
    }),
    [isLoading, loginMutation, queryClient, registerMutation, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
