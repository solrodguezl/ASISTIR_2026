import { useEffect, useState } from 'react';

import {
  obtenerYo,
  type MiembroActual,
} from '../services/miembrosService';

/** Datos del usuario autenticado: nombre, rol y organización. */
export function useYo() {
  const [yo, setYo] = useState<MiembroActual | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerYo()
      .then((data) => {
        if (activo) setYo(data);
      })
      .catch((e) => {
        if (activo) {
          setError(e instanceof Error ? e.message : 'No se pudo cargar tu usuario.');
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  return { yo, error };
}
