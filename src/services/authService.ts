import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { apiClient } from '../api/client';
import type {
    LoginRequest,
    LoginResponse,
    RefreshResponse,
    Usuario,
} from '../types/auth';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

const isWeb = Platform.OS === 'web';

async function readStorage(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(key);
}

async function writeStorage(
  key: string,
  value: string,
): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Ignorar errores de almacenamiento en entorno web.
    }

    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function removeStorage(key: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Ignorar errores de almacenamiento en entorno web.
    }

    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiClient<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    },
  );

  await writeStorage(
    ACCESS_TOKEN_KEY,
    response.accessToken,
  );

  await writeStorage(
    REFRESH_TOKEN_KEY,
    response.refreshToken,
  );

  await writeStorage(
    USER_KEY,
    JSON.stringify(response.usuario),
  );

  return response;
}

export async function getAccessToken(): Promise<string | null> {
  return readStorage(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return readStorage(REFRESH_TOKEN_KEY);
}

export async function getStoredUser(): Promise<Usuario | null> {
  const storedUser = await readStorage(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as Usuario;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error('No existe refresh token');
  }

  const response = await apiClient<RefreshResponse>(
    '/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
  );

  await writeStorage(ACCESS_TOKEN_KEY, response.accessToken);

  return response.accessToken;
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();

  try {
    if (refreshToken) {
      await apiClient<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    await clearSession();
  }
}

export async function clearSession(): Promise<void> {
  await removeStorage(ACCESS_TOKEN_KEY);
  await removeStorage(REFRESH_TOKEN_KEY);
  await removeStorage(USER_KEY);
}