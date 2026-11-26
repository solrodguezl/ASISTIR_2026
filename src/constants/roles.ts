// Niveles de rol (Fase 1 — roles y solicitudes). Debe coincidir exactamente
// con utils/catalogos.js (NIVEL_ROL) en datafro_backend.
export const NIVEL_ROL: Record<string, number> = {
  GESTOR: 1,
  COORDINADOR: 2,
  DIRECTOR: 3,
  'ADMINISTRADOR INVESTIGATIVO': 4,
};

export type RolSolicitable = 'COORDINADOR' | 'DIRECTOR';

export const ROL_SOLICITABLE_LABEL: Record<RolSolicitable, string> = {
  COORDINADOR: 'Coordinador',
  DIRECTOR: 'Director',
};

export function nivelDe(rol: string | null | undefined): number {
  if (!rol) return 0;
  return NIVEL_ROL[rol] ?? 0;
}
