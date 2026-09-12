import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ApiError } from '../../api/client';

import { AppButton } from '../../components/ui/AppButton';
import {
  BottomNavigation,
  type BottomNavigationItem,
} from '../../components/ui/BottomNavigation';
import { FormInput } from '../../components/ui/FormInput';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import {
  actualizarMiPerfil,
  obtenerMiPerfil,
} from '../../services/perfilesService';

export default function PerfilScreen() {
  const { logout } = useAuth();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navItems: BottomNavigationItem[] = [
    { route: '/home', active: false, icon: 'home' },
    { route: '/perfil', active: true, icon: 'person' },
    
  ];

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

        Alert.alert('Error', message);
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

    if (!nombresLimpios || !apellidosLimpios) {
      Alert.alert(
        'Campos requeridos',
        'Nombres y apellidos son obligatorios.',
      );

      return;
    }

    try {
      setSaving(true);

      await actualizarMiPerfil({
        nombres: nombresLimpios,
        apellidos: apellidosLimpios,
        telefono: telefonoLimpio || null,
      });

      Alert.alert(
        'Perfil guardado',
        'La información del perfil fue guardada correctamente.',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el perfil.';

      Alert.alert('Error', message);
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
      <Stack.Screen
        options={{
          title: 'Mi perfil',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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

      <View style={styles.navWrapper}>
        <BottomNavigation
          items={navItems}
          onNavigate={(route) => router.push(route)}
        />
      </View>
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  button: {
    marginTop: 8,
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

  navWrapper: {
    width: '100%',
    alignItems: 'center',
  },
});