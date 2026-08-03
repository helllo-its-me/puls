import {
  nativeAuthResponseSchema,
  type AuthResponse,
  type NativeAuthResponse
} from '@health/shared';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const authSessionStorageKey = 'auth-session';

async function getStoredSessionValue(): Promise<string | null> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(authSessionStorageKey);
    return null;
  }

  return SecureStore.getItemAsync(authSessionStorageKey);
}

async function setStoredSessionValue(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(authSessionStorageKey);
    return;
  }

  await SecureStore.setItemAsync(authSessionStorageKey, value);
}

async function removeStoredSessionValue(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(authSessionStorageKey);
    return;
  }

  await SecureStore.deleteItemAsync(authSessionStorageKey);
}

export async function loadAuthSession(): Promise<AuthResponse | null> {
  const storedValue = await getStoredSessionValue();

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    const session = nativeAuthResponseSchema.safeParse(parsedValue);

    return session.success ? session.data : null;
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: AuthResponse): Promise<void> {
  if (Platform.OS === 'web') {
    await removeStoredSessionValue();
    return;
  }

  const nativeSession: NativeAuthResponse = nativeAuthResponseSchema.parse(session);

  await setStoredSessionValue(JSON.stringify(nativeSession));
}

export async function clearAuthSession(): Promise<void> {
  await removeStoredSessionValue();
}
