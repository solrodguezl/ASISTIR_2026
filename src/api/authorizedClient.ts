import { ApiError, apiClient } from './client';
import {
  getAccessToken,
  refreshAccessToken,
} from '../services/authService';

/**
 * Llama al API con el access token guardado. Si el servidor responde 401
 * (el token dura 15 minutos), renueva el token con el refresh token y
 * reintenta una vez.
 */
export async function apiAuth<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  if (!token) {
    throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  }

  try {
    return await apiClient<T>(endpoint, { ...options, token });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    let nuevoToken: string;

    try {
      nuevoToken = await refreshAccessToken();
    } catch {
      throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
    }

    return apiClient<T>(endpoint, { ...options, token: nuevoToken });
  }
}
