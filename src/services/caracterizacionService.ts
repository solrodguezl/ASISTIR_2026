import { apiAuth } from '../api/authorizedClient';

export interface OpcionDss {
  id_opcion: string;
  id_pregunta: string;
  texto_opcion: string;
  valor: string | null;
  orden: number;
}

export type TipoRespuestaDss =
  | 'texto'
  | 'numero'
  | 'fecha'
  | 'seleccion_unica'
  | 'seleccion_multiple'
  | 'si_no'
  | 'escala';

// 'EQ'/'NEQ'/'IN' comparan la respuesta de otra pregunta (condicion_valor,
// separado por "|" en el caso de IN); 'GT0' exige que esa respuesta sea un
// número mayor que 0.
export type CondicionOperador = 'EQ' | 'NEQ' | 'GT0' | 'IN';
export type CondicionEdadOperador = 'LT' | 'GTE';

export interface PreguntaDss {
  id_pregunta: string;
  id_categoria: string;
  texto_pregunta: string;
  tipo_respuesta: TipoRespuestaDss;
  orden: number;
  opciones: OpcionDss[];
  // Metadatos del instrumento de 342 preguntas (null en el catálogo corto).
  numero_pregunta: number | null;
  nota: string | null;
  unidad: string | null;
  escala_min: number | null;
  escala_max: number | null;
  condicion_pregunta_id: string | null;
  condicion_operador: CondicionOperador | null;
  condicion_valor: string | null;
  condicion_edad_operador: CondicionEdadOperador | null;
  condicion_edad_valor: number | null;
}

export interface CategoriaDss {
  id_categoria: string;
  nombre: string;
  orden: number;
  preguntas: PreguntaDss[];
  // Metadatos de capítulo del instrumento de 342 preguntas (null en el
  // catálogo corto, que no se organiza por capítulos).
  capitulo: string | null;
  orden_capitulo: number | null;
  nivel: 'VIVIENDA' | 'HOGAR' | 'PERSONA' | null;
  objetivo: string | null;
  responde: string | null;
  tiempo_estimado_min: number | null;
  elegibilidad_edad_min: number | null;
  elegibilidad_edad_max: number | null;
  elegibilidad_genero: string | null;
  elegibilidad_jefe_hogar: boolean;
}

export interface PersonaCaracterizacion {
  id_persona: string;
  documento: string;
  tipo_documento: string | null;
  nombres: string;
  etnia: string | null;
  fecha_nacimiento: string | null;
  edad: number | null;
  genero: string | null;
  barrio: string | null;
}

export interface RespuestaGuardada {
  id_pregunta: string;
  id_opcion: string | null;
  valor_respuesta: string | null;
}

export interface FormularioDss {
  id_formulario: string;
  estado: 'borrador' | 'completo';
  fecha_diligenciamiento: string | null;
  fecha_ultima_actualizacion: string;
  respuestas: RespuestaGuardada[];
}

export interface PersonaConFormulario {
  persona: PersonaCaracterizacion;
  formulario: FormularioDss | null;
}

export interface RespuestaEnvio {
  idPregunta: string;
  idOpcion?: string | null;
  valorRespuesta?: string | null;
}

// Capítulos B/C del instrumento de 342 preguntas: vivienda y hogar se
// diligencian una sola vez y se comparten entre las personas que conviven.
export interface ViviendaEnvio {
  direccion?: string | null;
  documentoHogar?: string | null;
}

export interface GuardarCaracterizacionRequest {
  documento: string;
  nombres: string;
  tipoDocumento?: string | null;
  fechaNacimiento?: string | null;
  edad?: number | null;
  genero?: string | null;
  etnia?: string | null;
  barrio: string;
  estado: 'borrador' | 'completo';
  respuestas: RespuestaEnvio[];
  vivienda?: ViviendaEnvio | null;
}

export interface GuardarCaracterizacionResponse {
  persona: PersonaCaracterizacion;
  formulario: {
    id_formulario: string;
    estado: 'borrador' | 'completo';
    fecha_diligenciamiento: string | null;
    fecha_ultima_actualizacion: string;
  };
  respuestasGuardadas: number;
  hogar: { idVivienda: string; idHogar: string; reutilizado: boolean } | null;
}

export interface HogarEncontrado {
  id_persona: string;
  nombres: string;
  id_hogar: string | null;
  id_vivienda: string | null;
}

export const obtenerCatalogoCaracterizacion = () =>
  apiAuth<CategoriaDss[]>('/caracterizacion/catalogo');

export const buscarPersonaCaracterizacion = (documento: string) =>
  apiAuth<PersonaConFormulario>(
    `/caracterizacion/personas/${encodeURIComponent(documento)}`,
  );

export const buscarHogarCaracterizacion = (documento: string) =>
  apiAuth<HogarEncontrado>(
    `/caracterizacion/hogares/${encodeURIComponent(documento)}`,
  );

export const guardarCaracterizacion = (data: GuardarCaracterizacionRequest) =>
  apiAuth<GuardarCaracterizacionResponse>('/caracterizacion', {
    method: 'POST',
    body: JSON.stringify(data),
  });
