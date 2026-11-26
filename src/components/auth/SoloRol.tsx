import type { ReactNode } from 'react';

import { useSesion } from '../../hooks/use-sesion';
import { nivelDe } from '../../constants/roles';

interface SoloRolProps {
  /** Nivel mínimo requerido: GESTOR < COORDINADOR < DIRECTOR < ADMINISTRADOR INVESTIGATIVO. */
  min?: 'GESTOR' | 'COORDINADOR' | 'DIRECTOR' | 'ADMINISTRADOR INVESTIGATIVO';
  /** Permiso puntual requerido (ej. "solicitud_rol.revisar"), en vez de un nivel. */
  permiso?: string;
  children: ReactNode;
  /** Qué mostrar mientras no se cumple la condición (por defecto, nada). */
  fallback?: ReactNode;
}

/**
 * Muestra sus hijos solo si el usuario autenticado cumple el nivel mínimo o
 * el permiso pedido. Mientras la sesión carga, no muestra nada (evita el
 * parpadeo de mostrar y luego ocultar un botón que no debía verse).
 */
export function SoloRol({ min, permiso, children, fallback = null }: SoloRolProps) {
  const { sesion, cargando } = useSesion();

  if (cargando && !sesion) {
    return null;
  }

  if (permiso) {
    return sesion?.permisos.includes(permiso) ? <>{children}</> : <>{fallback}</>;
  }

  if (min) {
    const cumple = nivelDe(sesion?.rol) >= nivelDe(min);
    return cumple ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
}
