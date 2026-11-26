import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '../../constants/brand';

interface LogoProps {
  size?: number;
  showName?: boolean;
  nameSize?: number;
}

/** Emblema aproximado de DATAFRO. Reemplázalo por la imagen oficial cuando la tengas. */
export function LogoMark({ size = 64 }: { size?: number }) {
  const ring = Math.max(4, Math.round(size * 0.09));
  const dot = Math.round(size * 0.16);

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ring,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            top: size * 0.2,
            right: size * 0.2,
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            top: size * 0.42,
            right: size * 0.2,
          },
        ]}
      />
      <View
        style={[
          styles.hill,
          {
            width: size * 0.6,
            height: size * 0.3,
            borderTopLeftRadius: size * 0.3,
            borderTopRightRadius: size * 0.3,
            bottom: 0,
          },
        ]}
      />
    </View>
  );
}

export function Logo({ size = 64, showName = true, nameSize = 40 }: LogoProps) {
  return (
    <View style={styles.column}>
      <LogoMark size={size} />
      {showName ? (
        <Text style={[styles.name, { fontSize: nameSize }]}>DATAFRO</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
  },
  ring: {
    borderColor: Brand.orange,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dot: {
    position: 'absolute',
    backgroundColor: Brand.navy,
  },
  hill: {
    backgroundColor: Brand.green,
  },
  name: {
    fontWeight: '800',
    color: Brand.navy,
    letterSpacing: 1,
    marginTop: 12,
  },
});
