import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SoloRol } from '../../components/auth/SoloRol';
import { AppButton } from '../../components/ui/AppButton';
import { AppBottomNav } from '../../components/ui/BottomNavigation';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Brand } from '../../constants/brand';
import { ROL_SOLICITABLE_LABEL } from '../../constants/roles';
import {
  aprobarSolicitud,
  listarSolicitudesAdmin,
  rechazarSolicitud,
  type EstadoSolicitud,
  type SolicitudAdmin,
} from '../../services/solicitudesRolService';

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const ESTADO_COLOR: Record<EstadoSolicitud, string> = {
  pendiente: Brand.orangeDark,
  aprobada: Brand.green,
  rechazada: Brand.danger,
};

const FILTROS: { valor: EstadoSolicitud | undefined; etiqueta: string }[] = [
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'aprobada', etiqueta: 'Aprobadas' },
  { valor: 'rechazada', etiqueta: 'Rechazadas' },
  { valor: undefined, etiqueta: 'Todas' },
];

function AdminSolicitudesContenido() {
  const [filtro, setFiltro] = useState<EstadoSolicitud | undefined>('pendiente');
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const lista = await listarSolicitudesAdmin(filtro);
      setSolicitudes(lista);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes.',
      );
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const resolver = async (
    id: string,
    accion: 'aprobar' | 'rechazar',
  ) => {
    setProcesando(id);
    setError('');

    try {
      if (accion === 'aprobar') {
        await aprobarSolicitud(id);
      } else {
        await rechazarSolicitud(id);
      }

      await cargar();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo resolver la solicitud.',
      );
    } finally {
      setProcesando(null);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Solicitudes de rol</Text>

        <View style={styles.filtros}>
          {FILTROS.map((f) => {
            const activo = f.valor === filtro;

            return (
              <Pressable
                key={f.etiqueta}
                style={[styles.filtro, activo && styles.filtroActivo]}
                onPress={() => setFiltro(f.valor)}
              >
                <Text
                  style={[
                    styles.filtroTexto,
                    activo && styles.filtroTextoActivo,
                  ]}
                >
                  {f.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Brand.orange} />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && solicitudes.length === 0 ? (
          <Text style={styles.empty}>No hay solicitudes en este filtro.</Text>
        ) : null}

        {solicitudes.map((s) => (
          <View key={s.id_solicitud} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>
                {s.nombres || s.apellidos
                  ? `${s.nombres ?? ''} ${s.apellidos ?? ''}`.trim()
                  : s.documento}
              </Text>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: ESTADO_COLOR[s.estado] },
                ]}
              >
                <Text style={styles.badgeText}>{ESTADO_LABEL[s.estado]}</Text>
              </View>
            </View>

            <Text style={styles.itemMeta}>Documento: {s.documento}</Text>
            <Text style={styles.itemMeta}>
              Solicita: {ROL_SOLICITABLE_LABEL[s.rol_solicitado] ?? s.rol_solicitado}
            </Text>
            <Text style={styles.itemMeta}>
              Organización: {s.organizacion_nombre}
              {s.nit ? ` · NIT ${s.nit}` : ''}
            </Text>
            {s.cargo ? (
              <Text style={styles.itemMeta}>Cargo: {s.cargo}</Text>
            ) : null}
            {s.celular ? (
              <Text style={styles.itemMeta}>Celular: {s.celular}</Text>
            ) : null}
            {s.motivo ? (
              <Text style={styles.itemMotivo}>{s.motivo}</Text>
            ) : null}
            <Text style={styles.itemMeta}>
              {String(s.fecha_solicitud).slice(0, 10)}
            </Text>

            {s.estado === 'pendiente' ? (
              <View style={styles.acciones}>
                <AppButton
                  title="Aprobar"
                  onPress={() => resolver(s.id_solicitud, 'aprobar')}
                  loading={procesando === s.id_solicitud}
                  disabled={procesando !== null}
                  style={styles.accionBoton}
                />

                <AppButton
                  title="Rechazar"
                  variant="outline"
                  onPress={() => resolver(s.id_solicitud, 'rechazar')}
                  loading={procesando === s.id_solicitud}
                  disabled={procesando !== null}
                  style={styles.accionBoton}
                />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <AppBottomNav active="/perfil" />
    </ScreenContainer>
  );
}

export default function AdminSolicitudesScreen() {
  return (
    <SoloRol
      permiso="solicitud_rol.revisar"
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
      <AdminSolicitudesContenido />
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
    marginBottom: 16,
  },

  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },

  filtro: {
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filtroActivo: {
    borderColor: Brand.orange,
    backgroundColor: Brand.orangeSoft,
  },

  filtroTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.muted,
  },

  filtroTextoActivo: {
    color: Brand.navy,
  },

  item: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.navy,
    flex: 1,
    marginRight: 8,
  },

  itemMeta: {
    fontSize: 14,
    color: Brand.muted,
    marginTop: 2,
  },

  itemMotivo: {
    fontSize: 14,
    color: Brand.navy,
    marginTop: 8,
    fontStyle: 'italic',
  },

  badge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  badgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  acciones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  accionBoton: {
    flex: 1,
    height: 44,
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
