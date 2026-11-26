import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SoloRol } from '../../../components/auth/SoloRol';
import { AppBottomNav } from '../../../components/ui/BottomNavigation';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Brand } from '../../../constants/brand';
import {
  listarOrganizaciones,
  type OrganizacionAdmin,
} from '../../../services/organizacionesService';

function PanelOrganizaciones() {
  const [organizaciones, setOrganizaciones] = useState<OrganizacionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const lista = await listarOrganizaciones();
      setOrganizaciones(lista);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar las organizaciones.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Organizaciones registradas</Text>

        <Text style={styles.subtitle}>
          Historial de todas las organizaciones que existen en ASISTIR. Toca
          una para ver quiénes están registrados en ella.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={Brand.orange} />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && organizaciones.length === 0 ? (
          <Text style={styles.empty}>Todavía no hay organizaciones registradas.</Text>
        ) : null}

        {organizaciones.map((org) => (
          <Pressable
            key={org.id_organizacion}
            style={styles.card}
            onPress={() =>
              router.push(`/admin-organizaciones/${org.id_organizacion}` as Href)
            }
          >
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{org.nombre}</Text>
              <Text style={styles.cardMeta}>
                {org.total_miembros}{' '}
                {org.total_miembros === 1 ? 'miembro' : 'miembros'}
                {org.nit ? ` · NIT ${org.nit}` : ''}
              </Text>
              <Text style={styles.cardMeta}>
                Registrada el {String(org.fecha_creacion).slice(0, 10)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <AppBottomNav active="/perfil" />
    </ScreenContainer>
  );
}

export default function AdminOrganizacionesScreen() {
  return (
    <SoloRol
      min="ADMINISTRADOR INVESTIGATIVO"
      fallback={
        <ScreenContainer style={styles.screen}>
          <View style={styles.sinPermiso}>
            <Text style={styles.sinPermisoTexto}>
              No tienes permiso para ver esta sección.
            </Text>
          </View>
          <AppBottomNav active="/perfil" />
        </ScreenContainer>
      }
    >
      <PanelOrganizaciones />
    </SoloRol>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Brand.cream,
  },

  content: {
    padding: 20,
    paddingBottom: 96,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: Brand.muted,
    marginBottom: 18,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.navy,
  },

  cardMeta: {
    fontSize: 14,
    color: Brand.muted,
    marginTop: 2,
  },

  empty: {
    textAlign: 'center',
    color: Brand.muted,
    marginTop: 12,
  },

  error: {
    color: Brand.danger,
    marginBottom: 12,
  },

  sinPermiso: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  sinPermisoTexto: {
    fontSize: 16,
    color: Brand.muted,
    textAlign: 'center',
  },
});
