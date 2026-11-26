import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
  NIVEL_ROL,
  ROL_COLOR,
  ROL_LABEL,
  rolesAsignablesPara,
} from '../../../../constants/brand';
import { nombreCompleto, type Miembro } from '../../../../services/miembrosService';
import {
  actualizarMiembroEnOrganizacion,
  crearMiembroEnOrganizacion,
  obtenerOrganizacion,
  type OrganizacionDetalle,
} from '../../../../services/organizacionesService';

// El administrador investigativo tiene el nivel más alto: puede crear o
// editar cualquiera de los tres roles de organización (HU-03). El servidor
// aplica exactamente la misma regla, así que esto es solo para no ofrecer
// en el selector un rol que de todas formas sería rechazado.
const ROLES_ASIGNABLES_ADMIN = rolesAsignablesPara('ADMINISTRADOR INVESTIGATIVO');

function DetalleOrganizacion({ id }: { id: string }) {
  const [datos, setDatos] = useState<OrganizacionDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<Miembro | null>(null);
  const [menuDe, setMenuDe] = useState<Miembro | null>(null);
  const [claveDe, setClaveDe] = useState<Miembro | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const detalle = await obtenerOrganizacion(id);
      setDatos(detalle);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo cargar la organización.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirCrear = () => {
    setEditando(null);
    setFormVisible(true);
  };

  const abrirEditar = (m: Miembro) => {
    setMenuDe(null);
    setEditando(m);
    setFormVisible(true);
  };

  const alternarActivo = async (m: Miembro) => {
    setMenuDe(null);
    setMensaje('');

    try {
      await actualizarMiembroEnOrganizacion(id, m.id, {
        nombres: m.nombres ?? '',
        apellidos: m.apellidos ?? '',
        telefono: m.telefono,
        rol: m.rol,
        activo: !m.activo,
      });
      setMensaje(m.activo ? 'Miembro desactivado.' : 'Miembro activado.');
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  // El rol ADMINISTRADOR INVESTIGATIVO no tiene "nivel" dentro de la lista de
  // roles de organización (queda fuera a propósito), así que esos registros
  // no se editan desde aquí — solo DIRECTOR/COORDINADOR/GESTOR.
  const puedeGestionarA = (m: Miembro) => (NIVEL_ROL[m.rol] ?? 0) > 0;

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={Brand.navy} />
          <Text style={styles.backText}>Organizaciones</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator size="large" color={Brand.orange} />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mensaje ? <Text style={styles.ok}>{mensaje}</Text> : null}

        {datos ? (
          <>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{datos.organizacion.nombre}</Text>
                <Text style={styles.subtitle}>
                  {datos.miembros.length}{' '}
                  {datos.miembros.length === 1
                    ? 'persona registrada'
                    : 'personas registradas'}
                  {datos.organizacion.nit ? ` · NIT ${datos.organizacion.nit}` : ''}
                </Text>
              </View>

              <Pressable
                style={styles.addButton}
                onPress={abrirCrear}
                accessibilityLabel="Crear perfil"
              >
                <Ionicons name="add" size={28} color={Brand.navy} />
              </Pressable>
            </View>

            {datos.miembros.length === 0 ? (
              <Text style={styles.empty}>
                Esta organización todavía no tiene miembros registrados.
              </Text>
            ) : null}

            {datos.miembros.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.card, !m.activo && styles.inactive]}
                onPress={() => router.push(`/admin-organizaciones/${id}/${m.id}` as never)}
              >
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{nombreCompleto(m)}</Text>
                  <Text style={styles.cardMeta}>Documento: {m.documento}</Text>
                  {m.telefono ? (
                    <Text style={styles.cardMeta}>Tel: {m.telefono}</Text>
                  ) : null}
                </View>

                <View style={styles.badges}>
                  <View
                    style={[styles.badge, { backgroundColor: ROL_COLOR[m.rol] }]}
                  >
                    <Text style={styles.badgeText}>
                      {ROL_LABEL[m.rol] ?? m.rol}
                    </Text>
                  </View>

                  {!m.activo ? (
                    <View style={[styles.badge, styles.badgeGrey]}>
                      <Text style={styles.badgeText}>Inactivo</Text>
                    </View>
                  ) : null}
                </View>

                {puedeGestionarA(m) ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setMenuDe(m);
                    }}
                    hitSlop={12}
                    style={styles.menuButton}
                    accessibilityLabel="Más opciones"
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={Brand.navy} />
                  </Pressable>
                ) : null}
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>

      <AppBottomNav active="/perfil" />

      <MiembroFormModal
        visible={formVisible}
        miembro={editando}
        roles={ROLES_ASIGNABLES_ADMIN}
        esYo={false}
        onCrear={(data) => crearMiembroEnOrganizacion(id, data)}
        onActualizar={(idUsuario, data) =>
          actualizarMiembroEnOrganizacion(id, idUsuario, data)
        }
        onClose={() => setFormVisible(false)}
        onSaved={async (texto) => {
          setFormVisible(false);
          setMensaje(texto);
          await cargar();
        }}
      />

      <Modal
        visible={menuDe !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuDe(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuDe(null)}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>{menuDe ? nombreCompleto(menuDe) : ''}</Text>

            <Pressable style={styles.menuItem} onPress={() => menuDe && abrirEditar(menuDe)}>
              <Ionicons name="create-outline" size={22} color={Brand.navy} />
              <Text style={styles.menuText}>Editar</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => menuDe && void alternarActivo(menuDe)}
            >
              <Ionicons
                name={menuDe?.activo ? 'ban-outline' : 'checkmark-circle-outline'}
                size={22}
                color={menuDe?.activo ? Brand.danger : Brand.green}
              />
              <Text style={styles.menuText}>{menuDe?.activo ? 'Desactivar' : 'Activar'}</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                const m = menuDe;
                setMenuDe(null);
                setClaveDe(m);
              }}
            >
              <Ionicons name="key-outline" size={22} color={Brand.navy} />
              <Text style={styles.menuText}>Restablecer contraseña</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <RestablecerClaveModal
        visible={claveDe !== null}
        miembro={claveDe}
        onConfirmar={async (clave) => {
          if (!claveDe) return;
          await actualizarMiembroEnOrganizacion(id, claveDe.id, {
            nombres: claveDe.nombres ?? '',
            apellidos: claveDe.apellidos ?? '',
            telefono: claveDe.telefono,
            rol: claveDe.rol,
            activo: claveDe.activo,
            clave,
          });
        }}
        onClose={() => setClaveDe(null)}
      />
    </ScreenContainer>
  );
}

export default function AdminOrganizacionDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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
      {id ? <DetalleOrganizacion id={id} /> : null}
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

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 15,
    color: Brand.muted,
  },

  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F0B054',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  inactive: {
    opacity: 0.55,
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.navy,
  },

  cardMeta: {
    fontSize: 14,
    color: Brand.muted,
    marginTop: 2,
  },

  badges: {
    gap: 6,
    marginLeft: 10,
  },

  badge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  badgeGrey: {
    backgroundColor: '#8A8E9B',
  },

  badgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  menuButton: {
    marginLeft: 10,
    padding: 4,
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

  ok: {
    color: '#1e8449',
    fontWeight: '600',
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

  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },

  menu: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.navy,
    marginBottom: 6,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },

  menuText: {
    fontSize: 17,
    color: Brand.navy,
  },
});
