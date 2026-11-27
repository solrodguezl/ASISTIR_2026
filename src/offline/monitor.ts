import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

import { registrarSyncEnSegundoPlano } from './backgroundSync';
import { hayConexion } from './red';
import { marcarEnLinea, obtenerEstadoSync, refrescarContadores, sincronizar } from './sync';

const INTERVALO_REINTENTO_MS = 60_000;

/**
 * "Actividad" que vigila la conexión mientras hay sesión iniciada y dispara la
 * sincronización:
 *  - al recuperar la red (NetInfo),
 *  - al volver la app a primer plano,
 *  - cada minuto mientras la app está abierta y queda algo pendiente
 *    (cubre redes inestables y servidores que tardan en despertar),
 *  - y en segundo plano con expo-background-task (solo Android/iOS; el
 *    sistema operativo decide cuándo, mínimo cada 15 minutos).
 *
 * Devuelve una función para detener el monitor (al cerrar sesión).
 */
export function iniciarMonitorSync(): () => void {
  void refrescarContadores().then(() => sincronizar());
  void registrarSyncEnSegundoPlano();

  const quitarNetInfo = NetInfo.addEventListener((estadoRed) => {
    const enLinea = hayConexion(estadoRed);
    const estabaSinRed = !obtenerEstadoSync().enLinea;

    marcarEnLinea(enLinea);
    if (enLinea && estabaSinRed) void sincronizar();
  });

  const subAppState = AppState.addEventListener('change', (estadoApp) => {
    if (estadoApp === 'active') void sincronizar();
  });

  const intervalo = setInterval(() => {
    const { pendientes, enLinea } = obtenerEstadoSync();
    if (pendientes > 0 && enLinea && AppState.currentState === 'active') {
      void sincronizar();
    }
  }, INTERVALO_REINTENTO_MS);

  return () => {
    quitarNetInfo();
    subAppState.remove();
    clearInterval(intervalo);
  };
}
