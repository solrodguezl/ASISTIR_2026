import { apiClient } from '../api/client';
import { getAccessToken } from './authService';

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

export async function obtenerMiPerfil(): Promise<Perfil> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error(
      'No existe un token de autenticación.',
    );
  }

  return apiClient<Perfil>('/perfiles/me', {
    method: 'GET',
    token,
  });
}

export async function actualizarMiPerfil(
  data: ActualizarPerfilRequest,
): Promise<Perfil> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error(
      'No existe un token de autenticación.',
    );
  }

  return apiClient<Perfil>('/perfiles/me', {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}