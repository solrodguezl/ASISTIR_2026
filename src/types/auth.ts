export interface Usuario {
  id: number;
  correo: string;
  activo: boolean;
}

export interface LoginRequest {
  documento: string;
  clave: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export interface RefreshResponse {
  accessToken: string;
}