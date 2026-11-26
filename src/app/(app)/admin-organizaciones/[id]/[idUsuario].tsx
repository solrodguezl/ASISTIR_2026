import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SoloRol } from '../../../../components/auth/SoloRol';
import { MiembroFormModal } from '../../../../components/miembros/MiembroFormModal';
import { RestablecerClaveModal } from '../../../../components/miembros/RestablecerClaveModal';
import { AppBottomNav } from '../../../../components/ui/BottomNavigation';
import { ScreenContainer } from '../../../../components/ui/ScreenContainer';
import {
  Brand,
  ROL_COLOR,
  ROL_LABEL,
  rolesAsignablesPara,
} from '../../../../constants/brand';
import { nombreCompleto, type Miembro } from '../../../../services/miembrosService';
import {
  actualizarMiembroEnOrganizacion,
  obtenerResumenMiembroEnOrganizacion,
  type OrganizacionInfo,
} from '../../../../services/organizacionesService';
import type { ResumenActividad } from '../../../../services/miembrosService';

const ROLES_ASIGNABLES_ADMIN = rolesAsignablesPara('ADMINISTRADOR INVESTIGATIVO');

const AVATAR_COLORS = ['#B0463C', '#2E6B3F', '#D9761E', '#6B4C9A', '#2F6F8F'];

