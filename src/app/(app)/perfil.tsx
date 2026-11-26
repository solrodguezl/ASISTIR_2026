import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { ApiError } from '../../api/client';

import { AppButton } from '../../components/ui/AppButton';
import { AppBottomNav } from '../../components/ui/BottomNavigation';
import { FormInput } from '../../components/ui/FormInput';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Brand } from '../../constants/brand';
import { NIVEL_ROL, nivelDe } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { useSesion } from '../../hooks/use-sesion';
import {
  actualizarMiPerfil,
  obtenerMiPerfil,
} from '../../services/perfilesService';

export default function PerfilScreen() {
  const { logout } = useAuth();
  const { sesion } = useSesion();
  const nivelActual = nivelDe(sesion?.rol);
  const puedeSolicitar = nivelActual > 0 && nivelActual < NIVEL_ROL.DIRECTOR;
  const esAdmin = Boolean(sesion?.permisos.includes('solicitud_rol.revisar'));
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error';
    texto: string;
  } | null>(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const perfil = await obtenerMiPerfil();

        setNombres(perfil.nombres);
        setApellidos(perfil.apellidos);
        setTelefono(perfil.telefono ?? '');
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 404
        ) {
          // El usuario todavía no tiene perfil.
          // Dejamos el formulario vacío para permitir crearlo.
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'No fue posible cargar el perfil.';

        setMensaje({ tipo: 'error', texto: message });
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  const handleGuardar = async () => {
    const nombresLimpios = nombres.trim();
    const apellidosLimpios = apellidos.trim();
    const telefonoLimpio = telefono.trim();

    setMensaje(null);

    if (!nombresLimpios || !apellidosLimpios) {
      setMensaje({
        tipo: 'error',
        texto: 'Nombres y apellidos son obligatorios.',
      });

      return;
    }

    try {
      setSaving(true);

      await actualizarMiPerfil({
        nombres: nombresLimpios,
        apellidos: apellidosLimpios,
        telefono: telefonoLimpio || null,
      });

      setMensaje({
        tipo: 'ok',
        texto: 'Perfil guardado correctamente.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el perfil.';

      setMensaje({ tipo: 'error', texto: message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Mi perfil</Text>

        {sesion?.rol ? (
          <View style={styles.rolRow}>
            <View style={styles.rolChip}>
              <Text style={styles.rolChipText}>{sesion.rol}</Text>
            </View>
            {sesion.organizacion_nombre ? (
              <Text style={styles.rolOrg} numberOfLines={1}>
                {sesion.organizacion_nombre}
              </Text>
            ) : null}
          </View>
        ) : null}

        {puedeSolicitar ? (
          <AppButton
            title="Solicitar permisos"
            variant="outline"
            icon="arrow-up-circle-outline"
            onPress={() => router.push('/permisos' as Href)}
            style={styles.buttonSecundario}
          />
        ) : null}

        {esAdmin ? (
          <AppButton
            title="Revisar solicitudes"
            variant="outline"
            icon="checkmark-done-circle-outline"
            onPress={() => router.push('/admin-solicitudes' as Href)}
            style={styles.buttonSecundario}
          />
        ) : null}

        {esAdmin ? (
          <AppButton
            title="Ver organizaciones"
            variant="outline"
            icon="business-outline"
            onPress={() => router.push('/admin-organizaciones' as Href)}
            style={styles.buttonSecundario}
          />
        ) : null}

        <FormInput
          label="Nombres"
          value={nombres}
          onChangeText={setNombres}
          placeholder="Nombres"
          editable={!saving}
        />

        <FormInput
          label="Apellidos"
          value={apellidos}
          onChangeText={setApellidos}
          placeholder="Apellidos"
          editable={!saving}
        />

        <FormInput
          label="Teléfono"
          value={telefono}
          onChangeText={setTelefono}
          placeholder="Teléfono"
          keyboardType="phone-pad"
          editable={!saving}
        />

        {mensaje ? (
          <Text
            style={
              mensaje.tipo === 'ok'
                ? styles.mensajeOk
                : styles.mensajeError
            }
          >
            {mensaje.texto}
          </Text>
        ) : null}

        <AppButton
          title="Guardar"
          onPress={handleGuardar}
          loading={saving}
          disabled={saving}
          style={styles.button}
        />
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title="Cerrar sesión"
          variant="danger"
          onPress={logout}
          icon="log-out-outline"
          style={styles.buttonLogout}
        />
      </View>

      <AppBottomNav active="/perfil" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B2233',
    marginBottom: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  button: {
    marginTop: 8,
  },

  mensajeOk: {
    color: '#1e8449',
    fontWeight: '600',
    marginBottom: 12,
  },

  mensajeError: {
    color: '#c0392b',
    marginBottom: 12,
  },

  buttonLogout: {
    marginTop: 0,
    marginBottom: 12,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },

  rolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  rolChip: {
    backgroundColor: Brand.navy,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 10,
  },

  rolChipText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  rolOrg: {
    flex: 1,
    fontSize: 15,
    color: Brand.muted,
  },

  buttonSecundario: {
    marginBottom: 16,
  },

});