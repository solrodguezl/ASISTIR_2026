import { apiAuth } from '../api/authorizedClient';

export type Rol = 'DIRECTOR' | 'COORDINADOR' | 'GESTOR';

export interface Miembro {
  id: string;
  documento: string;
  activo: boolean;
  rol: Rol;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  foto_perfil: string | null;
}

export interface Organizacion {
  id: string;
  nombre: string;
}

export interface MiembroActual extends Miembro {
  organizacion: Organizacion;
}

export interface ListaMiembros {
  organizacion: Organizacion;
  miembros: Miembro[];
}

export interface CrearMiembroRequest {
  documento: string;
  clave: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  rol: Rol;
}

export interface ActualizarMiembroRequest {
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  rol: Rol;
  activo?: boolean;
  clave?: string;
}

export interface ActividadResumen {
  id_actividad: string;
  nombre: string;
  fecha: string;
  barrio: string | null;
  total_asistentes: number;
}

export interface ResumenActividad {
  totalAsistenciasRegistradas: number;
  actividadesCreadas: number;
  promedioAsistentes: number;
  ultimaActividadFecha: string | null;
  actividadesRecientes: ActividadResumen[];
}

export interface ResumenMiembro {
  miembro: Miembro;
  resumen: ResumenActividad;
}

export const obtenerYo = () => apiAuth<MiembroActual>('/miembros/yo');

export const obtenerResumenMiembro = (id: string) =>
  apiAuth<ResumenMiembro>(`/miembros/${id}/resumen`);

export const listarMiembros = () => apiAuth<ListaMiembros>('/miembros');

export const crearMiembro = (data: CrearMiembroRequest) =>
  apiAuth<Miembro>('/miembros', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const actualizarMiembro = (
  id: string,
  data: ActualizarMiembroRequest,
) =>
  apiAuth<Miembro>(`/miembros/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export function nombreCompleto(m: Pick<Miembro, 'nombres' | 'apellidos' | 'documento'>) {
  const nombre = `${m.nombres ?? ''} ${m.apellidos ?? ''}`.trim();

  return nombre || m.documento;
}
