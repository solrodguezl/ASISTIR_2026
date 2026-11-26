import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Brand } from '../../constants/brand';

interface MultiSelectInputProps {
  label?: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  highlighted?: boolean;
}

/** Selector de varias opciones (checklist), para preguntas de selección múltiple. */
export function MultiSelectInput({
  label,
  values,
  options,
  onChange,
  placeholder = 'Selecciona una o varias opciones',
  disabled = false,
  highlighted = false,
}: MultiSelectInputProps) {
  const [open, setOpen] = useState(false);

  const toggle = (opcion: string) => {
    if (values.includes(opcion)) {
      onChange(values.filter((v) => v !== opcion));
    } else {
      onChange([...values, opcion]);
    }
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={[
          styles.field,
          highlighted && styles.fieldHighlighted,
          disabled && styles.disabled,
        ]}
        accessibilityRole="button"
      >
        <Text
          style={[styles.value, values.length === 0 && styles.placeholder]}
          numberOfLines={2}
        >
          {values.length > 0 ? values.join(', ') : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Brand.navy} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{label ?? placeholder}</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const seleccionado = values.includes(item);

                return (
                  <Pressable
                    style={styles.option}
                    onPress={() => toggle(item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        seleccionado && styles.optionSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    <Ionicons
                      name={seleccionado ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={seleccionado ? Brand.orange : Brand.muted}
                    />
                  </Pressable>
                );
              }}
            />

            <Pressable style={styles.done} onPress={() => setOpen(false)}>
              <Text style={styles.doneText}>Listo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.navy,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  fieldHighlighted: {
    borderColor: Brand.green,
    backgroundColor: '#F4FAF4',
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: Brand.navy,
    marginRight: 8,
  },
  placeholder: {
    color: '#8A8E9B',
  },
  disabled: {
    opacity: 0.6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.navy,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Brand.navy,
    marginRight: 8,
  },
  optionSelected: {
    fontWeight: '700',
    color: Brand.orange,
  },
  done: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Brand.orange,
  },
  doneText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
