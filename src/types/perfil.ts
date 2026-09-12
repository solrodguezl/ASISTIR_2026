export interface Perfil {
  id: number;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  foto_perfil: string | null;
}

export interface ActualizarPerfilRequest {
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  foto_perfil?: string | null;
}