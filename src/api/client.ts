const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function getApiUrl(): string {
  const apiUrl = API_URL.trim();

  if (!apiUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_URL no está configurada. Agrega la variable en tu .env.',
    );
  }

  return apiUrl.replace(/\/+$/, '');
}

interface ApiErrorResponse {
  error?: string;
  details?: { campo?: string; mensaje?: string }[];
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
  /** Si el servidor no responde en este tiempo se trata como "sin conexión" (status 0). */
  timeoutMs?: number;
}

// Con señal débil fetch puede quedarse colgado minutos; así la app pasa a
// guardar en el teléfono. Alcanza para que Render despierte el servidor.
const TIMEOUT_POR_DEFECTO_MS = 45_000;

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    token,
    headers,
    timeoutMs = TIMEOUT_POR_DEFECTO_MS,
    ...requestOptions
  } = options;

  const baseUrl = getApiUrl();

  let response: Response;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      signal: controller.signal,
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
    });
  } catch {
    throw new ApiError(
      `No se pudo conectar con el servidor (${baseUrl}). Verifica que el backend esté encendido y que estés en la misma red.`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let errorMessage = 'Error en la petición';

    try {
      const data: ApiErrorResponse =
        await response.json();

      if (data.error) {
        errorMessage = data.error;
      }

      // Errores de validación: muestra el detalle (ej. "La contraseña debe tener al menos 8 caracteres").
      if (Array.isArray(data.details) && data.details.length > 0) {
        errorMessage = data.details
          .map((d) => d.mensaje)
          .filter(Boolean)
          .join(' ');
      }
    } catch {
      // La respuesta no contiene JSON.
    }

    throw new ApiError(
      errorMessage,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}