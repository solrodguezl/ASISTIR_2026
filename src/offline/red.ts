import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import { ApiError } from '../api/client';

/**
 * true si hay red utilizable. `isInternetReachable` es null mientras NetInfo
 * todavía no lo comprueba: en ese caso se confía en `isConnected` y, si la
 * petición falla, igual se encola (ver esErrorDeRed).
 */
export const hayConexion = (estado: NetInfoState) =>
  estado.isConnected !== false && estado.isInternetReachable !== false;

export async function estaEnLinea(): Promise<boolean> {
  try {
    return hayConexion(await NetInfo.fetch());
  } catch {
    return true;
  }
}

/** El servidor no respondió (sin red, timeout, DNS…): apiClient lo reporta con status 0. */
export const esErrorDeRed = (error: unknown) =>
  error instanceof ApiError && error.status === 0;

/** Errores que vale la pena reintentar más tarde (red caída o servidor con problemas). */
export const esErrorTransitorio = (error: unknown) =>
  error instanceof ApiError &&
  (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500);
