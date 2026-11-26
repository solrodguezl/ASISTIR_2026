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

interface SelectInputProps {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  highlighted?: boolean;
  /** Función para mostrar un texto distinto al valor guardado (ej. rol). */
  format?: (value: string) => string;
}

export function SelectInput({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled = false,
  highlighted = false,
  format,
}: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const show = (v: string) => (format ? format(v) : v);

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
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={1}
        >
          {value ? show(value) : placeholder}
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
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item === value && styles.optionSelected,
                    ]}
                  >
                    {show(item)}
                  </Text>
                  {item === value ? (
                    <Ionicons name="checkmark" size={20} color={Brand.orange} />
                  ) : null}
                </Pressable>
              )}
            />
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
    height: 52,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 16,
    paddingHorizontal: 14,
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
    fontSize: 16,
    color: Brand.navy,
  },
  optionSelected: {
    fontWeight: '700',
    color: Brand.orange,
  },
});
