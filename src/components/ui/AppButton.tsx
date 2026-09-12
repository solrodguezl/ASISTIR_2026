import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AppButtonVariant = 'primary' | 'danger';

interface AppButtonProps extends PressableProps {
  title: string;
  variant?: AppButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function AppButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  icon,
  ...props
}: AppButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.danger,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color="#ffffff"
              style={styles.icon}
            />
          ) : null}
          <Text style={styles.text}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: '#222222',
  },
  danger: {
    backgroundColor: '#e2594f',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
