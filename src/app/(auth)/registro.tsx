import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { FormInput } from '../../components/ui/FormInput';
import { Logo } from '../../components/ui/Logo';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Brand } from '../../constants/brand';
import { useAuth } from '../../context/AuthContext';
import { registrar } from '../../services/authService';

export default function RegistroScreen() {
  const [documento, setDocumento] = useState('');
  const [clave, setClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();

  const handleRegistro = async () => {
    const documentoLimpio = documento.trim();

    setErrorMsg('');

    if (!documentoLimpio || !clave || !confirmarClave) {
      setErrorMsg('Completa tu documento y contraseña.');
      return;
    }

    if (documentoLimpio.length < 8) {
      setErrorMsg('El documento debe tener al menos 8 caracteres.');
      return;
    }

    if (clave.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (clave !== confirmarClave) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);

      // El registro siempre crea un usuario con el rol base (GESTOR).
      // Esta pantalla nunca envía ni permite elegir un rol.
      await registrar({
        documento: documentoLimpio,
        clave,
      });

      await login({
        documento: documentoLimpio,
        clave,
      });

      router.replace('/home');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible crear la cuenta.';

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Logo size={110} nameSize={44} />
          </View>

          <Text style={styles.welcome}>
            Crea tu cuenta para empezar a registrar asistencia.
          </Text>

          <FormInput
            leftIcon="person"
            value={documento}
            onChangeText={setDocumento}
            placeholder="Documento"
            keyboardType="numeric"
            editable={!loading}
          />

          <FormInput
            leftIcon="key"
            value={clave}
            onChangeText={setClave}
            placeholder="Contraseña (mínimo 8 caracteres)"
            secureTextEntry={!verClave}
            editable={!loading}
            right={
              <Pressable
                onPress={() => setVerClave((v) => !v)}
                hitSlop={10}
                accessibilityLabel={
                  verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
              >
                <Ionicons
                  name={verClave ? 'eye' : 'eye-off'}
                  size={22}
                  color={Brand.navy}
                />
              </Pressable>
            }
          />

          <FormInput
            leftIcon="key"
            value={confirmarClave}
            onChangeText={setConfirmarClave}
            placeholder="Confirma tu contraseña"
            secureTextEntry={!verClave}
            editable={!loading}
            onSubmitEditing={handleRegistro}
          />

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          <AppButton
            title="Crear cuenta"
            onPress={handleRegistro}
            loading={loading}
            disabled={loading}
            style={styles.button}
          />

          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },

  logo: {
    alignItems: 'center',
    marginBottom: 28,
  },

  welcome: {
    fontSize: 20,
    textAlign: 'center',
    color: Brand.navy,
    marginBottom: 28,
  },

  button: {
    marginTop: 8,
  },

  link: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: Brand.navy,
  },

  error: {
    color: Brand.danger,
    marginBottom: 12,
  },
});
