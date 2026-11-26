import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SoloRol } from '../../../components/auth/SoloRol';
import { AppButton } from '../../../components/ui/AppButton';
import { AppBottomNav } from '../../../components/ui/BottomNavigation';
import { FormInput } from '../../../components/ui/FormInput';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SelectInput } from '../../../components/ui/SelectInput';
import { Brand } from '../../../constants/brand';
import {
  crearActividad,
  listarActividades,
  obtenerCatalogos,
  type Actividad,
} from '../../../services/asistenciaService';

const hoy = () => new Date().toISOString().slice(0, 10);

export default function AsistenciaScreen() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [barrios, setBarrios] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(hoy());
  const [barrio, setBarrio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const cargar = useCallback(async () => {
    try {
      setError('');
      const [lista, catalogos] = await Promise.all([
        listarActividades(),
        obtenerCatalogos(),
      ]);

      setActividades(lista);
      setBarrios(catalogos.barrios);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar las actividades.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que la pantalla vuelve a estar en primer plano (ej. al volver del formulario).
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const handleCrear = async () => {
    setErrorForm('');

    if (nombre.trim().length < 3) {
      setErrorForm('Escribe el nombre de la actividad (mínimo 3 letras).');

      return;
    }

    try {
      setGuardando(true);

      const nueva = await crearActividad({
        nombre: nombre.trim(),
        fecha,
        barrio: barrio || null,
      });

      setNombre('');
      setBarrio('');
      setCreando(false);
      router.push(`/asistencia/${nueva.id_actividad}` as Href);
    } catch (e) {
      setErrorForm(
        e instanceof Error ? e.message : 'No se pudo crear la actividad.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Registrar asistencia</Text>

          <SoloRol min="COORDINADOR">
            <Pressable
              style={styles.addButton}
              onPress={() => setCreando((v) => !v)}
              accessibilityLabel="Nueva actividad"
            >
              <Ionicons
                name={creando ? 'close' : 'add'}
                size={28}
                color={Brand.navy}
              />
            </Pressable>
          </SoloRol>
        </View>

        <Text style={styles.subtitle}>
          Elige la actividad en la que vas a registrar personas, o crea una nueva.
        </Text>

        {creando ? (
          <SoloRol min="COORDINADOR">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nueva actividad</Text>

            <FormInput
              label="Nombre de la actividad"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Jornada de Salud"
              autoCapitalize="sentences"
              editable={!guardando}
            />

            <FormInput
              label="Fecha (AAAA-MM-DD)"
              value={fecha}
              onChangeText={setFecha}
              placeholder="2026-09-18"
              editable={!guardando}
            />

            <SelectInput
              label="Barrio"
              value={barrio}
              options={barrios}
              onChange={setBarrio}
              placeholder="Selecciona el barrio"
              disabled={guardando}
            />

            {errorForm ? <Text style={styles.error}>{errorForm}</Text> : null}

            <AppButton
              title="Crear y registrar asistentes"
              onPress={handleCrear}
              loading={guardando}
            />
          </View>
          </SoloRol>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color={Brand.orange} style={styles.loader} />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && actividades.length === 0 ? (
          <Text style={styles.empty}>
            Todavía no hay actividades. Toca el botón + para crear la primera.
          </Text>
        ) : null}

        {actividades.map((actividad) => (
          <Pressable
            key={actividad.id_actividad}
            style={styles.item}
            onPress={() =>
              router.push(`/asistencia/${actividad.id_actividad}` as Href)
            }
          >
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{actividad.nombre}</Text>
              <Text style={styles.itemMeta}>
                {String(actividad.fecha).slice(0, 10)}
                {actividad.barrio ? ` · ${actividad.barrio}` : ''}
              </Text>
              <Text style={styles.itemCount}>
                {actividad.total_asistentes}{' '}
                {actividad.total_asistentes === 1 ? 'asistente' : 'asistentes'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={Brand.navy} />
          </Pressable>
        ))}
      </ScrollView>

      <AppBottomNav active="/asistencia" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Brand.cream,
  },

  content: {
    padding: 20,
    paddingBottom: 28,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: Brand.navy,
  },

  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F0B054',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 12,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  itemText: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.navy,
  },

  itemMeta: {
    fontSize: 14,
    color: Brand.muted,
    marginTop: 2,
  },

  itemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.green,
    marginTop: 4,
  },

  loader: {
    marginTop: 24,
  },

  empty: {
    textAlign: 'center',
    color: Brand.muted,
    marginTop: 24,
  },

  error: {
    color: Brand.danger,
    marginBottom: 12,
  },
});
