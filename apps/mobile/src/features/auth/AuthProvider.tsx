import type { AuthResponse, LoginRequest, RegisterRequest } from '@health/shared';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { login, register } from '@/features/auth/api/auth-api';
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
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        const nextSession = await login(input);
        await saveAuthSession(nextSession);
        setSession(nextSession);
      },
      register: async (input) => {
        const nextSession = await register(input);
        await saveAuthSession(nextSession);
        setSession(nextSession);
      },
      logout: async () => {
        await clearAuthSession();
        setSession(null);
      }
    }),
    [isLoading, session]
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
