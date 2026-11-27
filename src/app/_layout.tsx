import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';


import { AuthProvider } from '@/context/AuthContext';
// Registra la tarea de sincronización en segundo plano al cargar la app
// (TaskManager.defineTask tiene que correr en el ámbito global).
import '@/offline/backgroundSync';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
          }}
          edges={['top', 'bottom']}
        >


          <Stack
            screenOptions={{
              headerShown: false,
              headerBackTitle: 'Atrás',
              headerTintColor: '#111111',
              contentStyle: {
                backgroundColor: '#ffffff',
              },
            }}
          />
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}