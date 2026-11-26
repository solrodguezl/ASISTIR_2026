import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '../../constants/brand';
import { NIVEL_ROL, nivelDe } from '../../constants/roles';
import { useSesion } from '../../hooks/use-sesion';

export type BottomNavigationRoute =
  | '/home'
  | '/asistencia'
  | '/caracterizacion'
  | '/miembros'
  | '/perfil';

interface NavItem {
  route: BottomNavigationRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ITEMS: NavItem[] = [
  { route: '/home', label: 'Inicio', icon: 'home' },
  { route: '/asistencia', label: 'Asistencia', icon: 'clipboard' },
  { route: '/caracterizacion', label: 'Caracterización', icon: 'document-text' },
  { route: '/miembros', label: 'Miembros', icon: 'people' },
  { route: '/perfil', label: 'Perfil', icon: 'person' },
];

interface AppBottomNavProps {
  active: BottomNavigationRoute;
}

/** Barra de navegación inferior compartida por todas las pantallas internas. */
export function AppBottomNav({ active }: AppBottomNavProps) {
  const { sesion } = useSesion();
  // "Miembros" solo se muestra a DIRECTOR+ (GET /miembros ahora lo exige en el backend).
  const nivelActual = nivelDe(sesion?.rol);
  const items = ITEMS.filter(
    (item) => item.route !== '/miembros' || nivelActual >= NIVEL_ROL.DIRECTOR,
  );

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = item.route === active;
        const color = isActive ? Brand.orange : Brand.navy;

        return (
          <Pressable
            key={item.route}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => {
              if (!isActive) {
                router.replace(item.route as Href);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Ionicons name={item.icon} size={24} color={color} />
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF1',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 3,
    borderTopColor: 'transparent',
    marginTop: -1,
  },
  tabActive: {
    borderTopColor: Brand.orange,
  },
  label: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});
