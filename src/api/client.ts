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
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
  });

  if (!response.ok) {
    let errorMessage = 'Error en la petición';

    try {
      const data: ApiErrorResponse =
        await response.json();

      if (data.error) {
        errorMessage = data.error;
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