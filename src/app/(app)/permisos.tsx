import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppBottomNav } from '../../components/ui/BottomNavigation';
import { FormInput } from '../../components/ui/FormInput';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { SelectInput } from '../../components/ui/SelectInput';
import { Brand } from '../../constants/brand';
import {
  NIVEL_ROL,
  ROL_SOLICITABLE_LABEL,
  nivelDe,
  type RolSolicitable,
} from '../../constants/roles';
import { useSesion } from '../../hooks/use-sesion';
import {
  crearSolicitud,
  misSolicitudes,
  type EstadoSolicitud,
  type Solicitud,
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

export default function PermisosScreen() {
  const { sesion, recargar: recargarSesion } = useSesion();

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rolSolicitado, setRolSolicitado] = useState<RolSolicitable | ''>('');
  const [organizacionNombre, setOrganizacionNombre] = useState('');
  const [nit, setNit] = useState('');
  const [celular, setCelular] = useState('');
  const [cargo, setCargo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [okForm, setOkForm] = useState('');

  const cargar = useCallback(async () => {
    try {
      setError('');
      const lista = await misSolicitudes();
      setSolicitudes(lista);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar tus solicitudes.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const nivelActual = nivelDe(sesion?.rol);
  const opciones: RolSolicitable[] = (
    ['COORDINADOR', 'DIRECTOR'] as RolSolicitable[]
  ).filter((r) => NIVEL_ROL[r] > nivelActual);

  const hayPendiente = solicitudes.some((s) => s.estado === 'pendiente');

  const handleEnviar = async () => {
    setErrorForm('');
    setOkForm('');

    if (!rolSolicitado) {
      setErrorForm('Selecciona el rol que quieres solicitar.');
      return;
    }

    if (!organizacionNombre.trim()) {
      setErrorForm('Escribe el nombre de tu organización.');
      return;
    }

    try {
      setEnviando(true);

      await crearSolicitud({
        rolSolicitado,
        organizacionNombre: organizacionNombre.trim(),
        nit: nit.trim() || null,
        celular: celular.trim() || null,
        cargo: cargo.trim() || null,
        motivo: motivo.trim() || null,
      });

      setOkForm('Tu solicitud fue enviada. Un administrador la revisará.');
      setRolSolicitado('');
      setOrganizacionNombre('');
      setNit('');
      setCelular('');
      setCargo('');
      setMotivo('');
      await cargar();
      await recargarSesion();
    } catch (e) {
      setErrorForm(
        e instanceof Error ? e.message : 'No se pudo enviar la solicitud.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Solicitar permisos</Text>

        <Text style={styles.subtitle}>
          Tu rol actual es{' '}
          <Text style={styles.subtitleStrong}>
            {sesion?.rol ?? 'Gestor'}
          </Text>
          . Pide un rol con más permisos si coordinas o diriges una
          organización.
        </Text>

        {opciones.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nueva solicitud</Text>

            {hayPendiente ? (
              <Text style={styles.info}>
                Ya tienes una solicitud pendiente. Espera a que sea resuelta
                antes de enviar otra.
              </Text>
            ) : null}

            <SelectInput
              label="Rol que quieres solicitar"
              value={rolSolicitado}
              options={opciones}
              onChange={(v) => setRolSolicitado(v as RolSolicitable)}
              placeholder="Selecciona un rol"
              format={(v) => ROL_SOLICITABLE_LABEL[v as RolSolicitable] ?? v}
              disabled={enviando || hayPendiente}
            />

            <FormInput
              label="Nombre de tu organización"
              value={organizacionNombre}
              onChangeText={setOrganizacionNombre}
              placeholder="Ej. Corporación Sal y Luz"
              autoCapitalize="sentences"
              editable={!enviando && !hayPendiente}
            />

            <FormInput
              label="NIT (opcional)"
              value={nit}
              onChangeText={setNit}
              placeholder="NIT de la organización"
              editable={!enviando && !hayPendiente}
            />

            <FormInput
              label="Celular de contacto (opcional)"
              value={celular}
              onChangeText={setCelular}
              placeholder="Celular"
              keyboardType="phone-pad"
              editable={!enviando && !hayPendiente}
            />

            <FormInput
              label="Cargo (opcional)"
              value={cargo}
              onChangeText={setCargo}
              placeholder="Ej. Líder comunitario"
              autoCapitalize="sentences"
              editable={!enviando && !hayPendiente}
            />

            <FormInput
              label="Motivo (opcional)"
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Cuéntanos por qué necesitas este rol"
              autoCapitalize="sentences"
              multiline
              editable={!enviando && !hayPendiente}
            />

            {errorForm ? <Text style={styles.error}>{errorForm}</Text> : null}
            {okForm ? <Text style={styles.ok}>{okForm}</Text> : null}

            <AppButton
              title="Enviar solicitud"
              onPress={handleEnviar}
              loading={enviando}
              disabled={enviando || hayPendiente}
              style={styles.button}
            />
          </View>
        ) : (
          <Text style={styles.info}>
            Ya tienes el nivel máximo que se puede solicitar desde esta
            pantalla.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Mis solicitudes</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Brand.orange} />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && solicitudes.length === 0 ? (
          <Text style={styles.empty}>Todavía no has hecho solicitudes.</Text>
        ) : null}

        {solicitudes.map((s) => (
          <View key={s.id_solicitud} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>
                {ROL_SOLICITABLE_LABEL[s.rol_solicitado] ?? s.rol_solicitado}
              </Text>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: ESTADO_COLOR[s.estado] },
                ]}
              >
                <Text style={styles.badgeText}>
                  {ESTADO_LABEL[s.estado]}
                </Text>
              </View>
            </View>

            <Text style={styles.itemMeta}>{s.organizacion_nombre}</Text>
            <Text style={styles.itemMeta}>
              {String(s.fecha_solicitud).slice(0, 10)}
            </Text>

            {s.comentario_resolucion ? (
              <Text style={styles.itemComentario}>
                {s.comentario_resolucion}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <AppBottomNav active="/perfil" />
    </ScreenContainer>
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

  subtitleStrong: {
    fontWeight: '700',
    color: Brand.navy,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 12,
  },

  button: {
    marginTop: 8,
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
  },

  itemMeta: {
    fontSize: 14,
    color: Brand.muted,
    marginTop: 2,
  },

  itemComentario: {
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

  info: {
    fontSize: 14,
    color: Brand.navy,
    backgroundColor: Brand.orangeSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
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
});
