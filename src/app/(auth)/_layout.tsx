import {
  Redirect,
  Stack,
} from 'expo-router';

import { useAuth } from '../../context/AuthContext';

export default function AuthLayout() {
  const {
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <Stack
      screenOptions={{
        title: 'Login',
      }}
    />
  );
}