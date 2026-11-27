import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Almacenamiento local de la app offline (cola de pendientes y caché de
 * lecturas). Usa AsyncStorage porque funciona igual en Android, iOS y web
 * (en web va sobre localStorage); expo-sqlite en web sigue en alpha y exige
 * cabeceras COOP/COEP en el hosting.
 *
 * No guardar aquí tokens ni contraseñas: no está cifrado (para eso está
 * expo-secure-store en authService).
 */
const PREFIJO = 'datafro:';

export async function leerJSON<T>(clave: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIJO + clave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function escribirJSON(clave: string, valor: unknown): Promise<void> {
  await AsyncStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
}

export async function borrarClave(clave: string): Promise<void> {
  await AsyncStorage.removeItem(PREFIJO + clave);
}
