import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ROL_LABEL, Brand } from '../../constants/brand';
import {
  actualizarMiembro,
  crearMiembro,
  type ActualizarMiembroRequest,
  type CrearMiembroRequest,
  type Miembro,
  type Rol,
} from '../../services/miembrosService';
import { AppButton } from '../ui/AppButton';
import { FormInput } from '../ui/FormInput';
import { SelectInput } from '../ui/SelectInput';

interface Props {
  visible: boolean;
  /** null = crear un miembro nuevo; con valor = editar. */
  miembro: Miembro | null;
  roles: string[];
  esYo: boolean;
  onClose: () => void;
  onSaved: (mensaje: string) => void;
  /**
   * Por defecto crea/edita en la propia organización (POST/PUT /miembros).
   * El panel del administrador pasa estas dos para operar sobre cualquier
   * organización (POST/PUT /admin/organizaciones/:id/miembros...).
   */
  onCrear?: (data: CrearMiembroRequest) => Promise<unknown>;
  onActualizar?: (id: string, data: ActualizarMiembroRequest) => Promise<unknown>;
}

export function MiembroFormModal({
  visible,
  miembro,
  roles,
  esYo,
  onClose,
  onSaved,
  onCrear = crearMiembro,
  onActualizar = actualizarMiembro,
}: Props) {
  const editando = miembro !== null;

  const [documento, setDocumento] = useState('');
  const [clave, setClave] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<string>('GESTOR');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;

    setError('');
    setClave('');
    setDocumento(miembro?.documento ?? '');
    setNombres(miembro?.nombres ?? '');
    setApellidos(miembro?.apellidos ?? '');
    setTelefono(miembro?.telefono ?? '');
    setRol(miembro?.rol ?? 'GESTOR');
  }, [visible, miembro]);

  const handleGuardar = async () => {
    setError('');

    if (!editando && documento.trim().length < 8) {
      setError('El documento debe tener al menos 8 caracteres.');
      return;
    }

    if (!editando && clave.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (editando && clave && clave.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!nombres.trim() || !apellidos.trim()) {
      setError('Nombres y apellidos son obligatorios.');
      return;
    }

    try {
      setGuardando(true);

      if (editando && miembro) {
        await onActualizar(miembro.id, {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          telefono: telefono.trim() || null,
          rol: rol as Rol,
          ...(clave ? { clave } : {}),
        });
        onSaved('Miembro actualizado correctamente.');
      } else {
        await onCrear({
          documento: documento.trim(),
          clave,
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          telefono: telefono.trim() || null,
          rol: rol as Rol,
        });
        onSaved('Perfil creado correctamente.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {editando ? 'Editar miembro' : 'Crear perfil'}
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <FormInput
              label="Documento"
              value={documento}
              onChangeText={setDocumento}
              placeholder="Documento de identidad"
              keyboardType="numeric"
              editable={!editando && !guardando}
            />

            <FormInput
              label={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              value={clave}
              onChangeText={setClave}
              placeholder={
                editando ? 'Déjala vacía para no cambiarla' : 'Mínimo 8 caracteres'
              }
              secureTextEntry
              editable={!guardando}
            />

            <FormInput
              label="Nombres"
              value={nombres}
              onChangeText={setNombres}
              placeholder="Nombres"
              autoCapitalize="words"
              editable={!guardando}
            />

            <FormInput
              label="Apellidos"
              value={apellidos}
              onChangeText={setApellidos}
              placeholder="Apellidos"
              autoCapitalize="words"
              editable={!guardando}
            />

            <FormInput
              label="Teléfono"
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Teléfono"
              keyboardType="phone-pad"
              maxLength={20}
              editable={!guardando}
            />

            <SelectInput
              label="Rol"
              value={rol}
              options={roles}
              format={(v) => ROL_LABEL[v] ?? v}
              onChange={setRol}
              disabled={guardando || (editando && esYo)}
            />

            {editando && esYo ? (
              <Text style={styles.hint}>No puedes cambiar tu propio rol.</Text>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <AppButton
              title="Cancelar"
              variant="outline"
              onPress={onClose}
              disabled={guardando}
              style={styles.action}
            />
            <AppButton
              title="Guardar"
              onPress={handleGuardar}
              loading={guardando}
              style={styles.action}
            />
          </View>
        </View>

      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 14,
  },

  hint: {
    color: Brand.muted,
    marginBottom: 10,
  },

  error: {
    color: Brand.danger,
    marginBottom: 10,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  action: {
    flex: 1,
  },
});
