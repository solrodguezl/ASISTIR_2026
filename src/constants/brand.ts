export const Brand = {
  orange: '#F58A07',
  orangeDark: '#D9761E',
  orangeSoft: '#F8CD94',
  navy: '#1B2233',
  green: '#2E7D32',
  greenSoft: '#E3F1E4',
  maroon: '#8B1220',
  cream: '#FDF6EC',
  white: '#FFFFFF',
  border: '#D9D9DE',
  muted: '#6B7080',
  danger: '#C0392B',
} as const;

export const ROL_LABEL: Record<string, string> = {
  DIRECTOR: 'Director',
  COORDINADOR: 'Coordinador',
  GESTOR: 'Gestor',
  'ADMINISTRADOR INVESTIGATIVO': 'Administrador investigativo',
};

export const ROL_COLOR: Record<string, string> = {
  DIRECTOR: Brand.maroon,
  COORDINADOR: '#2E6B3F',
  GESTOR: Brand.orangeDark,
  'ADMINISTRADOR INVESTIGATIVO': Brand.navy,
};

// Jerarquía de roles (debe reflejar rol.nivel en la base de datos): GESTOR <
// COORDINADOR < DIRECTOR < ADMINISTRADOR INVESTIGATIVO. Se usa en el front
// solo para no ofrecer opciones que el backend igual rechazaría (HU-03); la
// regla real se aplica siempre en el servidor.
export const NIVEL_ROL: Record<string, number> = {
  GESTOR: 1,
  COORDINADOR: 2,
  DIRECTOR: 3,
  'ADMINISTRADOR INVESTIGATIVO': 4,
};

/** Roles que alguien con este rol puede crear/editar: los de nivel menor al suyo. */
export const rolesAsignablesPara = (rol: string | undefined | null): string[] => {
  const nivel = rol ? NIVEL_ROL[rol] : undefined;
  if (!nivel) return [];
  return ['DIRECTOR', 'COORDINADOR', 'GESTOR'].filter((r) => NIVEL_ROL[r] < nivel);
};
