import { apiAuth } from '../api/authorizedClient';
import type { RolSolicitable } from '../constants/roles';

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';

export interface Solicitud {
  id_solicitud: string;
  rol_solicitado: RolSolicitable;
  organizacion_nombre: string;
  nit: string | null;
  celular: string | null;
  cargo: string | null;
  motivo: string | null;
  estado: EstadoSolicitud;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
  resuelto_por: string | null;
  comentario_resolucion: string | null;
}

export interface SolicitudAdmin extends Solicitud {
  id_usuario: string;
  documento: string;
  nombres: string | null;
  apellidos: string | null;
}

export interface CrearSolicitudRequest {
  rolSolicitado: RolSolicitable;
  organizacionNombre: string;
  nit?: string | null;
  celular?: string | null;
  cargo?: string | null;
  motivo?: string | null;
}

export const crearSolicitud = (data: CrearSolicitudRequest) =>
  apiAuth<Solicitud>('/solicitudes-rol', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const misSolicitudes = () => apiAuth<Solicitud[]>('/solicitudes-rol/mias');

export const listarSolicitudesAdmin = (estado?: EstadoSolicitud) =>
  apiAuth<SolicitudAdmin[]>(
    `/admin/solicitudes-rol${estado ? `?estado=${estado}` : ''}`,
  );

export const aprobarSolicitud = (id: string, comentario?: string) =>
  apiAuth<Solicitud>(`/admin/solicitudes-rol/${id}/aprobar`, {
    method: 'POST',
    body: JSON.stringify({ comentario: comentario ?? null }),
  });

export const rechazarSolicitud = (id: string, comentario?: string) =>
  apiAuth<Solicitud>(`/admin/solicitudes-rol/${id}/rechazar`, {
    method: 'POST',
    body: JSON.stringify({ comentario: comentario ?? null }),
  });
