import { ApiError } from '../api/client';
import { apiAuth } from '../api/authorizedClient';
import {
  actualizarOperacion,
  listarOperaciones,
  quitarOperacion,
  suscribirOutbox,
} from './outbox';
import { estaEnLinea, esErrorTransitorio } from './red';

export interface EstadoSync {
  enLinea: boolean;
  sincronizando: boolean;
  pendientes: number;
  errores: number;
  ultimoError: string | null;
  /** El refresh token venció: hay que iniciar sesión para poder enviar la cola. */
  sesionExpirada: boolean;
  ultimaSincronizacion: string | null;
}

let estado: EstadoSync = {
  enLinea: true,
  sincronizando: false,
  pendientes: 0,
  errores: 0,
  ultimoError: null,
  sesionExpirada: false,
  ultimaSincronizacion: null,
};

const listeners = new Set<() => void>();

function actualizarEstado(cambios: Partial<EstadoSync>) {
  estado = { ...estado, ...cambios };
  listeners.forEach((l) => l());
}

export const obtenerEstadoSync = () => estado;

export function suscribirEstadoSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function marcarEnLinea(enLinea: boolean) {
  if (estado.enLinea !== enLinea) actualizarEstado({ enLinea });
}

/** Recalcula los contadores de la UI a partir de la cola guardada. */
export async function refrescarContadores(): Promise<void> {
  const ops = await listarOperaciones();
  const conError = ops.filter((o) => o.estado === 'ERROR');

  actualizarEstado({
    pendientes: ops.length - conError.length,
    errores: conError.length,
    ultimoError: conError.at(-1)?.ultimoError ?? null,
  });
}

suscribirOutbox(() => {
  void refrescarContadores();
});

let enCurso: Promise<void> | null = null;

/**
 * Envía al backend, en orden, todo lo que quedó guardado en el teléfono.
 * Se puede llamar cuantas veces se quiera: si ya hay una sincronización en
 * curso, devuelve esa misma promesa.
 *
 * Por cada operación:
 *  - 2xx o 409 (ya existía, ej. asistencia repetida) → se quita de la cola.
 *  - red caída / 5xx → se detiene y se reintenta en el siguiente disparo
 *    (sin saltarse elementos, para respetar el orden).
 *  - 401 (no se pudo renovar el token) → se detiene y se pide iniciar sesión;
 *    la cola NO se borra.
 *  - otro 4xx (validación, permiso) → se marca ERROR y se sigue con la
 *    siguiente; el usuario la ve en el aviso y puede reintentarla o descartarla.
 */
export function sincronizar(): Promise<void> {
  enCurso ??= ejecutarSincronizacion().finally(() => {
    enCurso = null;
  });

  return enCurso;
}

async function ejecutarSincronizacion(): Promise<void> {
  const enLinea = await estaEnLinea();
  marcarEnLinea(enLinea);

  if (!enLinea) {
    await refrescarContadores();
    return;
  }

  const pendientes = (await listarOperaciones()).filter((o) => o.estado === 'PENDIENTE');

  if (pendientes.length === 0) {
    await refrescarContadores();
    return;
  }

  actualizarEstado({ sincronizando: true });

  try {
    for (const op of pendientes) {
      try {
        await apiAuth<unknown>(op.endpoint, {
          method: 'POST',
          headers: { 'Idempotency-Key': op.id },
          body: JSON.stringify(op.body),
        });

        await quitarOperacion(op.id);
        actualizarEstado({ sesionExpirada: false });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          await quitarOperacion(op.id);
          continue;
        }

        if (error instanceof ApiError && error.status === 401) {
          actualizarEstado({ sesionExpirada: true });
          return;
        }

        if (esErrorTransitorio(error)) {
          await actualizarOperacion(op.id, {
            intentos: op.intentos + 1,
            ultimoError: error instanceof Error ? error.message : String(error),
          });

          if (error instanceof ApiError && error.status === 0) marcarEnLinea(false);
          return;
        }

        await actualizarOperacion(op.id, {
          estado: 'ERROR',
          intentos: op.intentos + 1,
          ultimoError: error instanceof Error ? error.message : String(error),
        });
      }
    }

    actualizarEstado({ ultimaSincronizacion: new Date().toISOString() });
  } finally {
    actualizarEstado({ sincronizando: false });
    await refrescarContadores();
  }
}
