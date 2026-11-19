import { API_URL } from './config';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type FetchOptions = {
  method?: Method;
  body?: any;
  
  token?: string;
  query?: Record<string, string | number>;
};


let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {

  const { method = 'GET', body, token, query } = options;

  let url = `${API_URL}${path}`;

  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    url += `?${params}`;
  }

  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      
      credentials: 'include',
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

  const raw = await response.text();
  const data = raw ? safeParse(raw) : null;

  if (!response.ok) {
    const message =
      response.status >= 500
        ? 'Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.'
        : (data && (data.mensaje || data.error || data.message)) ||
          raw ||
          'Ocurrió un error al comunicarse con el servidor';

    
    if (response.status === 401 && token !== undefined) {
      onUnauthorized?.();
    }

    // Spring responde 403 (no 401) cuando falta la cookie o ya venció.
    // Un 403 también puede ser un permiso real denegado, así que solo se
    // cierra la sesión si /api/auth/me confirma que ya no hay sesión.
    if (response.status === 403 && token !== undefined && path !== '/api/auth/me') {
      if (!(await sesionVigente())) {
        onUnauthorized?.();
      }
    }

    throw new Error(message);
  }

  return data as T;
}


async function sesionVigente(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
    return res.ok;
  } catch {
    // Sin conexión: no se cierra la sesión por esto.
    return true;
  }
}

export async function obtenerIdUsuarioActual(): Promise<number> {
  const usuario = await apiFetch<{ id: number }>('/api/auth/me', { token: '' });
  return usuario.id;
}

const safeParse = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};