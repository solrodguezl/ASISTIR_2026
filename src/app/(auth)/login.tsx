import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { FormInput } from '../../components/ui/FormInput';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [documento, setDocumento] = useState('');
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    const documentoLimpio = documento.trim();

    if (!documentoLimpio || !clave) {
      Alert.alert(
        'Campos requeridos',
        'Ingresa tu documento y contraseña.',
      );

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

      Alert.alert(
        'Error al iniciar sesión',
        message,
      );
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
        <View style={styles.content}>
          <Text style={styles.title}>Iniciar sesión</Text>

          <FormInput
            label="Documento"
            value={documento}
            onChangeText={setDocumento}
            placeholder="Documento"
            keyboardType="numeric"
            editable={!loading}
          />

          <FormInput
            label="Contraseña"
            value={clave}
            onChangeText={setClave}
            placeholder="Contraseña"
            secureTextEntry
            editable={!loading}
          />

          <AppButton
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 32,
  },

  button: {
    marginTop: 8,
  },
});