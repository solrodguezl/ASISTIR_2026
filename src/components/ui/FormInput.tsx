import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';

import { Brand } from '../../constants/brand';

interface FormInputProps extends TextInputProps {
  label?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
  highlighted?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function FormInput({
  label,
  leftIcon,
  right,
  highlighted = false,
  containerStyle,
  style,
  editable = true,
  ...props
}: FormInputProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          highlighted && styles.fieldHighlighted,
          !editable && styles.disabled,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={22}
            color={Brand.navy}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...props}
          editable={editable}
          style={[styles.input, style]}
          placeholderTextColor="#8A8E9B"
          autoCapitalize={props.autoCapitalize ?? 'none'}
          autoCorrect={false}
        />

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
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
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: Brand.navy,
    // Evita el recuadro azul que web dibuja al enfocar.
    outlineStyle: 'none',
  } as never,
  right: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
