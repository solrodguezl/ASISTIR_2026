import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { obtenerSesion, type Sesion } from '../services/sesionService';
import { useAuth } from '../context/AuthContext';

const SESION_KEY = 'sesion_cache';
const isWeb = Platform.OS === 'web';

async function leerCache(): Promise<Sesion | null> {
  try {
    const raw = isWeb
      ? globalThis.localStorage?.getItem(SESION_KEY)
      : await SecureStore.getItemAsync(SESION_KEY);

    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

async function escribirCache(sesion: Sesion): Promise<void> {
  try {
    const raw = JSON.stringify(sesion);

    if (isWeb) {
      globalThis.localStorage?.setItem(SESION_KEY, raw);
    } else {
      await SecureStore.setItemAsync(SESION_KEY, raw);
    }
  } catch {
    // Si no se puede cachear, la próxima carga simplemente vuelve a pedir al backend.
  }
}

/**
 * Rol, nivel, organización y permisos del usuario autenticado (Fase 1).
 * Se carga de GET /auth/me al montar y al volver la app a primer plano, y se
 * cachea en SecureStore para que <SoloRol> tenga algo que mostrar sin
 * conexión — el backend siempre vuelve a validar el permiso real en cada
 * petición, esto es solo para no ocultar/mostrar mal la UI mientras no hay red.
 */
export function useSesion() {
  const { isAuthenticated } = useAuth();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const montado = useRef(true);

  const cargar = useCallback(async () => {
    if (!isAuthenticated) {
      setSesion(null);
      setCargando(false);
      return;
    }

    const cache = await leerCache();
    if (cache && montado.current) {
      setSesion(cache);
      setCargando(false);
    }

    try {
      const fresca = await obtenerSesion();
      if (!montado.current) return;

      setSesion(fresca);
      setError('');
      void escribirCache(fresca);
    } catch (e) {
      if (!montado.current) return;

      if (!cache) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar tu sesión.');
      }
    } finally {
      if (montado.current) setCargando(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    montado.current = true;
    void cargar();

    return () => {
      montado.current = false;
    };
  }, [cargar]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void cargar();
    });

    return () => sub.remove();
  }, [cargar]);

  return { sesion, cargando, error, recargar: cargar };
}
