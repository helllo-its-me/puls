import type { AuthResponse, LoginRequest, RegisterRequest } from '@health/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { login as loginRequest, register as registerRequest } from '@/features/auth/api/auth-api';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession
} from '@/features/auth/model/auth-storage';

type AuthContextValue = {
  session: AuthResponse | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (input: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: async (nextSession) => {
      await saveAuthSession(nextSession);
      setSession(nextSession);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
  const registerMutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: async (nextSession) => {
      await saveAuthSession(nextSession);
      setSession(nextSession);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  useEffect(() => {
    let isMounted = true;

    void loadAuthSession().then((storedSession) => {
      if (!isMounted) {
        return;
      }

      setSession(storedSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
      logout: async () => {
        await clearAuthSession();
        setSession(null);
        queryClient.removeQueries({ queryKey: ['profile'] });
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
