import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ToastContext = createContext(null);

let contadorId = 0;
const CLAVE_HISTORIAL = "natymoo_notificaciones";
const MAX_HISTORIAL = 50;

function cargarHistorial() {
  try {
    const crudo = localStorage.getItem(CLAVE_HISTORIAL);
    return crudo ? JSON.parse(crudo) : [];
  } catch {
    return [];
  }
}

function guardarHistorial(lista) {
  try {
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(lista.slice(0, MAX_HISTORIAL)));
  } catch {
    // no-op
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [historial, setHistorial] = useState(() => cargarHistorial());

  useEffect(() => {
    guardarHistorial(historial);
  }, [historial]);

  // Registra una notificacion en el historial (para verla despues en la
  // campanita), mostrando ademas la burbuja pasajera abajo a la derecha.
  const mostrarToast = useCallback((mensaje, tipo = "exito") => {
    const id = ++contadorId;
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);

    setHistorial((prev) => [
      { id, mensaje, tipo, fecha: new Date().toISOString(), leida: false },
      ...prev,
    ]);
  }, []);

  // Igual que mostrarToast, pero sin la burbuja pasajera: solo queda
  // guardada en el historial. Sirve para avisos de fondo (ej. stock bajo)
  // que no ameritan interrumpir con un popup.
  const registrarNotificacion = useCallback((mensaje, tipo = "info") => {
    const id = ++contadorId;
    setHistorial((prev) => [
      { id, mensaje, tipo, fecha: new Date().toISOString(), leida: false },
      ...prev,
    ]);
  }, []);

  function marcarTodasLeidas() {
    setHistorial((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  function borrarHistorial() {
    setHistorial([]);
  }

  function cerrarToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const noLeidas = historial.filter((n) => !n.leida).length;

  return (
    <ToastContext.Provider
      value={{ mostrarToast, registrarNotificacion, historial, noLeidas, marcarTodasLeidas, borrarHistorial }}
    >
      {children}

      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => cerrarToast(t.id)}
            className={`pointer-events-auto cursor-pointer max-w-xs px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-[toast-in_0.2s_ease-out] ${
              t.tipo === "error"
                ? "bg-rose text-white"
                : t.tipo === "info"
                ? "bg-plum text-blush"
                : "bg-sage text-white"
            }`}
          >
            <span>{t.tipo === "error" ? "✕" : t.tipo === "info" ? "ℹ" : "✓"}</span>
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
