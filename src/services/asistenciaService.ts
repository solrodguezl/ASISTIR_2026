import { ApiError } from '../api/client';
import { apiAuth } from '../api/authorizedClient';
import { conCache, guardarCache, leerCache } from '../offline/cache';
import { escribirOEncolar, nuevoId, type Guardado } from '../offline/escritura';
import { listarOperaciones, type OperacionPendiente } from '../offline/outbox';
import { esErrorDeRed } from '../offline/red';

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
  /** Creada sin conexión y todavía no enviada al servidor. */
  pendiente?: boolean;
}

export interface Asistente {
  id_asistencia: string;
  fecha_registro: string;
  documento: string;
  nombres: string;
  /** Registrado sin conexión y todavía no enviado al servidor. */
  pendiente?: boolean;
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

const hoy = () => new Date().toISOString().slice(0, 10);

const endpointAsistencias = (actividadId: string) => `/actividades/${actividadId}/asistencias`;

// --- Datos pendientes de la cola, para mostrarlos como si ya estuvieran guardados ---

async function operaciones() {
  return (await listarOperaciones()).filter((o) => o.estado === 'PENDIENTE');
}

const actividadDeOperacion = (op: OperacionPendiente): Actividad => ({
  id_actividad: String(op.body.id),
  nombre: String(op.body.nombre),
  fecha: String(op.body.fecha ?? op.creadoEn.slice(0, 10)),
  barrio: (op.body.barrio as string | null | undefined) ?? null,
  total_asistentes: 0,
  pendiente: true,
});

const asistentesPendientes = (ops: OperacionPendiente[], actividadId: string): Asistente[] =>
  ops
    .filter((o) => o.tipo === 'REGISTRAR_ASISTENCIA' && o.endpoint === endpointAsistencias(actividadId))
    .map((o) => ({
      id_asistencia: o.id,
      fecha_registro: String(o.body.fechaRegistro ?? o.creadoEn),
      documento: String(o.body.documento),
      nombres: String(o.body.nombres),
      pendiente: true,
    }))
    .reverse();

// --- API ---

export const obtenerCatalogos = () =>
  conCache('catalogos', () => apiAuth<Catalogos>('/catalogos'));

export async function buscarPersonaPorDocumento(documento: string): Promise<Persona> {
  try {
    const persona = await apiAuth<Persona>(`/personas/${encodeURIComponent(documento)}`);
    void guardarCache(`persona:${documento}`, persona);
    return persona;
  } catch (error) {
    if (!esErrorDeRed(error)) throw error;

    // Sin conexión: solo se puede autocompletar con personas que este teléfono
    // ya consultó o registró. Si no está, se registra como nueva (el servidor
    // la une por documento al sincronizar).
    const guardada = await leerCache<Persona>(`persona:${documento}`);
    if (guardada) return guardada;

    throw new ApiError('Persona no registrada', 404);
  }
}

export async function listarActividades(): Promise<Actividad[]> {
  const [lista, ops] = await Promise.all([
    conCache('actividades', () => apiAuth<Actividad[]>('/actividades')),
    operaciones(),
  ]);

  const ids = new Set(lista.map((a) => a.id_actividad));
  const nuevas = ops
    .filter((o) => o.tipo === 'CREAR_ACTIVIDAD' && !ids.has(String(o.body.id)))
    .map(actividadDeOperacion)
    .reverse();

  return [...nuevas, ...lista].map((a) => ({
    ...a,
    total_asistentes: a.total_asistentes + asistentesPendientes(ops, a.id_actividad).length,
  }));
}

export async function obtenerActividad(id: string): Promise<ActividadDetalle> {
  const ops = await operaciones();
  let detalle: ActividadDetalle;

  try {
    detalle = await conCache(`actividad:${id}`, () =>
      apiAuth<ActividadDetalle>(`/actividades/${id}`),
    );
  } catch (error) {
    // Puede ser una actividad creada offline (todavía no existe en el servidor)
    // o una que se vio en la lista pero nunca se abrió con internet.
    const creada = ops.find((o) => o.tipo === 'CREAR_ACTIVIDAD' && o.body.id === id);
    const enLista = (await leerCache<Actividad[]>('actividades'))?.find(
      (a) => a.id_actividad === id,
    );
    const base = creada ? actividadDeOperacion(creada) : enLista;

    if (!base || !(esErrorDeRed(error) || (creada && error instanceof ApiError && error.status === 404))) {
      throw error;
    }

    detalle = { ...base, asistentes: [] };
  }

  const pendientes = asistentesPendientes(ops, id);
  const documentos = new Set(detalle.asistentes.map((a) => a.documento));
  const nuevos = pendientes.filter((a) => !documentos.has(a.documento));

  return {
    ...detalle,
    total_asistentes: detalle.total_asistentes + nuevos.length,
    asistentes: [...nuevos, ...detalle.asistentes],
  };
}

export async function crearActividad(data: CrearActividadRequest): Promise<Guardado<Actividad>> {
  const id = nuevoId();
  const body = { id, ...data, fecha: data.fecha ?? hoy() };

  return escribirOEncolar<Actividad>({
    id,
    tipo: 'CREAR_ACTIVIDAD',
    endpoint: '/actividades',
    body,
    resumen: `Actividad · ${data.nombre}`,
    resultadoLocal: () => ({
      id_actividad: id,
      nombre: data.nombre,
      fecha: body.fecha,
      barrio: data.barrio ?? null,
      total_asistentes: 0,
      pendiente: true,
    }),
  });
}

export async function registrarAsistencia(
  actividadId: string,
  data: RegistrarAsistenciaRequest,
): Promise<Guardado<{ persona: Persona }>> {
  // Evita registrar dos veces a la misma persona mientras no hay conexión
  // (con conexión lo valida el servidor con un 409).
  const yaPendiente = asistentesPendientes(await operaciones(), actividadId).some(
    (a) => a.documento === data.documento,
  );
  if (yaPendiente) {
    throw new ApiError('Esta persona ya está registrada en la actividad', 409);
  }

  const id = nuevoId();
  const personaLocal: Persona = {
    id_persona: '',
    documento: data.documento,
    nombres: data.nombres,
    etnia: data.etnia,
    edad: data.edad,
    genero: data.genero,
    barrio: data.barrio,
  };

  const resultado = await escribirOEncolar<{ persona: Persona }>({
    id,
    tipo: 'REGISTRAR_ASISTENCIA',
    endpoint: endpointAsistencias(actividadId),
    body: { ...data, fechaRegistro: new Date().toISOString() },
    resumen: `Asistencia · ${data.nombres}`,
    resultadoLocal: () => ({ persona: personaLocal }),
  });

  // Queda disponible para autocompletar sin conexión en otras actividades.
  void guardarCache(`persona:${data.documento}`, resultado.datos.persona ?? personaLocal);

  return resultado;
}

/** Quita puntos, espacios y guiones: "1.033.456.789" -> "1033456789". */
export const normalizarDocumento = (valor: string) =>
  valor.replace(/[.\s,-]/g, '');
