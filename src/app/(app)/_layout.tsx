import {
  Redirect,
  Stack,
} from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { EstadoSync } from '../../components/ui/EstadoSync';
import { useAuth } from '../../context/AuthContext';
import { iniciarMonitorSync } from '../../offline/monitor';

export default function AppLayout() {
  const {
    loading,
    isAuthenticated,
  } = useAuth();

  // Vigila la conexión y envía la cola offline mientras haya sesión iniciada.
  useEffect(() => {
    if (!isAuthenticated) return;
    return iniciarMonitorSync();
  }, [isAuthenticated]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <EstadoSync />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
}
