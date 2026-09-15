import * as SplashScreen from 'expo-splash-screen';
import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from 'react';

import {
    clearSession,
    getAccessToken,
    getStoredUser,
    login as loginService,
    logout as logoutService,
} from '../services/authService';

import type {
    LoginRequest,
    Usuario,
} from '../types/auth';

interface AuthContextValue {
  usuario: Usuario | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await getStoredUser();
        const token = await getAccessToken();

        if (!storedUser || !token) {
          await clearSession();
          setAccessToken(null);
          setUsuario(null);
          return;
        }

        setAccessToken(token);
        setUsuario(storedUser);
      } catch {
        await clearSession();
        setAccessToken(null);
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    if (!loading) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loading]);
  const login = async (
    credentials: LoginRequest,
  ): Promise<void> => {
    const response =
      await loginService(credentials);

    setAccessToken(response.accessToken);
    setUsuario(response.usuario);
  };

  const logout = async (): Promise<void> => {
    await logoutService();

    setAccessToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        accessToken,
        loading,
        isAuthenticated: Boolean(
          accessToken && usuario,
        ),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider',
    );
  }

  return context;
}