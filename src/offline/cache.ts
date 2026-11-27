import { ApiError } from '../api/client';
import { usuarioActualId } from './outbox';
import { esErrorDeRed } from './red';
import { escribirJSON, leerJSON } from './storage';

// La caché se separa por usuario para que, si otra persona inicia sesión en el
// mismo teléfono, no vea los datos de la organización anterior.
async function claveUsuario(clave: string) {
  return `cache:${(await usuarioActualId()) ?? 'anon'}:${clave}`;
}

export async function leerCache<T>(clave: string): Promise<T | null> {
  return leerJSON<T>(await claveUsuario(clave));
}

export async function guardarCache(clave: string, valor: unknown): Promise<void> {
  try {
    await escribirJSON(await claveUsuario(clave), valor);
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en línea.
  }
}

/**
 * Lectura con respaldo local: si hay red se pide al backend y se guarda la
 * respuesta; si no hay red se devuelve la última copia guardada.
 */
export async function conCache<T>(clave: string, pedir: () => Promise<T>): Promise<T> {
  try {
    const datos = await pedir();
    void guardarCache(clave, datos);
    return datos;
  } catch (error) {
    if (!esErrorDeRed(error)) throw error;

    const guardado = await leerCache<T>(clave);
    if (guardado !== null) return guardado;

    throw new ApiError(
      'Sin conexión y todavía no hay datos guardados en este teléfono. Ábrelo una vez con internet para poder usarlo offline.',
      0,
    );
  }
}
