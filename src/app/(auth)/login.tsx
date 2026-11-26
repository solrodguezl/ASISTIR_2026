import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
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

export default function LoginScreen() {
  const [documento, setDocumento] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const { login } = useAuth();

  const handleLogin = async () => {
    const documentoLimpio = documento.trim();

    setErrorMsg('');
    setInfoMsg('');

    if (!documentoLimpio || !clave) {
      setErrorMsg('Ingresa tu documento y contraseña.');

      return;
    }

    try {
      setLoading(true);

      await login({
        documento: documentoLimpio,
        clave,
      });
      router.replace('/home');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión.';

      // Alert.alert no muestra nada en web, por eso se usa texto en pantalla.
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
            Bienvenido/a, inicia sesión para continuar.
          </Text>

          <FormInput
            leftIcon="person"
            value={documento}
            onChangeText={setDocumento}
            placeholder="Usuario o documento"
            keyboardType="numeric"
            editable={!loading}
          />

          <FormInput
            leftIcon="key"
            value={clave}
            onChangeText={setClave}
            placeholder="Contraseña"
            secureTextEntry={!verClave}
            editable={!loading}
            onSubmitEditing={handleLogin}
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

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
          {infoMsg ? <Text style={styles.info}>{infoMsg}</Text> : null}

          <AppButton
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          />

          <Pressable
            onPress={() => {
              setErrorMsg('');
              setInfoMsg(
                'Pide a tu Director que restablezca tu contraseña desde la sección Miembros.',
              );
            }}
          >
            <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/registro' as Href)}>
            <Text style={styles.forgot}>¿No tienes cuenta? Crea una aquí</Text>
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

  forgot: {
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

  info: {
    color: Brand.muted,
    marginBottom: 12,
  },
});
