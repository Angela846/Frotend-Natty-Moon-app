import { useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";

const ICONO = { error: "✕", info: "ℹ", exito: "✓" };

export default function NotificationBell({ dark = false }) {
  const { historial, noLeidas, marcarTodasLeidas, borrarHistorial } = useToast();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  function toggle() {
    setAbierto((prev) => {
      const nuevoEstado = !prev;
      if (nuevoEstado) marcarTodasLeidas();
      return nuevoEstado;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notificaciones"
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          dark ? "text-white/70 hover:bg-white/10" : "text-plum-ink/70 hover:bg-plum/10"
        }`}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            d="M6 8a6 6 0 1 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-plum/10 z-50 text-plum-ink">
          <div className="flex items-center justify-between px-4 py-3 border-b border-plum/10">
            <p className="font-medium text-sm">Notificaciones</p>
            {historial.length > 0 && (
              <button
                onClick={borrarHistorial}
                className="text-xs text-plum-ink/40 hover:text-rose"
              >
                Borrar todo
              </button>
            )}
          </div>

          {historial.length === 0 ? (
            <p className="text-sm text-plum-ink/40 px-4 py-6 text-center">
              No hay notificaciones todavía.
            </p>
          ) : (
            <ul className="divide-y divide-plum/5">
              {historial.map((n) => (
                <li key={n.id} className="px-4 py-3 flex gap-2 items-start text-sm">
                  <span
                    className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium ${
                      n.tipo === "error"
                        ? "bg-rose/15 text-rose"
                        : n.tipo === "info"
                        ? "bg-plum/10 text-plum"
                        : "bg-sage/20 text-sage"
                    }`}
                  >
                    {ICONO[n.tipo] || "•"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-plum-ink/80">{n.mensaje}</p>
                    <p className="text-xs text-plum-ink/40 mt-0.5">
                      {new Date(n.fecha).toLocaleString("es-CO", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