function colorAvatar(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function iniciales(m: Miembro) {
  const texto = nombreCompleto(m);
  const partes = texto.split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?';
}

const formatearFecha = (fecha: string | null) => (fecha ? fecha : 'Sin registros aún');

function PerfilMiembro({ idOrganizacion, idUsuario }: { idOrganizacion: string; idUsuario: string }) {
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [organizacion, setOrganizacion] = useState<OrganizacionInfo | null>(null);
  const [resumen, setResumen] = useState<ResumenActividad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [formVisible, setFormVisible] = useState(false);
  const [claveVisible, setClaveVisible] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const datos = await obtenerResumenMiembroEnOrganizacion(idOrganizacion, idUsuario);
      setMiembro(datos.miembro);
      setResumen(datos.resumen);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [idOrganizacion, idUsuario]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const alternarActivo = async () => {
    if (!miembro) return;
    setMensaje('');

    try {
      await actualizarMiembroEnOrganizacion(idOrganizacion, miembro.id, {
        nombres: miembro.nombres ?? '',
        apellidos: miembro.apellidos ?? '',
        telefono: miembro.telefono,
        rol: miembro.rol,
        activo: !miembro.activo,
      });
      setMensaje(miembro.activo ? 'Perfil desactivado.' : 'Perfil activado.');
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.orange} />
      </View>
    );
  }

  if (error || !miembro) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'No se encontró este perfil.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="arrow-back" size={22} color={Brand.navy} />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>

      {mensaje ? <Text style={styles.ok}>{mensaje}</Text> : null}

      {/* Tarjeta de perfil, estilo DATAFRO: avatar, nombre, rol y organización. */}
      <View style={styles.card}>
        <View style={styles.perfilFila}>
          <View style={[styles.avatar, { backgroundColor: colorAvatar(miembro.id) }]}>
            <Text style={styles.avatarText}>{iniciales(miembro)}</Text>
          </View>

          <View style={styles.perfilDatos}>
            <Text style={styles.nombre}>{nombreCompleto(miembro)}</Text>
            <View style={[styles.badge, { backgroundColor: ROL_COLOR[miembro.rol] }]}>
              <Text style={styles.badgeText}>{ROL_LABEL[miembro.rol] ?? miembro.rol}</Text>
            </View>
            <Text style={styles.meta}>Documento: {miembro.documento}</Text>
            {miembro.telefono ? <Text style={styles.meta}>Tel: {miembro.telefono}</Text> : null}
            {!miembro.activo ? <Text style={styles.inactivoTexto}>Perfil inactivo</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.acciones}>
        <Pressable style={styles.accionBoton} onPress={() => setFormVisible(true)}>
          <Ionicons name="create-outline" size={20} color={Brand.navy} />
          <Text style={styles.accionTexto}>Editar</Text>
        </Pressable>

        <Pressable style={styles.accionBoton} onPress={() => void alternarActivo()}>
          <Ionicons
            name={miembro.activo ? 'ban-outline' : 'checkmark-circle-outline'}
            size={20}
            color={miembro.activo ? Brand.danger : Brand.green}
          />
          <Text style={styles.accionTexto}>{miembro.activo ? 'Desactivar' : 'Activar'}</Text>
        </Pressable>

        <Pressable style={styles.accionBoton} onPress={() => setClaveVisible(true)}>
          <Ionicons name="key-outline" size={20} color={Brand.navy} />
          <Text style={styles.accionTexto}>Restablecer clave</Text>
        </Pressable>
      </View>

      {/* "Histórico": como las cuentas de la organización (Director/Coordinador/
          Gestor) son quienes organizan actividades y registran la asistencia de
          otros —no quienes asisten—, este panel muestra lo que de verdad existe
          en la base de datos: las actividades que esta persona ha organizado,
          en vez de una asistencia personal que el modelo de datos no registra
          para estas cuentas. */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Actividades organizadas</Text>

        {resumen && resumen.actividadesRecientes.length > 0 ? (
          resumen.actividadesRecientes.map((a) => (
            <View key={a.id_actividad} style={styles.actividadFila}>
              <View style={styles.actividadIcono}>
                <Ionicons name="calendar" size={18} color={Brand.green} />
              </View>

              <View style={styles.actividadTexto}>
                <Text style={styles.actividadNombre}>{a.nombre}</Text>
                <Text style={styles.actividadMeta}>
                  {a.fecha}
                  {a.barrio ? ` · ${a.barrio}` : ''}
                </Text>
              </View>

              <View style={styles.asistentesBadge}>
                <Text style={styles.asistentesTexto}>{a.total_asistentes} asist.</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.vacio}>Esta persona aún no ha organizado actividades.</Text>
        )}
      </View>

      {/* "Resumen Rápido". */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen rápido</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={22} color={Brand.orangeDark} />
            <Text style={styles.statLabel}>Asistencias registradas</Text>
            <Text style={styles.statValor}>{resumen?.totalAsistenciasRegistradas ?? 0}</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="calendar" size={22} color={Brand.orangeDark} />
            <Text style={styles.statLabel}>Actividades creadas</Text>
            <Text style={styles.statValor}>{resumen?.actividadesCreadas ?? 0}</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={22} color={Brand.orangeDark} />
            <Text style={styles.statLabel}>Prom. asistentes</Text>
            <Text style={styles.statValor}>{resumen?.promedioAsistentes ?? 0}</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="time" size={22} color={Brand.orangeDark} />
            <Text style={styles.statLabel}>Última actividad</Text>
            <Text style={styles.statValorChico}>
              {formatearFecha(resumen?.ultimaActividadFecha ?? null)}
            </Text>
          </View>
        </View>
      </View>

      <MiembroFormModal
        visible={formVisible}
        miembro={miembro}
        roles={ROLES_ASIGNABLES_ADMIN}
        esYo={false}
        onCrear={(data) => actualizarMiembroEnOrganizacion(idOrganizacion, miembro.id, data)}
        onActualizar={(idUsuarioEditado, data) =>
          actualizarMiembroEnOrganizacion(idOrganizacion, idUsuarioEditado, data)
        }
        onClose={() => setFormVisible(false)}
        onSaved={async (texto) => {
          setFormVisible(false);
          setMensaje(texto);
          await cargar();
        }}
      />

      <RestablecerClaveModal
        visible={claveVisible}
        miembro={miembro}
        onConfirmar={async (clave) => {
          await actualizarMiembroEnOrganizacion(idOrganizacion, miembro.id, {
            nombres: miembro.nombres ?? '',
            apellidos: miembro.apellidos ?? '',
            telefono: miembro.telefono,
            rol: miembro.rol,
            activo: miembro.activo,
            clave,
          });
        }}
        onClose={() => setClaveVisible(false)}
      />
    </ScrollView>
  );
}

export default function PerfilMiembroScreen() {
  const { id, idUsuario } = useLocalSearchParams<{ id: string; idUsuario: string }>();

  return (
    <SoloRol
      min="ADMINISTRADOR INVESTIGATIVO"
      fallback={
        <ScreenContainer style={styles.screen}>
          <View style={styles.center}>
            <Text style={styles.error}>No tienes permiso para ver esta sección.</Text>
          </View>
          <AppBottomNav active="/perfil" />
        </ScreenContainer>
      }
    >
      <ScreenContainer style={styles.screen}>
        {id && idUsuario ? (
          <PerfilMiembro idOrganizacion={id} idUsuario={idUsuario} />
        ) : null}
        <AppBottomNav active="/perfil" />
      </ScreenContainer>
    </SoloRol>
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
  },
  content: {
    padding: 20,
    paddingBottom: 96,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.navy,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 12,
  },
  perfilFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  perfilDatos: {
    flex: 1,
    gap: 4,
  },
  nombre: {
    fontSize: 20,
    fontWeight: '800',
    color: Brand.navy,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  meta: {
    fontSize: 14,
    color: Brand.muted,
  },
  inactivoTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.danger,
    marginTop: 2,
  },
  acciones: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  accionBoton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  accionTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.navy,
    textAlign: 'center',
  },
  actividadFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    gap: 10,
  },
  actividadIcono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actividadTexto: {
    flex: 1,
  },
  actividadNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.navy,
  },
  actividadMeta: {
    fontSize: 13,
    color: Brand.muted,
    marginTop: 2,
  },
  asistentesBadge: {
    backgroundColor: Brand.orangeSoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  asistentesTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.orangeDark,
  },
  vacio: {
    color: Brand.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  statItem: {
    width: '45%',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Brand.muted,
    textAlign: 'center',
  },
  statValor: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.navy,
  },
  statValorChico: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.navy,
    textAlign: 'center',
  },
  error: {
    color: Brand.danger,
    textAlign: 'center',
  },
  ok: {
    color: '#1e8449',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
});
