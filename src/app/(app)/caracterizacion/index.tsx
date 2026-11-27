import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '../../../api/client';
import { AppButton } from '../../../components/ui/AppButton';
import { AppBottomNav } from '../../../components/ui/BottomNavigation';
import { FormInput } from '../../../components/ui/FormInput';
import { MultiSelectInput } from '../../../components/ui/MultiSelectInput';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Brand } from '../../../constants/brand';
import {
  normalizarDocumento,
  obtenerCatalogos,
  type Catalogos,
} from '../../../services/asistenciaService';
import {
  buscarHogarCaracterizacion,
  buscarPersonaCaracterizacion,
  guardarCaracterizacion,
  obtenerCatalogoCaracterizacion,
  type CategoriaDss,
  type HogarEncontrado,
  type PreguntaDss,
} from '../../../services/caracterizacionService';

// Respuesta en memoria para una pregunta del catálogo DSS.
interface RespuestaLocal {
  idOpcion: string | null;
  valorRespuesta: string | null;
}

const SI_NO_OPCIONES = ['Sí', 'No'];

// Número de la pregunta de parentesco (capítulo D) cuya opción "Es el jefe(a)
// del hogar" determina la elegibilidad de los capítulos con jefe_hogar=true.
const NUMERO_PREGUNTA_PARENTESCO_JEFE = 90;
const OPCION_ES_JEFE_HOGAR = 'Es el jefe(a) del hogar';

// Pregunta de cierre del instrumento (capítulo de consentimiento informado).
const NUMERO_PREGUNTA_CONSENTIMIENTO = 342;
const OPCION_ACEPTO = 'Acepto';

const hoy = () => new Date().toISOString().slice(0, 10);

// Los nombres de categoria_dss llevan el prefijo "NARP-342 · " para no
// chocar con el índice único que ya usaba el catálogo corto de 49 preguntas.
const nombreCapitulo = (nombre: string) => nombre.replace(/^NARP-342 · /, '');

type Paso = 'identificacion' | number;

