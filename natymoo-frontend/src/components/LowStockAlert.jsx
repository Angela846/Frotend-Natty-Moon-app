import { useEffect, useRef } from "react";
import { variantesApi } from "../api/resources";
import { useToast } from "../context/ToastContext";

const UMBRAL_STOCK_BAJO = 5;

/**
 * Ya no dibuja un banner arriba de la pantalla (quedaba feo empujando todo
 * el contenido). Ahora revisa el stock una vez al entrar al panel y, si hay
 * algo bajo, deja una notificacion guardada en la campanita — el admin/
 * empleado la ve cuando quiere, sin que le ocupe espacio todo el tiempo.
 */
export default function LowStockAlert() {
  const { registrarNotificacion } = useToast();
  const yaRevisado = useRef(false);

  useEffect(() => {
    if (yaRevisado.current) return;
    yaRevisado.current = true;

    variantesApi.list().then((todas) => {
      const bajas = todas.filter((v) => v.activo !== false && v.stock <= UMBRAL_STOCK_BAJO);
      if (bajas.length === 0) return;

      const agotadas = bajas.filter((v) => v.stock === 0);
      const resumen = bajas
        .slice(0, 3)
        .map((v) => `${v.producto?.nombre} (${v.talla}/${v.color})`)
        .join(", ");
      const extra = bajas.length > 3 ? ` y ${bajas.length - 3} más` : "";

      registrarNotificacion(
        `${bajas.length} variante${bajas.length !== 1 ? "s" : ""} con stock bajo` +
          `${agotadas.length > 0 ? ` (${agotadas.length} agotada${agotadas.length !== 1 ? "s" : ""})` : ""}` +
          `: ${resumen}${extra}.`,
        "error"
      );
    }).catch((err) => console.error("No se pudo revisar el stock bajo:", err));
  }, [registrarNotificacion]);

  return null;
}
