import { ApiError } from '../api/client';
import { apiAuth } from '../api/authorizedClient';
import { conCache, guardarCache, leerCache } from '../offline/cache';
import { escribirOEncolar, nuevoId, type Guardado } from '../offline/escritura';
import { listarOperaciones } from '../offline/outbox';
import { esErrorDeRed } from '../offline/red';

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

// --- Copia local de la caracterización de cada persona ---
//
// Se guarda la última versión conocida (la del servidor más lo guardado en
// este teléfono) para poder reabrir el formulario sin conexión y continuar
// donde se quedó. Mientras haya capítulos de esa persona en la cola, esta copia
// es más nueva que la del servidor y es la que se muestra.

const claveCaracterizacion = (documento: string) => `caracterizacion:${documento}`;

async function hayPendientesDe(documento: string) {
  return (await listarOperaciones()).some(
    (o) => o.tipo === 'GUARDAR_CARACTERIZACION' && o.body.documento === documento,
  );
}

async function actualizarCopiaLocal(
  data: GuardarCaracterizacionRequest,
  guardado: GuardarCaracterizacionResponse | null,
): Promise<GuardarCaracterizacionResponse> {
  const previa = await leerCache<PersonaConFormulario>(claveCaracterizacion(data.documento));
  const ahora = new Date().toISOString();

  const respuestas = new Map<string, RespuestaGuardada>();
  for (const r of previa?.formulario?.respuestas ?? []) respuestas.set(r.id_pregunta, r);
  for (const r of data.respuestas) {
    respuestas.set(r.idPregunta, {
      id_pregunta: r.idPregunta,
      id_opcion: r.idOpcion ?? null,
      valor_respuesta: r.valorRespuesta ?? null,
    });
  }

  const persona: PersonaCaracterizacion = guardado?.persona ?? {
    id_persona: previa?.persona.id_persona ?? '',
    documento: data.documento,
    tipo_documento: data.tipoDocumento ?? null,
    nombres: data.nombres,
    etnia: data.etnia ?? null,
    fecha_nacimiento: data.fechaNacimiento ?? null,
    edad: data.edad ?? null,
    genero: data.genero ?? null,
    barrio: data.barrio,
  };

  const formulario = guardado?.formulario ?? {
    id_formulario: previa?.formulario?.id_formulario ?? 'local',
    estado: data.estado,
    fecha_diligenciamiento:
      data.estado === 'completo' ? ahora.slice(0, 10) : previa?.formulario?.fecha_diligenciamiento ?? null,
    fecha_ultima_actualizacion: ahora,
  };

  await guardarCache(claveCaracterizacion(data.documento), {
    persona,
    formulario: { ...formulario, respuestas: [...respuestas.values()] },
  } satisfies PersonaConFormulario);

  return (
    guardado ?? {
      persona,
      formulario,
      respuestasGuardadas: data.respuestas.length,
      hogar: null,
    }
  );
}

// --- API ---

export const obtenerCatalogoCaracterizacion = () =>
  conCache('catalogo-caracterizacion', () => apiAuth<CategoriaDss[]>('/caracterizacion/catalogo'));

export async function buscarPersonaCaracterizacion(documento: string): Promise<PersonaConFormulario> {
  const local = await leerCache<PersonaConFormulario>(claveCaracterizacion(documento));

  if (local && (await hayPendientesDe(documento))) {
    return local;
  }

  try {
    const servidor = await apiAuth<PersonaConFormulario>(
      `/caracterizacion/personas/${encodeURIComponent(documento)}`,
    );
    void guardarCache(claveCaracterizacion(documento), servidor);
    return servidor;
  } catch (error) {
    if (!esErrorDeRed(error)) throw error;
    if (local) return local;

    // Sin conexión y sin copia local: se diligencia como persona nueva; al
    // sincronizar el servidor la une por documento y continúa su borrador.
    throw new ApiError('Persona no registrada', 404);
  }
}

export async function buscarHogarCaracterizacion(documento: string): Promise<HogarEncontrado> {
  try {
    return await apiAuth<HogarEncontrado>(
      `/caracterizacion/hogares/${encodeURIComponent(documento)}`,
    );
  } catch (error) {
    if (!esErrorDeRed(error)) throw error;

    throw new ApiError(
      'Sin conexión: no se puede verificar ahora. Si dejas el documento, el hogar se vinculará automáticamente al sincronizar.',
      0,
    );
  }
}

export async function guardarCaracterizacion(
  data: GuardarCaracterizacionRequest,
): Promise<Guardado<GuardarCaracterizacionResponse>> {
  const id = nuevoId();

  const resultado = await escribirOEncolar<GuardarCaracterizacionResponse | null>({
    id,
    tipo: 'GUARDAR_CARACTERIZACION',
    endpoint: '/caracterizacion',
    body: { ...data },
    resumen: `Caracterización · ${data.nombres}`,
    resultadoLocal: () => null,
  });

  return {
    datos: await actualizarCopiaLocal(data, resultado.datos),
    enCola: resultado.enCola,
  };
}
