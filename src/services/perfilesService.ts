import { apiAuth } from '../api/authorizedClient';

export interface Perfil {
  usuario_id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  foto_perfil: string | null;
  fecha_actualizacion: string;
}

export interface ActualizarPerfilRequest {
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  foto_perfil?: string | null;
}

export const obtenerMiPerfil = () => apiAuth<Perfil>('/perfiles/me');

export const actualizarMiPerfil = (data: ActualizarPerfilRequest) =>
  apiAuth<Perfil>('/perfiles/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
