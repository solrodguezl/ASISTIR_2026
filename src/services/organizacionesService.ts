import { apiAuth } from '../api/authorizedClient';
import type {
  ActualizarMiembroRequest,
  CrearMiembroRequest,
  Miembro,
  ResumenMiembro,
} from './miembrosService';

export interface OrganizacionAdmin {
  id_organizacion: string;
  nombre: string;
  tipo: string | null;
  nit: string | null;
  fecha_creacion: string;
  total_miembros: number;
}

export interface OrganizacionInfo {
  id_organizacion: string;
  nombre: string;
  tipo: string | null;
  nit: string | null;
  fecha_creacion: string;
}

export interface OrganizacionDetalle {
  organizacion: OrganizacionInfo;
  miembros: Miembro[];
}

/** Panel del administrador: historial de todas las organizaciones registradas. */
export const listarOrganizaciones = () =>
  apiAuth<OrganizacionAdmin[]>('/admin/organizaciones');

/** Registrados de una organización puntual (solo administrador). */
export const obtenerOrganizacion = (id: string) =>
  apiAuth<OrganizacionDetalle>(`/admin/organizaciones/${id}/miembros`);

// Gestión de miembros desde el panel del administrador, en cualquier
// organización (no solo la suya) — mismas reglas de jerarquía de roles que
// usa un Director/Coordinador en /miembros, aplicadas en el servidor.
export const crearMiembroEnOrganizacion = (
  idOrganizacion: string,
  data: CrearMiembroRequest,
) =>
  apiAuth<Miembro>(`/admin/organizaciones/${idOrganizacion}/miembros`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const actualizarMiembroEnOrganizacion = (
  idOrganizacion: string,
  idUsuario: string,
  data: ActualizarMiembroRequest,
) =>
  apiAuth<Miembro>(
    `/admin/organizaciones/${idOrganizacion}/miembros/${idUsuario}`,
    { method: 'PUT', body: JSON.stringify(data) },
  );

export const obtenerResumenMiembroEnOrganizacion = (
  idOrganizacion: string,
  idUsuario: string,
) =>
  apiAuth<ResumenMiembro>(
    `/admin/organizaciones/${idOrganizacion}/miembros/${idUsuario}/resumen`,
  );
