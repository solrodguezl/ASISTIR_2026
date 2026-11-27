import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '../../../components/ui/AppButton';
import { FormInput } from '../../../components/ui/FormInput';
import { LogoMark } from '../../../components/ui/Logo';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Brand } from '../../../constants/brand';
import { ApiError } from '../../../api/client';
import {
  buscarPersonaPorDocumento,
  normalizarDocumento,
  obtenerActividad,
  obtenerCatalogos,
  registrarAsistencia,
  type ActividadDetalle,
  type Catalogos,
} from '../../../services/asistenciaService';
import { useEstadoSync } from '../../../hooks/use-estado-sync';

export default function RegistrarAsistenciaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [actividad, setActividad] = useState<ActividadDetalle | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [documento, setDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [etnia, setEtnia] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [barrio, setBarrio] = useState('');

  const [autocompletado, setAutocompletado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const ultimaBusqueda = useRef('');
  const { enLinea } = useEstadoSync();

  const cargarActividad = async () => {
    if (!id) return;
    setActividad(await obtenerActividad(id));
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const [act, cat] = await Promise.all([
          obtenerActividad(id),
          obtenerCatalogos(),
        ]);

        setActividad(act);
        setCatalogos(cat);
      } catch (e) {
        setErrorCarga(
          e instanceof Error ? e.message : 'No se pudo cargar la actividad.',
        );
      } finally {
        setLoading(false);
      }
    };

    void cargar();
  }, [id]);

  // Autorrelleno por documento (HU-05): busca a la persona cuando dejas de escribir.
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
        const persona = await buscarPersonaPorDocumento(doc);

        if (ultimaBusqueda.current !== doc) return;

        setNombres(persona.nombres);
        setEtnia(persona.etnia ?? '');
        setEdad(persona.edad != null ? String(persona.edad) : '');
        setGenero(persona.genero ?? '');
        setBarrio(persona.barrio ?? '');
        setAutocompletado(true);
      } catch (e) {
        if (ultimaBusqueda.current !== doc) return;

        setAutocompletado(false);

        if (!(e instanceof ApiError && e.status === 404)) {
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

  const limpiar = () => {
    ultimaBusqueda.current = '';
    setDocumento('');
    setNombres('');
    setEtnia('');
    setEdad('');
    setGenero('');
    setBarrio('');
    setAutocompletado(false);
  };

  const handleGuardar = async () => {
    setMensaje(null);

    const doc = normalizarDocumento(documento);
    const edadNumero = Number(edad);

    if (doc.length < 5) {
      setMensaje({ tipo: 'error', texto: 'Ingresa el número de documento.' });
      return;
    }

    if (!nombres.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa los nombres completos.' });
      return;
    }

    if (!etnia || !genero || !barrio) {
      setMensaje({ tipo: 'error', texto: 'Selecciona etnia, género y barrio.' });
      return;
    }

    if (!edad.trim() || !Number.isInteger(edadNumero) || edadNumero < 0 || edadNumero > 120) {
      setMensaje({ tipo: 'error', texto: 'Ingresa una edad válida (0 a 120).' });
      return;
    }

    try {
      setGuardando(true);

      const { enCola } = await registrarAsistencia(id, {
        documento: doc,
        nombres: nombres.trim(),
        etnia,
        edad: edadNumero,
        genero,
        barrio,
      });

      setMensaje({
        tipo: 'ok',
        texto: enCola
          ? `Asistencia guardada en el teléfono: ${nombres.trim()}. Se enviará cuando haya conexión.`
          : `Asistencia guardada: ${nombres.trim()}.`,
      });
      limpiar();
      await cargarActividad();
    } catch (e) {
      setMensaje({
        tipo: 'error',
        texto: e instanceof Error ? e.message : 'No se pudo guardar la asistencia.',
      });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.orange} />
      </View>
    );
  }

  if (errorCarga || !actividad || !catalogos) {
    return (
      <ScreenContainer style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.error}>{errorCarga || 'Actividad no encontrada.'}</Text>
          <AppButton title="Volver" onPress={() => router.back()} style={styles.back} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Brand.navy} />
          <Text style={styles.backText}>Actividades</Text>
        </Pressable>

        <View style={styles.logo}>
          <LogoMark size={56} />
          <Text style={styles.brand}>DATAFRO</Text>
        </View>

        <Text style={styles.title}>{actividad.nombre}</Text>

        <View style={[styles.badge, !enLinea && styles.badgeOffline]}>
          <Ionicons
            name={enLinea ? 'checkmark-circle' : 'cloud-offline'}
            size={20}
            color={enLinea ? Brand.green : Brand.orangeDark}
          />
          <Text style={styles.badgeText}>
            {enLinea ? 'Conectado' : 'Sin conexión'} · {actividad.total_asistentes}{' '}
            {actividad.total_asistentes === 1 ? 'asistente' : 'asistentes'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Formulario de Registro de Asistencia</Text>

          <FormInput
            label="Número de documento / Cédula"
            value={documento}
            onChangeText={(v) => {
              setDocumento(v);
              setAutocompletado(false);
              setMensaje(null);
            }}
            placeholder="Documento"
            keyboardType="numeric"
            highlighted={autocompletado}
            editable={!guardando}
            right={
              buscando ? (
                <ActivityIndicator size="small" color={Brand.green} />
              ) : autocompletado ? (
                <View style={styles.chip}>
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                  <Text style={styles.chipText}>Autocompletado</Text>
                </View>
              ) : null
            }
          />

          <FormInput
            label="Nombres completos"
            value={nombres}
            onChangeText={setNombres}
            placeholder="Nombres y apellidos"
            autoCapitalize="words"
            editable={!guardando}
          />

          <SelectInput
            label="Etnia"
            value={etnia}
            options={catalogos.etnias}
            onChange={setEtnia}
            disabled={guardando}
            highlighted={autocompletado}
          />

          <FormInput
            label="Edad"
            value={edad}
            onChangeText={setEdad}
            placeholder="Años cumplidos"
            keyboardType="numeric"
            maxLength={3}
            editable={!guardando}
          />

          <SelectInput
            label="Género"
            value={genero}
            options={catalogos.generos}
            onChange={setGenero}
            disabled={guardando}
            highlighted={autocompletado}
          />

          <SelectInput
            label="Barrio"
            value={barrio}
            options={
              barrio && !catalogos.barrios.includes(barrio)
                ? [barrio, ...catalogos.barrios]
                : catalogos.barrios
            }
            onChange={setBarrio}
            disabled={guardando}
            highlighted={autocompletado}
          />

          {autocompletado ? (
            <View style={styles.note}>
              <Ionicons name="information-circle" size={22} color={Brand.orange} />
              <Text style={styles.noteText}>
                Los datos se autocompletaron de un registro anterior. Puedes editarlos antes de guardar.
              </Text>
            </View>
          ) : null}

          {mensaje ? (
            <Text style={mensaje.tipo === 'ok' ? styles.ok : styles.error}>
              {mensaje.texto}
            </Text>
          ) : null}

          <AppButton
            title="Guardar asistencia"
            icon="checkmark"
            onPress={handleGuardar}
            loading={guardando}
            style={styles.save}
          />
        </View>

        {actividad.asistentes.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Registrados en esta actividad</Text>

            {actividad.asistentes.slice(0, 10).map((a) => (
              <View key={a.id_asistencia} style={styles.attendee}>
                <Text style={styles.attendeeName}>{a.nombres}</Text>
                {a.pendiente ? (
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={Brand.orangeDark}
                    accessibilityLabel="Pendiente de envío"
                    style={styles.attendeePendiente}
                  />
                ) : null}
                <Text style={styles.attendeeDoc}>{a.documento}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
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
    paddingBottom: 32,
  },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  backText: {
    fontSize: 16,
    color: Brand.navy,
  },

  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },

  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: Brand.orangeDark,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: Brand.navy,
    marginBottom: 10,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: Brand.greenSoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },

  badgeOffline: {
    backgroundColor: Brand.orangeSoft,
  },

  badgeText: {
    fontSize: 15,
    color: Brand.navy,
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
    marginBottom: 14,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.green,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },

  chipText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
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

  save: {
    backgroundColor: Brand.orangeDark,
  },

  ok: {
    color: '#1e8449',
    fontWeight: '600',
    marginBottom: 12,
  },

  error: {
    color: Brand.danger,
    marginBottom: 12,
    textAlign: 'center',
  },

  back: {
    marginTop: 12,
    minWidth: 160,
  },

  attendee: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },

  attendeeName: {
    flex: 1,
    color: Brand.navy,
    fontWeight: '600',
  },

  attendeePendiente: {
    marginRight: 8,
  },

  attendeeDoc: {
    color: Brand.muted,
  },
});
