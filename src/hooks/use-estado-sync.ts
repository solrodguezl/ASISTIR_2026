import { useSyncExternalStore } from 'react';

import { obtenerEstadoSync, suscribirEstadoSync } from '../offline/sync';

/** Conexión, pendientes y errores de la cola offline, para pintar en la UI. */
export function useEstadoSync() {
  return useSyncExternalStore(suscribirEstadoSync, obtenerEstadoSync, obtenerEstadoSync);
}
