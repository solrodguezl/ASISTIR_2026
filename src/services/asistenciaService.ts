import { apiAuth } from '../api/authorizedClient';

export interface Persona {
  id_persona: string;
  documento: string;
  nombres: string;
  etnia: string | null;
  edad: number | null;
  genero: string | null;
  barrio: string | null;
}

export interface Actividad {
  id_actividad: string;
  nombre: string;
  fecha: string;
  barrio: string | null;
  total_asistentes: number;
}

export interface Asistente {
  id_asistencia: string;
  fecha_registro: string;
  documento: string;
  nombres: string;
}

export interface ActividadDetalle extends Actividad {
  asistentes: Asistente[];
}

export interface CrearActividadRequest {
  nombre: string;
  fecha?: string;
  barrio?: string | null;
}

export interface RegistrarAsistenciaRequest {
  documento: string;
  nombres: string;
  etnia: string;
  edad: number;
  genero: string;
  barrio: string;
}

export interface Catalogos {
  roles: string[];
  etnias: string[];
  generos: string[];
  barrios: string[];
}

export const obtenerCatalogos = () => apiAuth<Catalogos>('/catalogos');

export const buscarPersonaPorDocumento = (documento: string) =>
  apiAuth<Persona>(`/personas/${encodeURIComponent(documento)}`);

export const listarActividades = () => apiAuth<Actividad[]>('/actividades');

export const obtenerActividad = (id: string) =>
  apiAuth<ActividadDetalle>(`/actividades/${id}`);

export const crearActividad = (data: CrearActividadRequest) =>
  apiAuth<Actividad>('/actividades', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const registrarAsistencia = (
  actividadId: string,
  data: RegistrarAsistenciaRequest,
) =>
  apiAuth<{ persona: Persona }>(`/actividades/${actividadId}/asistencias`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** Quita puntos, espacios y guiones: "1.033.456.789" -> "1033456789". */
export const normalizarDocumento = (valor: string) =>
  valor.replace(/[.\s,-]/g, '');
