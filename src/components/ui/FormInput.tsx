import {
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';

interface FormInputProps extends TextInputProps {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function FormInput({
  label,
  containerStyle,
  style,
  editable = true,
  ...props
}: FormInputProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        editable={editable}
        style={[
          styles.input,
          !editable && styles.disabled,
          style,
        ]}
        placeholderTextColor="#777777"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    color: '#111111',
    backgroundColor: '#ffffff',
  },
  disabled: {
    opacity: 0.6,
  },
});
