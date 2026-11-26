import { Ionicons } from '@expo/vector-icons';
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

import { Brand } from '../../constants/brand';

export type AppButtonVariant = 'primary' | 'danger' | 'outline';

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
  const outline = variant === 'outline';
  const textColor = outline ? Brand.navy : '#ffffff';

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        outline && styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={textColor}
              style={styles.icon}
            />
          ) : null}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: Brand.orange,
  },
  danger: {
    backgroundColor: '#e2594f',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Brand.border,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
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
