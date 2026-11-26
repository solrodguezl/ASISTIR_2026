import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MiembroFormModal } from '../../components/miembros/MiembroFormModal';
import { RestablecerClaveModal } from '../../components/miembros/RestablecerClaveModal';
import { AppBottomNav } from '../../components/ui/BottomNavigation';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import {
  Brand,
  NIVEL_ROL,
  ROL_COLOR,
  ROL_LABEL,
  rolesAsignablesPara,
} from '../../constants/brand';
import { useYo } from '../../hooks/use-yo';
import { obtenerCatalogos } from '../../services/asistenciaService';
import {
  actualizarMiembro,
  listarMiembros,
  nombreCompleto,
  type ListaMiembros,
  type Miembro,
} from '../../services/miembrosService';

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

function Avatar({ miembro }: { miembro: Miembro }) {
  const foto = miembro.foto_perfil;

  if (foto && /^(https?:|data:)/.test(foto)) {
    return <Image source={{ uri: foto }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, { backgroundColor: colorAvatar(miembro.id) }]}>
      <Text style={styles.avatarText}>{iniciales(miembro)}</Text>
    </View>
  );
}

export default function MiembrosScreen() {
  const { yo } = useYo();
  // HU-03: DIRECTOR y COORDINADOR administran perfiles de su organización,
  // cada uno limitado a los roles de nivel menor al suyo (lo decide
  // rolesAsignablesPara; el servidor aplica la misma regla siempre).
  const puedeGestionar = yo?.rol === 'DIRECTOR' || yo?.rol === 'COORDINADOR';
  const rolesAsignables = rolesAsignablesPara(yo?.rol);

  const [datos, setDatos] = useState<ListaMiembros | null>(null);
  const [roles, setRoles] = useState<string[]>(['DIRECTOR', 'COORDINADOR', 'GESTOR']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<Miembro | null>(null);
  const [menuDe, setMenuDe] = useState<Miembro | null>(null);
  const [claveDe, setClaveDe] = useState<Miembro | null>(null);

  const cargar = useCallback(async () => {
    try {
      setError('');
      const [lista, catalogos] = await Promise.all([
        listarMiembros(),
        obtenerCatalogos(),
      ]);

      setDatos(lista);
      setRoles(rolesAsignables.length ? rolesAsignables : catalogos.roles);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los miembros.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      await actualizarMiembro(m.id, {
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

  const puedeDesactivar = (m: Miembro) =>
    m.id !== yo?.id && Boolean(m.nombres || m.apellidos);

  // Un Director o Coordinador solo puede editar/activar a alguien de nivel
  // menor al suyo (el servidor exige exactamente esto, ver miembrosService).
  const puedeGestionarA = (m: Miembro) => {
    if (!yo?.rol) return false;
    const nivelPropio = NIVEL_ROL[yo.rol] ?? 0;
    const nivelOtro = NIVEL_ROL[m.rol] ?? 0;
    return nivelOtro < nivelPropio;
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Solo tu organización puede ver estos datos. El rol Administrador solo
          accede a datos anonimizados con fines investigativos.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            Miembros de {datos?.organizacion.nombre ?? 'tu organización'}
          </Text>

          {puedeGestionar ? (
            <Pressable
              style={styles.addButton}
              onPress={abrirCrear}
              accessibilityLabel="Crear perfil"
            >
              <Ionicons name="add" size={30} color={Brand.navy} />
            </Pressable>
          ) : null}
        </View>

        {mensaje ? <Text style={styles.ok}>{mensaje}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <ActivityIndicator size="large" color={Brand.orange} /> : null}

        {datos?.miembros.map((m) => (
          <View key={m.id} style={[styles.card, !m.activo && styles.inactive]}>
            <Avatar miembro={m} />

            <View style={styles.cardText}>
              <Text style={styles.name} numberOfLines={1}>
                {nombreCompleto(m)}
              </Text>

              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: ROL_COLOR[m.rol] }]}>
                  <Text style={styles.badgeText}>{ROL_LABEL[m.rol] ?? m.rol}</Text>
                </View>

                {!m.activo ? (
                  <View style={[styles.badge, styles.badgeGrey]}>
                    <Text style={styles.badgeText}>Inactivo</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {puedeGestionar && puedeGestionarA(m) ? (
              <Pressable
                onPress={() => setMenuDe(m)}
                hitSlop={12}
                accessibilityLabel="Más opciones"
              >
                <Ionicons name="ellipsis-vertical" size={22} color={Brand.navy} />
              </Pressable>
            ) : null}
          </View>
        ))}

        {!loading && !error && datos?.miembros.length === 0 ? (
          <Text style={styles.empty}>Aún no hay miembros.</Text>
        ) : null}
      </ScrollView>

      {puedeGestionar ? (
        <Pressable style={styles.fab} onPress={abrirCrear}>
          <Ionicons name="add" size={24} color={Brand.navy} />
          <Text style={styles.fabText}>Crear perfil</Text>
        </Pressable>
      ) : null}

      <AppBottomNav active="/miembros" />

      <MiembroFormModal
        visible={formVisible}
        miembro={editando}
        roles={roles}
        esYo={editando?.id === yo?.id}
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

            <Pressable
              style={styles.menuItem}
              onPress={() => menuDe && abrirEditar(menuDe)}
            >
              <Ionicons name="create-outline" size={22} color={Brand.navy} />
              <Text style={styles.menuText}>Editar</Text>
            </Pressable>

            {menuDe && puedeDesactivar(menuDe) ? (
              <Pressable
                style={styles.menuItem}
                onPress={() => menuDe && void alternarActivo(menuDe)}
              >
                <Ionicons
                  name={menuDe.activo ? 'ban-outline' : 'checkmark-circle-outline'}
                  size={22}
                  color={menuDe.activo ? Brand.danger : Brand.green}
                />
                <Text style={styles.menuText}>
                  {menuDe.activo ? 'Desactivar' : 'Activar'}
                </Text>
              </Pressable>
            ) : null}

            {menuDe && puedeGestionarA(menuDe) ? (
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
            ) : null}
          </View>
        </Pressable>
      </Modal>

      <RestablecerClaveModal
        visible={claveDe !== null}
        miembro={claveDe}
        onConfirmar={async (clave) => {
          if (!claveDe) return;
          await actualizarMiembro(claveDe.id, {
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

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Brand.cream,
  },

  banner: {
    backgroundColor: Brand.orangeSoft,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  bannerText: {
    textAlign: 'center',
    fontSize: 15,
    color: Brand.navy,
  },

  content: {
    padding: 20,
    paddingBottom: 96,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginLeft: 12,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },

  inactive: {
    opacity: 0.55,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600',
  },

  cardText: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    fontSize: 19,
    fontWeight: '600',
    color: Brand.navy,
  },

  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },

  badge: {
    alignSelf: 'flex-start',
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
    fontSize: 14,
  },

  ok: {
    color: '#1e8449',
    fontWeight: '600',
    marginBottom: 12,
  },

  error: {
    color: Brand.danger,
    marginBottom: 12,
  },

  empty: {
    textAlign: 'center',
    color: Brand.muted,
    marginTop: 24,
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0B054',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  fabText: {
    fontSize: 17,
    fontWeight: '600',
    color: Brand.navy,
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
