import {
  Redirect,
  Stack,
} from 'expo-router';

import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const {
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        title: 'Home',
      }}
    />
  );
}