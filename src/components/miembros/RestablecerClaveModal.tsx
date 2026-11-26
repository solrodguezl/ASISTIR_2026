import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand } from '../../constants/brand';
import { nombreCompleto, type Miembro } from '../../services/miembrosService';
import { AppButton } from '../ui/AppButton';

// Contraseña temporal legible: evita caracteres que se confunden entre sí
// (0/O, 1/l/I) para que quien la reciba la pueda transcribir sin errores.
const CARACTERES = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generarClaveTemporal(longitud = 10): string {
  let clave = '';
  for (let i = 0; i < longitud; i += 1) {
    clave += CARACTERES[Math.floor(Math.random() * CARACTERES.length)];
  }
  return clave;
}

type Estado = 'confirmar' | 'guardando' | 'lista' | 'error';

interface Props {
  visible: boolean;
  miembro: Miembro | null;
  onConfirmar: (clave: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Las contraseñas se guardan con bcrypt (hash de un solo sentido): nadie,
 * ni siquiera con acceso directo a la base de datos, puede "ver" la que
 * escribió la persona. En su lugar, quien administra el perfil puede
 * restablecerla: se genera una contraseña temporal nueva y se muestra una
 * sola vez, para que se la entregue a esa persona.
 */
export function RestablecerClaveModal({ visible, miembro, onConfirmar, onClose }: Props) {
  const [estado, setEstado] = useState<Estado>('confirmar');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setEstado('confirmar');
      setClave('');
      setError('');
    }
  }, [visible, miembro?.id]);

  const confirmar = async () => {
    const nueva = generarClaveTemporal();
    setEstado('guardando');

    try {
      await onConfirmar(nueva);
      setClave(nueva);
      setEstado('lista');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña.');
      setEstado('error');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={estado === 'lista' ? undefined : onClose}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.titulo}>Restablecer contraseña</Text>

          {estado === 'confirmar' || estado === 'error' ? (
            <>
              <Text style={styles.texto}>
                Se generará una contraseña temporal nueva para{' '}
                {miembro ? nombreCompleto(miembro) : 'esta persona'}. La contraseña actual
                dejará de funcionar de inmediato.
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <AppButton title="Generar y restablecer" onPress={confirmar} />
              <AppButton
                title="Cancelar"
                variant="outline"
                onPress={onClose}
                style={styles.espacio}
              />
            </>
          ) : null}

          {estado === 'guardando' ? (
            <ActivityIndicator size="large" color={Brand.orange} style={styles.espacio} />
          ) : null}

          {estado === 'lista' ? (
            <>
              <Text style={styles.texto}>
                Entrégale esta contraseña a {miembro ? nombreCompleto(miembro) : 'la persona'}{' '}
                ahora mismo: no se volverá a mostrar.
              </Text>
              <View style={styles.claveBox}>
                <Text style={styles.claveTexto} selectable>
                  {clave}
                </Text>
              </View>
              <AppButton title="Listo" onPress={onClose} style={styles.espacio} />
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 10,
  },
  texto: {
    fontSize: 15,
    color: Brand.navy,
    marginBottom: 14,
  },
  error: {
    color: Brand.danger,
    marginBottom: 10,
  },
  claveBox: {
    backgroundColor: Brand.cream,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 6,
  },
  claveTexto: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
    color: Brand.navy,
  },
  espacio: {
    marginTop: 10,
  },
});