export default function CaracterizacionScreen() {
  const [catalogo, setCatalogo] = useState<CategoriaDss[]>([]);
  const [catalogosBase, setCatalogosBase] = useState<Catalogos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [documento, setDocumento] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [autocompletado, setAutocompletado] = useState(false);
  const [estadoPrevio, setEstadoPrevio] = useState<'borrador' | 'completo' | null>(null);

  const [nombres, setNombres] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [etnia, setEtnia] = useState('');
  const [barrio, setBarrio] = useState('');

  const [viviendaDireccion, setViviendaDireccion] = useState('');
  const [documentoHogar, setDocumentoHogar] = useState('');
  const [hogarEncontrado, setHogarEncontrado] = useState<HogarEncontrado | null>(null);
  const [buscandoHogar, setBuscandoHogar] = useState(false);

  const [respuestas, setRespuestas] = useState<Record<string, RespuestaLocal>>({});
  const [guardando, setGuardando] = useState<'borrador' | 'completo' | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const [paso, setPaso] = useState<Paso>('identificacion');

  const ultimaBusqueda = useRef('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const [cat, catBase] = await Promise.all([
          obtenerCatalogoCaracterizacion(),
          obtenerCatalogos(),
        ]);

        setCatalogo(cat);
        setCatalogosBase(catBase);
      } catch (e) {
        setErrorCarga(
          e instanceof Error ? e.message : 'No se pudo cargar el formulario de caracterización.',
        );
      } finally {
        setCargando(false);
      }
    };

    void cargar();
  }, []);

  // Capítulos del instrumento de 342 preguntas, en orden. El catálogo corto
  // de 49 preguntas (sin capítulo asignado) ya no se muestra en esta
  // pantalla, aunque sigue intacto en la base de datos.
  const capitulos = useMemo(
    () =>
      catalogo
        .filter((c) => c.capitulo)
        .sort((a, b) => (a.orden_capitulo ?? 0) - (b.orden_capitulo ?? 0)),
    [catalogo],
  );

  const valorRespuestaPorNumero = (numero: number): string => {
    for (const categoria of capitulos) {
      const pregunta = categoria.preguntas.find((p) => p.numero_pregunta === numero);
      if (pregunta) return respuestas[pregunta.id_pregunta]?.valorRespuesta ?? '';
    }
    return '';
  };

  const esJefeDeHogar = () =>
    valorRespuestaPorNumero(NUMERO_PREGUNTA_PARENTESCO_JEFE) === OPCION_ES_JEFE_HOGAR;

  const edadNumerica =
    edad.trim() !== '' && Number.isFinite(Number(edad)) ? Number(edad) : null;

  // Elegibilidad por capítulo (edad/género/jefe de hogar), según los
  // metadatos de categoria_dss generados a partir del instrumento NARP-DSS.
  const esCapituloElegible = (categoria: CategoriaDss): boolean => {
    if (categoria.elegibilidad_edad_min != null) {
      if (edadNumerica == null || edadNumerica < categoria.elegibilidad_edad_min) return false;
    }
    if (categoria.elegibilidad_edad_max != null) {
      if (edadNumerica == null || edadNumerica > categoria.elegibilidad_edad_max) return false;
    }
    if (categoria.elegibilidad_genero && categoria.elegibilidad_genero !== genero) {
      return false;
    }
    if (categoria.elegibilidad_jefe_hogar && !esJefeDeHogar()) {
      return false;
    }
    return true;
  };

  const capitulosElegibles = useMemo(
    () => capitulos.filter(esCapituloElegible),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [capitulos, edad, genero, respuestas],
  );

  // Visibilidad por pregunta: condicion_pregunta_id/operador/valor (se
  // despliega según la respuesta a otra pregunta) o condicion_edad_operador
  // (se despliega según la edad de la persona).
  const esPreguntaVisible = (pregunta: PreguntaDss): boolean => {
    if (pregunta.condicion_pregunta_id) {
      const dep = respuestas[pregunta.condicion_pregunta_id]?.valorRespuesta ?? '';
      const depValores = dep ? dep.split('; ') : [];

      switch (pregunta.condicion_operador) {
        case 'EQ':
          return dep === (pregunta.condicion_valor ?? '');
        case 'NEQ':
          return dep !== '' && dep !== (pregunta.condicion_valor ?? '');
        case 'GT0':
          return Number(dep) > 0;
        case 'IN': {
          const permitidos = (pregunta.condicion_valor ?? '').split('|');
          return depValores.some((v) => permitidos.includes(v));
        }
        default:
          return true;
      }
    }

    if (pregunta.condicion_edad_operador && pregunta.condicion_edad_valor != null) {
      if (edadNumerica == null) return false;
      return pregunta.condicion_edad_operador === 'LT'
        ? edadNumerica < pregunta.condicion_edad_valor
        : edadNumerica >= pregunta.condicion_edad_valor;
    }

    return true;
  };

  const limpiarFormulario = () => {
    setNombres('');
    setTipoDocumento('');
    setFechaNacimiento('');
    setEdad('');
    setGenero('');
    setEtnia('');
    setBarrio('');
    setViviendaDireccion('');
    setDocumentoHogar('');
    setHogarEncontrado(null);
    setRespuestas({});
    setAutocompletado(false);
    setEstadoPrevio(null);
    setPaso('identificacion');
  };

  // Autorrelleno por documento (HU-05): busca a la persona y, si tiene un
  // formulario guardado, trae también sus respuestas.
  useEffect(() => {
    const doc = normalizarDocumento(documento);

    if (doc.length < 5) {
      setAutocompletado(false);
      return;
    }

    const timer = setTimeout(async () => {
      ultimaBusqueda.current = doc;

      try {
        setBuscando(true);
        const { persona, formulario } = await buscarPersonaCaracterizacion(doc);

        if (ultimaBusqueda.current !== doc) return;

        setNombres(persona.nombres);
        setTipoDocumento(persona.tipo_documento ?? '');
        setFechaNacimiento(persona.fecha_nacimiento ?? '');
        setEdad(persona.edad != null ? String(persona.edad) : '');
        setGenero(persona.genero ?? '');
        setEtnia(persona.etnia ?? '');
        setBarrio(persona.barrio ?? '');
        setAutocompletado(true);

        if (formulario) {
          const nuevasRespuestas: Record<string, RespuestaLocal> = {};

          for (const r of formulario.respuestas) {
            nuevasRespuestas[r.id_pregunta] = {
              idOpcion: r.id_opcion,
              valorRespuesta: r.valor_respuesta,
            };
          }

          setRespuestas(nuevasRespuestas);
          setEstadoPrevio(formulario.estado);
        } else {
          setRespuestas({});
          setEstadoPrevio(null);
        }
      } catch (e) {
        if (ultimaBusqueda.current !== doc) return;

        setAutocompletado(false);

        if (e instanceof ApiError && e.status === 404) {
          // Persona nueva: se diligencia desde cero con este documento.
          setRespuestas({});
          setEstadoPrevio(null);
        } else {
          setMensaje({
            tipo: 'error',
            texto: e instanceof Error ? e.message : 'No se pudo buscar el documento.',
          });
        }
      } finally {
        setBuscando(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [documento]);

  // Botón "ya hay alguien de mi hogar registrado" (capítulos B/C).
  const buscarHogar = async () => {
    const doc = normalizarDocumento(documentoHogar);
    if (doc.length < 5) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un documento válido para buscar su hogar.' });
      return;
    }

    try {
      setBuscandoHogar(true);
      const encontrado = await buscarHogarCaracterizacion(doc);
      setHogarEncontrado(encontrado);
      setMensaje(
        encontrado.id_hogar
          ? { tipo: 'ok', texto: `Se vinculará al mismo hogar que ${encontrado.nombres}.` }
          : {
              tipo: 'error',
              texto: `${encontrado.nombres} está registrado(a), pero todavía no tiene un hogar asignado. Se creará una vivienda nueva.`,
            },
      );
    } catch (e) {
      setHogarEncontrado(null);
      setMensaje({
        tipo: 'error',
        texto:
          e instanceof ApiError && e.status === 404
            ? 'No se encontró a nadie con ese documento.'
            : e instanceof Error
              ? e.message
              : 'No se pudo buscar el hogar.',
      });
    } finally {
      setBuscandoHogar(false);
    }
  };

  const setRespuestaTexto = (idPregunta: string, valor: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: { idOpcion: null, valorRespuesta: valor },
    }));
  };

  const setRespuestaUnica = (pregunta: PreguntaDss, textoSeleccionado: string) => {
    const opcion = pregunta.opciones.find((o) => o.texto_opcion === textoSeleccionado);

    setRespuestas((prev) => ({
      ...prev,
      [pregunta.id_pregunta]: {
        idOpcion: opcion?.id_opcion ?? null,
        valorRespuesta: textoSeleccionado,
      },
    }));
  };

  const setRespuestaMultiple = (idPregunta: string, valores: string[]) => {
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: { idOpcion: null, valorRespuesta: valores.join('; ') },
    }));
  };

  const valorTexto = (idPregunta: string) => respuestas[idPregunta]?.valorRespuesta ?? '';

  const valorMultiple = (idPregunta: string) => {
    const guardado = respuestas[idPregunta]?.valorRespuesta ?? '';
    return guardado ? guardado.split('; ').filter(Boolean) : [];
  };

  const validarIdentificacion = (): string | null => {
    if (normalizarDocumento(documento).length < 5) {
      return 'Ingresa el número de documento.';
    }
    if (!nombres.trim()) {
      return 'Ingresa el nombre completo.';
    }
    if (!barrio) {
      return 'Selecciona el barrio.';
    }
    return null;
  };

  const construirRespuestasEnvio = (preguntas: PreguntaDss[]) => {
    const resultado: { idPregunta: string; idOpcion: string | null; valorRespuesta: string | null }[] = [];

    for (const pregunta of preguntas) {
      const base = respuestas[pregunta.id_pregunta];
      if (!base) continue;

      let valorRespuesta = base.valorRespuesta;
      const otro = respuestas[`${pregunta.id_pregunta}_otro`]?.valorRespuesta;

      if (otro && otro.trim()) {
        if (pregunta.tipo_respuesta === 'seleccion_multiple') {
          // Reemplaza el token "Otro"/"Otra" dentro de la lista por el detalle escrito.
          const partes = (valorRespuesta ?? '')
            .split('; ')
            .map((v) => (v === 'Otro' || v === 'Otra' ? `${v}: ${otro.trim()}` : v));
          valorRespuesta = partes.join('; ');
        } else {
          valorRespuesta = `${valorRespuesta}: ${otro.trim()}`;
        }
      }

      if ((valorRespuesta ?? '').trim() === '' && !base.idOpcion) continue;

      resultado.push({
        idPregunta: pregunta.id_pregunta,
        idOpcion: base.idOpcion,
        valorRespuesta,
      });
    }

    return resultado;
  };

  // Solo se manda si la usuaria llenó algo; el backend reutiliza el hogar ya
  // asignado a la persona en los guardados siguientes aunque esto venga vacío.
  const datosVivienda = () =>
    viviendaDireccion.trim() || documentoHogar.trim()
      ? {
          direccion: viviendaDireccion.trim() || null,
          documentoHogar: documentoHogar.trim() ? normalizarDocumento(documentoHogar) : null,
        }
      : null;

  const guardarPaso = async (
    preguntasPaso: PreguntaDss[],
    estado: 'borrador' | 'completo',
  ): Promise<boolean> => {
    setMensaje(null);

    const errorIdentificacion = validarIdentificacion();
    if (errorIdentificacion) {
      setMensaje({ tipo: 'error', texto: errorIdentificacion });
      return false;
    }

    if (
      estado === 'completo' &&
      valorRespuestaPorNumero(NUMERO_PREGUNTA_CONSENTIMIENTO) !== OPCION_ACEPTO
    ) {
      setMensaje({
        tipo: 'error',
        texto:
          'Para cerrar la caracterización como completa, el capítulo de Consentimiento informado debe quedar en "Acepto".',
      });
      return false;
    }

    const edadNumero = edad.trim() ? Number(edad) : null;

    try {
      setGuardando(estado);

      const { datos: resultado, enCola } = await guardarCaracterizacion({
        documento: normalizarDocumento(documento),
        nombres: nombres.trim(),
        tipoDocumento: tipoDocumento || null,
        fechaNacimiento: fechaNacimiento || null,
        edad: edadNumero,
        genero: genero || null,
        etnia: etnia || null,
        barrio,
        estado,
        respuestas: construirRespuestasEnvio(preguntasPaso),
        vivienda: datosVivienda(),
      });

      setEstadoPrevio(resultado.formulario.estado);
      setMensaje({
        tipo: 'ok',
        texto: enCola
          ? estado === 'completo'
            ? `Caracterización completa guardada en el teléfono para ${nombres.trim()}. Se enviará cuando haya conexión.`
            : 'Capítulo guardado en el teléfono. Se enviará cuando haya conexión.'
          : estado === 'completo'
            ? `Caracterización completa guardada para ${nombres.trim()}.`
            : 'Capítulo guardado.',
      });
      return true;
    } catch (e) {
      setMensaje({
        tipo: 'error',
        texto: e instanceof Error ? e.message : 'No se pudo guardar la caracterización.',
      });
      return false;
    } finally {
      setGuardando(null);
    }
  };

  const comenzar = async () => {
    const ok = await guardarPaso([], 'borrador');
    if (ok) setPaso(0);
  };

  const irAlSiguiente = async (categoria: CategoriaDss) => {
    const preguntasPaso = categoria.preguntas.filter(esPreguntaVisible);
    const ok = await guardarPaso(preguntasPaso, 'borrador');
    if (!ok) return;

    const indiceActual = typeof paso === 'number' ? paso : 0;
    if (indiceActual + 1 < capitulosElegibles.length) {
      setPaso(indiceActual + 1);
    }
  };

  const irAlAnterior = () => {
    const indiceActual = typeof paso === 'number' ? paso : 0;
    if (indiceActual === 0) {
      setPaso('identificacion');
    } else {
      setPaso(indiceActual - 1);
    }
  };

  const finalizar = async (categoria: CategoriaDss) => {
    const preguntasPaso = categoria.preguntas.filter(esPreguntaVisible);
    await guardarPaso(preguntasPaso, 'completo');
  };

  const renderPregunta = (pregunta: PreguntaDss) => {
    const opcionesTexto = pregunta.opciones.map((o) => o.texto_opcion);
    const esOtroSeleccionado = (texto: string) => texto === 'Otro' || texto === 'Otra';
    const etiqueta = pregunta.unidad
      ? `${pregunta.texto_pregunta} (${pregunta.unidad})`
      : pregunta.texto_pregunta;
    const nota = pregunta.nota ? <Text style={styles.nota}>{pregunta.nota}</Text> : null;

    switch (pregunta.tipo_respuesta) {
      case 'texto':
        return (
          <View key={pregunta.id_pregunta}>
            {nota}
            <FormInput
              label={etiqueta}
              value={valorTexto(pregunta.id_pregunta)}
              onChangeText={(v) => setRespuestaTexto(pregunta.id_pregunta, v)}
              editable={guardando === null}
            />
          </View>
        );

      case 'numero':
        return (
          <View key={pregunta.id_pregunta}>
            {nota}
            <FormInput
              label={etiqueta}
              value={valorTexto(pregunta.id_pregunta)}
              onChangeText={(v) => setRespuestaTexto(pregunta.id_pregunta, v)}
              keyboardType="numeric"
              editable={guardando === null}
            />
          </View>
        );

      case 'fecha':
        return (
          <View key={pregunta.id_pregunta}>
            {nota}
            <FormInput
              label={`${etiqueta} (AAAA-MM-DD)`}
              value={valorTexto(pregunta.id_pregunta)}
              onChangeText={(v) => setRespuestaTexto(pregunta.id_pregunta, v)}
              placeholder="2026-09-18"
              editable={guardando === null}
            />
          </View>
        );

      case 'si_no':
        return (
          <View key={pregunta.id_pregunta}>
            {nota}
            <SelectInput
              label={etiqueta}
              value={valorTexto(pregunta.id_pregunta)}
              options={SI_NO_OPCIONES}
              onChange={(v) => setRespuestaTexto(pregunta.id_pregunta, v)}
              disabled={guardando !== null}
            />
          </View>
        );

      case 'escala': {
        const min = pregunta.escala_min ?? 0;
        const max = pregunta.escala_max ?? 10;
        const valores = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
        const seleccionado = valorTexto(pregunta.id_pregunta);

        return (
          <View key={pregunta.id_pregunta} style={styles.escalaWrapper}>
            <Text style={styles.escalaLabel}>{etiqueta}</Text>
            {nota}
            <View style={styles.escalaFila}>
              {valores.map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setRespuestaTexto(pregunta.id_pregunta, v)}
                  disabled={guardando !== null}
                  style={[styles.escalaChip, seleccionado === v && styles.escalaChipActivo]}
                >
                  <Text
                    style={[
                      styles.escalaChipTexto,
                      seleccionado === v && styles.escalaChipTextoActivo,
                    ]}
                  >
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      }

      case 'seleccion_multiple': {
        const seleccionados = valorMultiple(pregunta.id_pregunta);
        return (
          <View key={pregunta.id_pregunta}>
            {nota}
            <MultiSelectInput
              label={etiqueta}
              values={seleccionados}
              options={opcionesTexto}
              onChange={(v) => setRespuestaMultiple(pregunta.id_pregunta, v)}
              disabled={guardando !== null}
            />
            {seleccionados.some(esOtroSeleccionado) ? (
              <FormInput
                label="¿Cuál? (otro)"
                value={valorTexto(`${pregunta.id_pregunta}_otro`)}
                onChangeText={(v) => setRespuestaTexto(`${pregunta.id_pregunta}_otro`, v)}
                editable={guardando === null}
              />
            ) : null}
          </View>
        );
      }

      case 'seleccion_unica':
      default: {
        const seleccionado = valorTexto(pregunta.id_pregunta);
        return (
          <View key={pregunta.id_pregunta}>
            {nota}
            <SelectInput
              label={etiqueta}
              value={seleccionado}
              options={opcionesTexto}
              onChange={(v) => setRespuestaUnica(pregunta, v)}
              disabled={guardando !== null}
            />
            {esOtroSeleccionado(seleccionado) ? (
              <FormInput
                label="¿Cuál? (otro)"
                value={valorTexto(`${pregunta.id_pregunta}_otro`)}
                onChangeText={(v) => setRespuestaTexto(`${pregunta.id_pregunta}_otro`, v)}
                editable={guardando === null}
              />
            ) : null}
          </View>
        );
      }
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.orange} />
      </View>
    );
  }

  if (errorCarga || !catalogosBase) {
    return (
      <ScreenContainer style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.error}>{errorCarga || 'No se pudo cargar el formulario.'}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const indiceActual = typeof paso === 'number' ? paso : -1;
  const categoriaActual = indiceActual >= 0 ? capitulosElegibles[indiceActual] : null;
  const esUltimoCapitulo = indiceActual === capitulosElegibles.length - 1;

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Caracterización NARP</Text>
        <Text style={styles.subtitle}>
          Instrumento completo de caracterización de población Negra, Afrocolombiana, Raizal y
          Palenquera de la Mesa Afro (342 preguntas, 14 capítulos). Se guarda capítulo por
          capítulo: puedes continuarlo después con el mismo documento.
        </Text>

        {paso === 'identificacion' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Datos de identificación</Text>

              <FormInput
                label="Número de documento"
                value={documento}
                onChangeText={(v) => {
                  setDocumento(v);
                  setAutocompletado(false);
                  setMensaje(null);
                  if (normalizarDocumento(v).length < 5) limpiarFormulario();
                }}
                placeholder="Documento"
                keyboardType="numeric"
                highlighted={autocompletado}
                editable={guardando === null}
                right={buscando ? <ActivityIndicator size="small" color={Brand.green} /> : null}
              />

              {estadoPrevio ? (
                <View style={styles.note}>
                  <Ionicons
                    name={estadoPrevio === 'completo' ? 'checkmark-circle' : 'time'}
                    size={22}
                    color={estadoPrevio === 'completo' ? Brand.green : Brand.orangeDark}
                  />
                  <Text style={styles.noteText}>
                    {estadoPrevio === 'completo'
                      ? 'Esta persona ya tiene una caracterización completa. Puedes revisarla o corregirla.'
                      : 'Hay un borrador guardado para esta persona; se cargó para que lo continúes.'}
                  </Text>
                </View>
              ) : null}

              <FormInput
                label="Nombre completo"
                value={nombres}
                onChangeText={setNombres}
                autoCapitalize="words"
                editable={guardando === null}
              />

              <SelectInput
                label="Tipo de documento de identidad"
                value={tipoDocumento}
                options={['RC', 'TI', 'CC', 'PP', 'CE', 'PPT', 'Otro']}
                onChange={setTipoDocumento}
                disabled={guardando !== null}
              />

              <FormInput
                label="Fecha de nacimiento (AAAA-MM-DD)"
                value={fechaNacimiento}
                onChangeText={setFechaNacimiento}
                placeholder={hoy()}
                editable={guardando === null}
              />

              <FormInput
                label="Edad"
                value={edad}
                onChangeText={setEdad}
                keyboardType="numeric"
                maxLength={3}
                editable={guardando === null}
              />

              <SelectInput
                label="Etnia"
                value={etnia}
                options={catalogosBase.etnias}
                onChange={setEtnia}
                disabled={guardando !== null}
              />

              <SelectInput
                label="Género"
                value={genero}
                options={catalogosBase.generos}
                onChange={setGenero}
                disabled={guardando !== null}
              />

              <SelectInput
                label="Barrio"
                value={barrio}
                options={
                  barrio && !catalogosBase.barrios.includes(barrio)
                    ? [barrio, ...catalogosBase.barrios]
                    : catalogosBase.barrios
                }
                onChange={setBarrio}
                disabled={guardando !== null}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vivienda y hogar</Text>
              <Text style={styles.cardHelp}>
                Si ya registraste a alguien que vive en la misma casa, ingresa su documento para
                compartir las preguntas de vivienda y hogar (no se repiten por persona). Si es la
                primera persona de esa casa, deja esto en blanco y solo indica la dirección.
              </Text>

              <FormInput
                label="Documento de alguien de la misma vivienda ya registrado (opcional)"
                value={documentoHogar}
                onChangeText={(v) => {
                  setDocumentoHogar(v);
                  setHogarEncontrado(null);
                }}
                keyboardType="numeric"
                editable={guardando === null}
                right={
                  <Pressable onPress={buscarHogar} disabled={buscandoHogar}>
                    {buscandoHogar ? (
                      <ActivityIndicator size="small" color={Brand.green} />
                    ) : (
                      <Ionicons name="search" size={20} color={Brand.navy} />
                    )}
                  </Pressable>
                }
              />

              {hogarEncontrado?.id_hogar ? (
                <View style={styles.note}>
                  <Ionicons name="home" size={22} color={Brand.green} />
                  <Text style={styles.noteText}>
                    Se vinculará al mismo hogar que {hogarEncontrado.nombres}.
                  </Text>
                </View>
              ) : null}

              <FormInput
                label="Dirección de la vivienda (si es una vivienda nueva)"
                value={viviendaDireccion}
                onChangeText={setViviendaDireccion}
                editable={guardando === null}
              />
            </View>

            {mensaje ? (
              <Text style={mensaje.tipo === 'ok' ? styles.ok : styles.error}>{mensaje.texto}</Text>
            ) : null}

            <AppButton
              title={estadoPrevio ? 'Continuar con los capítulos' : 'Comenzar los capítulos'}
              icon="arrow-forward"
              onPress={comenzar}
              loading={guardando === 'borrador'}
              disabled={guardando !== null}
            />
          </>
        ) : categoriaActual ? (
          <>
            <View style={styles.progreso}>
              <Text style={styles.progresoTexto}>
                Capítulo {indiceActual + 1} de {capitulosElegibles.length}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{nombreCapitulo(categoriaActual.nombre)}</Text>
              {categoriaActual.objetivo ? (
                <Text style={styles.cardHelp}>{categoriaActual.objetivo}</Text>
              ) : null}
              {categoriaActual.responde ? (
                <Text style={styles.cardQuienResponde}>Responde: {categoriaActual.responde}</Text>
              ) : null}

              {categoriaActual.preguntas.filter(esPreguntaVisible).map(renderPregunta)}
            </View>

            {mensaje ? (
              <Text style={mensaje.tipo === 'ok' ? styles.ok : styles.error}>{mensaje.texto}</Text>
            ) : null}

            <AppButton
              title="Anterior"
              variant="outline"
              onPress={irAlAnterior}
              disabled={guardando !== null}
              style={styles.botonBorrador}
            />

            {esUltimoCapitulo ? (
              <AppButton
                title="Finalizar caracterización"
                icon="checkmark"
                onPress={() => finalizar(categoriaActual)}
                loading={guardando === 'completo'}
                disabled={guardando !== null}
              />
            ) : (
              <AppButton
                title="Guardar y continuar"
                icon="arrow-forward"
                onPress={() => irAlSiguiente(categoriaActual)}
                loading={guardando === 'borrador'}
                disabled={guardando !== null}
              />
            )}
          </>
        ) : (
          <Text style={styles.error}>No hay capítulos disponibles para esta persona.</Text>
        )}
      </ScrollView>

      <AppBottomNav active="/caracterizacion" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Brand.cream,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Brand.cream,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.navy,
  },
  subtitle: {
    fontSize: 15,
    color: Brand.muted,
    marginTop: 6,
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 12,
  },
  cardHelp: {
    fontSize: 14,
    color: Brand.muted,
    marginBottom: 10,
  },
  cardQuienResponde: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.orangeDark,
    marginBottom: 12,
  },
  nota: {
    fontSize: 13,
    color: Brand.muted,
    marginBottom: 6,
  },
  progreso: {
    marginBottom: 8,
  },
  progresoTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.orangeDark,
  },
  escalaWrapper: {
    marginBottom: 16,
  },
  escalaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.navy,
    marginBottom: 6,
  },
  escalaFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  escalaChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  escalaChipActivo: {
    backgroundColor: Brand.orange,
    borderColor: Brand.orange,
  },
  escalaChipTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.navy,
  },
  escalaChipTextoActivo: {
    color: '#ffffff',
  },
  note: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Brand.navy,
  },
  botonBorrador: {
    marginBottom: 12,
  },
  ok: {
    color: '#1e8449',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  error: {
    color: Brand.danger,
    marginBottom: 12,
    textAlign: 'center',
  },
});
