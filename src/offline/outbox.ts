import { getStoredUser } from '../services/authService';
import { escribirJSON, leerJSON } from './storage';

/**
 * Cola de escrituras pendientes ("outbox"). Cada operación guarda el endpoint y
 * el body exactos que hay que mandar al backend, y su `id` (UUID generado en el
 * teléfono) viaja como header `Idempotency-Key`: reenviarla nunca duplica datos.
 *
 * Se envía en orden FIFO: una actividad creada sin conexión siempre sube antes
 * que sus asistencias, y los capítulos de una caracterización en el orden en
 * que se guardaron.
 */
export type TipoOperacion =
  | 'CREAR_ACTIVIDAD'
  | 'REGISTRAR_ASISTENCIA'
  | 'GUARDAR_CARACTERIZACION';

export interface OperacionPendiente {
  id: string;
  tipo: TipoOperacion;
  endpoint: string;
  body: Record<string, unknown>;
  /** Solo la sincroniza el mismo usuario que la creó (su token y su organización). */
  usuarioId: string;
  /** Texto corto para mostrar en la UI, ej. "Asistencia · Ana Pérez". */
  resumen: string;
  creadoEn: string;
  intentos: number;
  estado: 'PENDIENTE' | 'ERROR';
  ultimoError?: string;
}

const CLAVE = 'outbox';

type Listener = () => void;
const listeners = new Set<Listener>();

// Serializa lecturas/escrituras de la cola para que dos guardados seguidos no
// se pisen (AsyncStorage no tiene transacciones).
let cadena: Promise<unknown> = Promise.resolve();
function enSerie<T>(tarea: () => Promise<T>): Promise<T> {
  const resultado = cadena.then(tarea, tarea);
  cadena = resultado.catch(() => undefined);
  return resultado;
}

const leerTodas = async () => (await leerJSON<OperacionPendiente[]>(CLAVE)) ?? [];

async function modificar(fn: (ops: OperacionPendiente[]) => OperacionPendiente[]) {
  await enSerie(async () => {
    await escribirJSON(CLAVE, fn(await leerTodas()));
  });
  listeners.forEach((l) => l());
}

export async function usuarioActualId(): Promise<string | null> {
  const usuario = await getStoredUser();
  return usuario ? String(usuario.id) : null;
}

/** Operaciones del usuario con sesión iniciada, en orden de creación. */
export async function listarOperaciones(): Promise<OperacionPendiente[]> {
  const usuarioId = await usuarioActualId();
  if (!usuarioId) return [];

  const ops = await enSerie(leerTodas);
  return ops.filter((op) => op.usuarioId === usuarioId);
}

export async function encolar(
  op: Omit<OperacionPendiente, 'usuarioId' | 'creadoEn' | 'intentos' | 'estado'>,
): Promise<void> {
  const usuarioId = await usuarioActualId();
  if (!usuarioId) {
    throw new Error('Inicia sesión para guardar sin conexión.');
  }

  await modificar((ops) => [
    ...ops.filter((o) => o.id !== op.id),
    {
      ...op,
      usuarioId,
      creadoEn: new Date().toISOString(),
      intentos: 0,
      estado: 'PENDIENTE',
    },
  ]);
}

export const quitarOperacion = (id: string) =>
  modificar((ops) => ops.filter((o) => o.id !== id));

export const actualizarOperacion = (id: string, cambios: Partial<OperacionPendiente>) =>
  modificar((ops) => ops.map((o) => (o.id === id ? { ...o, ...cambios } : o)));

/** Vuelve a poner en cola las operaciones que fallaron (botón "Reintentar"). */
export async function reintentarErrores(): Promise<void> {
  const usuarioId = await usuarioActualId();
  await modificar((ops) =>
    ops.map((o) =>
      o.usuarioId === usuarioId && o.estado === 'ERROR'
        ? { ...o, estado: 'PENDIENTE', ultimoError: undefined }
        : o,
    ),
  );
}

/** Descarta definitivamente las operaciones con error del usuario actual. */
export async function descartarErrores(): Promise<void> {
  const usuarioId = await usuarioActualId();
  await modificar((ops) =>
    ops.filter((o) => !(o.usuarioId === usuarioId && o.estado === 'ERROR')),
  );
}

export function suscribirOutbox(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
