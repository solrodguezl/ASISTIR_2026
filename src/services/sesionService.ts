import { apiAuth } from '../api/authorizedClient';

export interface Sesion {
  usuario_id: string;
  documento: string;
  activo: boolean;
  organizacion_id: string | null;
  organizacion_nombre: string | null;
  rol: string | null;
  nivel: number | null;
  permisos: string[];
}

/** GET /api/auth/me — rol, nivel, organización (si tiene) y permisos del usuario autenticado. */
export const obtenerSesion = () => apiAuth<Sesion>('/auth/me');
