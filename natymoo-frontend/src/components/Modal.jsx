import { useEffect } from "react";

export default function Modal({ abierto, onCerrar, titulo, children, maxWidth = "max-w-2xl" }) {
  useEffect(() => {
    if (!abierto) return;
    function handleEsc(e) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      {/* Fondo: botón nativo (fuera del tab order; Escape ya cierra el modal) */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar"
        onClick={onCerrar}
        className="fixed inset-0 w-full h-full cursor-default bg-plum-ink/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`relative bg-blush rounded-2xl shadow-xl w-full ${maxWidth} my-8 animate-[toast-in_0.15s_ease-out]`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-plum/10">
          <h2 className="text-lg font-medium text-plum-ink">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-plum-ink/40 hover:text-plum-ink text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-plum/10"
          >
            ✕
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
