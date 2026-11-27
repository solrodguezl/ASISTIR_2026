import * as Crypto from 'expo-crypto';

import { apiAuth } from '../api/authorizedClient';
import { encolar, listarOperaciones, type TipoOperacion } from './outbox';
import { estaEnLinea, esErrorDeRed } from './red';
import { sincronizar } from './sync';

export const nuevoId = () => Crypto.randomUUID();

export interface Guardado<T> {
  datos: T;
  /** true si quedó guardado en el teléfono y se enviará al volver la conexión. */
  enCola: boolean;
}

interface OpcionesEscritura<T> {
  id: string;
  tipo: TipoOperacion;
  endpoint: string;
  body: Record<string, unknown>;
  resumen: string;
  /** Lo que se muestra en pantalla mientras la operación no llegue al servidor. */
  resultadoLocal: () => T;
}

/**
 * Escribe en el backend si se puede; si no, guarda la operación en la cola.
 *
 * - Con conexión y sin nada pendiente: se envía directo (con Idempotency-Key)
 *   y los errores del servidor (validación, 409…) llegan a la pantalla igual
 *   que antes.
 * - Sin conexión, o si ya hay operaciones en cola (para no adelantarse a
 *   ellas y respetar el orden), o si el envío directo falla por red: se encola
 *   con el mismo id y se dispara la sincronización.
 */
export async function escribirOEncolar<T>(opts: OpcionesEscritura<T>): Promise<Guardado<T>> {
  const hayPendientes = (await listarOperaciones()).some((o) => o.estado === 'PENDIENTE');

  if (!hayPendientes && (await estaEnLinea())) {
    try {
      const datos = await apiAuth<T>(opts.endpoint, {
        method: 'POST',
        headers: { 'Idempotency-Key': opts.id },
        body: JSON.stringify(opts.body),
      });

      return { datos, enCola: false };
    } catch (error) {
      if (!esErrorDeRed(error)) throw error;
    }
  }

  await encolar({
    id: opts.id,
    tipo: opts.tipo,
    endpoint: opts.endpoint,
    body: opts.body,
    resumen: opts.resumen,
  });

  void sincronizar();

  return { datos: opts.resultadoLocal(), enCola: true };
}
