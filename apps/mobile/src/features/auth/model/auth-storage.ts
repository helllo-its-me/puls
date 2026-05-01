import AsyncStorage from '@react-native-async-storage/async-storage';
import { authResponseSchema, type AuthResponse } from '@health/shared';

const authSessionStorageKey = 'auth-session';

export async function loadAuthSession(): Promise<AuthResponse | null> {
  const storedValue = await AsyncStorage.getItem(authSessionStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    const session = authResponseSchema.safeParse(parsedValue);

    return session.success ? session.data : null;
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: AuthResponse): Promise<void> {
  await AsyncStorage.setItem(authSessionStorageKey, JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(authSessionStorageKey);
}
