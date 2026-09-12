import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  BottomNavigation,
  type BottomNavigationItem,
} from '../../components/ui/BottomNavigation';
import { ScreenContainer } from '../../components/ui/ScreenContainer';

export default function HomeScreen() {
  const navItems: BottomNavigationItem[] = [
    { route: '/home', active: true, icon: 'home' },
    { route: '/perfil', active: false, icon: 'person' },
  ];

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido a DATAFRO</Text>

        <Text style={styles.subtitle}>
          Has iniciado sesión correctamente.
        </Text>

      </View>

      <View style={styles.navWrapper}>
        <BottomNavigation
          items={navItems}
          onNavigate={(route) => router.push(route)}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },

  navWrapper: {
    width: '100%',
    paddingHorizontal: 0,
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 32,
  },

  button: {
    minWidth: 180,
  },
});