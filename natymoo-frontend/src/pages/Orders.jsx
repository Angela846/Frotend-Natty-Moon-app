import { useEffect, useState } from "react";
import { ordenesApi, detalleOrdenApi, historialOrdenApi, pagosApi } from "../api/resources";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const ESTADO_LABEL = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  EN_PREPARACION: "En preparación",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const PAGO_LABEL = {
  PENDIENTE: "Pago pendiente",
  APROBADO: "Pago aprobado",
  RECHAZADO: "Pago rechazado",
  REEMBOLSADO: "Pago reembolsado",
};

const PAGO_COLOR = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  APROBADO: "bg-sage/20 text-sage",
  RECHAZADO: "bg-rose/15 text-rose",
  REEMBOLSADO: "bg-plum-ink/10 text-plum-ink/60",
};

const METODO_LABEL = {
  NEQUI: "Nequi",
  DAVIPLATA: "Daviplata",
  NU: "Nu",
  TARJETA: "Tarjeta",
  PSE: "PSE",
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
};

export default function Orders() {
  const { usuario } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [historiales, setHistoriales] = useState({});
  const [pagos, setPagos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => {
    Promise.all([
      ordenesApi.list(),
      detalleOrdenApi.list(),
      historialOrdenApi.list(),
      pagosApi.list(),
    ])
      .then(([todasOrdenes, todosDetalles, todosHistoriales, todosPagos]) => {
        const propias = todasOrdenes
          .filter((o) => o.usuario?.id === usuario.id)
          .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        setOrdenes(propias);

        const detallesPorOrden = {};
        const historialPorOrden = {};
        const pagoPorOrden = {};
        propias.forEach((o) => {
          detallesPorOrden[o.id] = todosDetalles.filter((d) => d.orden?.id === o.id);
          historialPorOrden[o.id] = todosHistoriales
            .filter((h) => h.orden?.id === o.id)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
          // Una orden puede tener mas de un pago (ej. si el primero fue rechazado
          // y se volvio a intentar); mostramos el mas reciente.
          const pagosDeEstaOrden = todosPagos
            .filter((p) => p.orden?.id === o.id)
            .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
          pagoPorOrden[o.id] = pagosDeEstaOrden[0] || null;
        });
        setDetalles(detallesPorOrden);
        setHistoriales(historialPorOrden);
        setPagos(pagoPorOrden);
      })
      .catch((err) => console.error("No se pudieron cargar los pedidos:", err))
      .finally(() => setCargando(false));
  }, [usuario.id]);

  if (cargando) return <Loader texto="Cargando tus pedidos..." />;

  if (ordenes.length === 0) {
    return (
      <div className="container-natymoo py-24 text-center">
        <h1 className="text-2xl mb-3">Todavía no tienes pedidos</h1>
        <p className="text-plum-ink/60">
          Cuando compres algo, lo vas a poder seguir aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="container-natymoo py-12 max-w-3xl">
      <h1 className="text-3xl mb-8">Mis pedidos</h1>

      <div className="space-y-4">
        {ordenes.map((orden) => {
          const pago = pagos[orden.id];
          return (
            <div key={orden.id} className="border border-plum/10 rounded-2xl overflow-hidden bg-white/40">
              <button
                onClick={() => setExpandida(expandida === orden.id ? null : orden.id)}
                className="w-full flex items-center justify-between p-5 text-left flex-wrap gap-2"
              >
                <div>
                  <p className="font-medium">Pedido #{orden.id}</p>
                  <p className="text-sm text-plum-ink/50">
                    {new Date(orden.fechaCreacion).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {pago && (
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${PAGO_COLOR[pago.estado]}`}>
                      {PAGO_LABEL[pago.estado] || pago.estado}
                    </span>
                  )}
                  <span className="text-sm px-3 py-1 rounded-full bg-blush-soft text-plum font-medium">
                    {ESTADO_LABEL[orden.estado] || orden.estado}
                  </span>
                  <span className="font-display text-plum">
                    ${Number(orden.total).toLocaleString("es-CO")}
                  </span>
                </div>
              </button>

              {expandida === orden.id && (
                <div className="border-t border-plum/10 p-5 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Productos</p>
                    <div className="space-y-2">
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
                    <p className="text-sm font-medium mb-2">Pago</p>
                    {pago ? (
                      <div className="text-sm text-plum-ink/70 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAGO_COLOR[pago.estado]}`}>
                            {PAGO_LABEL[pago.estado] || pago.estado}
                          </span>
                          <span>{METODO_LABEL[pago.metodoPago] || pago.metodoPago}</span>
                        </div>
                        <p>Monto: ${Number(pago.monto).toLocaleString("es-CO")}</p>
                        {pago.referenciaTransaccion && (
                          <p>Referencia: {pago.referenciaTransaccion}</p>
                        )}
                        <p className="text-plum-ink/40">
                          {new Date(pago.fechaPago).toLocaleString("es-CO")}
                        </p>
                        {pago.estado === "RECHAZADO" && (
                          <p className="text-rose text-sm mt-1">
                            Tu pago fue rechazado. Si crees que es un error, reporta una novedad
                            desde el pie de página y lo revisamos.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-plum-ink/50">No hay un pago registrado para este pedido.</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Seguimiento</p>
                    <div className="space-y-2">
                      {(historiales[orden.id] || []).map((h) => (
                        <div key={h.id} className="flex items-center gap-3 text-sm">
                          <span className="w-2 h-2 rounded-full bg-rose shrink-0" />
                          <span className="text-plum-ink/70">
                            {ESTADO_LABEL[h.estado] || h.estado} —{" "}
                            {new Date(h.fecha).toLocaleString("es-CO")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
