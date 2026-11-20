// Historial de notificaciones (crear/editar/eliminar, etc.) que se guarda en
// localStorage para poder verlo despues en el panel de Notificaciones, a
// diferencia de los toasts que aparecen un momento y desaparecen.

const CLAVE = "natymoo_notificaciones";
const LIMITE = 100; // no crecer sin control

export function obtenerNotificaciones() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : [];
  } catch {
    return [];
  }
}

export function agregarNotificacion(mensaje, tipo = "info") {
  const actuales = obtenerNotificaciones();
  const nueva = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mensaje,
    tipo,
    fecha: new Date().toISOString(),
    leida: false,
  };
  const actualizadas = [nueva, ...actuales].slice(0, LIMITE);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actualizadas));
  } catch {
    // localStorage lleno/bloqueado: no rompe la app, solo no se guarda el historial.
  }
  return actualizadas;
}

export function marcarTodasLeidas() {
  const actualizadas = obtenerNotificaciones().map((n) => ({ ...n, leida: true }));
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actualizadas));
  } catch {
    // no-op
  }
  return actualizadas;
}

export function limpiarNotificaciones() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // no-op
  }
  return [];
}
