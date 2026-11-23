import { useEffect, useState } from "react";
import {
  ordenesApi,
  detalleOrdenApi,
  historialOrdenApi,
} from "../../api/resources";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";

const ESTADOS = ["PENDIENTE", "PAGADO", "EN_PREPARACION", "ENVIADO", "ENTREGADO", "CANCELADO"];
const ESTADO_LABEL = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  EN_PREPARACION: "En preparación",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default function AdminOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [historiales, setHistoriales] = useState({});
  const [cargando, setCargando] = useState(true);
  const [expandida, setExpandida] = useState(null);
  const [error, setError] = useState("");
  const [comentarioEstado, setComentarioEstado] = useState("");

  function cargarTodo() {
    setCargando(true);
    return Promise.all([
      ordenesApi.list(),
      detalleOrdenApi.list(),
      historialOrdenApi.list(),
    ])
      .then(([o, d, h]) => {
        const ordenadas = [...o].sort(
          (a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
        );
        setOrdenes(ordenadas);

        const detallesPorOrden = {};
        const historialPorOrden = {};
        ordenadas.forEach((orden) => {
          detallesPorOrden[orden.id] = d.filter((x) => x.orden?.id === orden.id);
          historialPorOrden[orden.id] = h
            .filter((x) => x.orden?.id === orden.id)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        });
        setDetalles(detallesPorOrden);
        setHistoriales(historialPorOrden);
      })
      .catch(() => setError("No pudimos cargar los pedidos."))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    void cargarTodo();
  }, []);

  async function handleCambiarEstado(orden, nuevoEstado) {
    setError("");
    try {
      const actualizada = await ordenesApi.update(orden.id, { ...orden, estado: nuevoEstado });
      setOrdenes((prev) => prev.map((o) => (o.id === orden.id ? actualizada : o)));

      const nuevoHistorial = await historialOrdenApi.create({
        orden: { id: orden.id },
        estado: nuevoEstado,
        comentario: comentarioEstado || `Estado actualizado a ${ESTADO_LABEL[nuevoEstado]}`,
      });
      setHistoriales((prev) => ({
        ...prev,
        [orden.id]: [...(prev[orden.id] || []), nuevoHistorial],
      }));
      setComentarioEstado("");
    } catch {
      setError("No se pudo actualizar el estado del pedido.");
    }
  }

  if (cargando) return <Loader texto="Cargando pedidos..." />;

  if (ordenes.length === 0) {
    return <p className="text-plum-ink/50 py-8">Todavía no hay pedidos.</p>;
  }

  return (
    <div>
      <ErrorMessage mensaje={error} />
      <div className="space-y-3 mt-2">
        {ordenes.map((orden) => (
          <div key={orden.id} className="border border-plum/10 rounded-2xl overflow-hidden bg-white/40">
            <button
              onClick={() => setExpandida(expandida === orden.id ? null : orden.id)}
              className="w-full flex items-center justify-between p-5 text-left flex-wrap gap-2"
            >
              <div>
                <p className="font-medium">
                  Pedido #{orden.id} — {orden.usuario?.nombre} {orden.usuario?.apellido}
                </p>
                <p className="text-sm text-plum-ink/50">
                  {new Date(orden.fechaCreacion).toLocaleDateString("es-CO", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm px-3 py-1 rounded-full bg-blush-soft text-plum font-medium">
                  {ESTADO_LABEL[orden.estado] || orden.estado}
                </span>
                <span className="font-display text-plum">
                  ${Number(orden.total).toLocaleString("es-CO")}
                </span>
              </div>
            </button>

            {expandida === orden.id && (
              <div className="border-t border-plum/10 p-5 space-y-5">
                <div>
                  <p className="text-sm font-medium mb-2">Productos</p>
                  <div className="space-y-1">
                    {(detalles[orden.id] || []).map((d) => (
                      <div key={d.id} className="flex justify-between text-sm text-plum-ink/70">
                        <span>
                          {d.variante?.producto?.nombre} ({d.variante?.talla}/{d.variante?.color}) x{d.cantidad}
                        </span>
                        <span>${Number(d.subtotal).toLocaleString("es-CO")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Envío</p>
                  <p className="text-sm text-plum-ink/70">
                    {orden.direccion?.calle} {orden.direccion?.numero}, {orden.direccion?.ciudad}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Historial</p>
                  <div className="space-y-1">
                    {(historiales[orden.id] || []).map((h) => (
                      <div key={h.id} className="flex items-center gap-2 text-sm text-plum-ink/70">
                        <span className="w-2 h-2 rounded-full bg-rose shrink-0" />
                        {ESTADO_LABEL[h.estado] || h.estado} — {new Date(h.fecha).toLocaleString("es-CO")}
                        {h.comentario && <span className="text-plum-ink/40">({h.comentario})</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-plum/10 pt-4">
                  <p className="text-sm font-medium mb-2">Cambiar estado</p>
                  <div className="flex gap-2 flex-wrap items-center">
                    <input
                      placeholder="Comentario (opcional)"
                      value={comentarioEstado}
                      onChange={(e) => setComentarioEstado(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-plum/20 text-sm flex-1 min-w-[180px]"
                    />
                    {ESTADOS.map((estado) => (
                      <button
                        key={estado}
                        onClick={() => handleCambiarEstado(orden, estado)}
                        disabled={orden.estado === estado}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors disabled:opacity-30 ${
                          orden.estado === estado
                            ? "bg-plum text-blush border-plum"
                            : "border-plum/20 hover:bg-plum hover:text-blush"
                        }`}
                      >
                        {ESTADO_LABEL[estado]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
