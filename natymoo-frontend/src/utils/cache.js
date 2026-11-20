// Cache simple en localStorage para no tener que volver a pedirle todo al
// backend cada vez que se recarga la página (ej: el carrito, el catálogo).
// Cada entrada guarda cuándo se guardó, así se puede vencer sola despues de
// un rato (los precios/stock sí cambian). Se limpia por completo al cerrar
// sesión (ver limpiarCacheApp, llamado desde AuthContext.logout).

const PREFIJO = "natymoo_cache_";

export function guardarCache(clave, datos) {
  try {
    localStorage.setItem(
      PREFIJO + clave,
      JSON.stringify({ datos, guardadoEn: Date.now() })
    );
  } catch {
    // localStorage lleno o bloqueado (modo incognito estricto, etc.) -> no pasa nada,
    // la app simplemente vuelve a pedir los datos al backend como si no hubiera cache.
  }
}

/**
 * Lee una entrada de cache. Devuelve null si no existe o si ya vencio
 * (maxEdadMs, por defecto 5 minutos).
 */
export function leerCache(clave, maxEdadMs = 5 * 60 * 1000) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    if (!crudo) return null;
    const { datos, guardadoEn } = JSON.parse(crudo);
    if (Date.now() - guardadoEn > maxEdadMs) return null;
    return datos;
  } catch {
    return null;
  }
}

export function borrarCache(clave) {
  try {
    localStorage.removeItem(PREFIJO + clave);
  } catch {
    // no-op
  }
}

/** Borra TODA la cache de la app. Se llama al cerrar sesión. */
export function limpiarCacheApp() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // no-op
  }
}
