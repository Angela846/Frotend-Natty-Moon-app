import { useEffect, useState } from "react";
import { novedadesApi } from "../api/resources";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

const ESTADOS = ["ABIERTA", "EN_PROCESO", "RESUELTA"];
const ESTADO_LABEL = {
  ABIERTA: "Abierta",
  EN_PROCESO: "En proceso",
  RESUELTA: "Resuelta",
};
const ESTADO_COLOR = {
  ABIERTA: "bg-rose/15 text-rose",
  EN_PROCESO: "bg-amber-100 text-amber-700",
  RESUELTA: "bg-sage/20 text-sage",
};

export default function NovedadesPanel() {
  const { esAdmin } = useAuth();
  const [novedades, setNovedades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("TODAS");
  const [respuestaBorrador, setRespuestaBorrador] = useState({});

  useEffect(() => {
    novedadesApi
      .list()
      .then((data) =>
        setNovedades(data.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)))
      )
      .finally(() => setCargando(false));
  }, []);

  async function handleCambiarEstado(novedad, estado) {
    setError("");
    try {
      const actualizada = await novedadesApi.update(novedad.id, {
        ...novedad,
        estado,
        respuesta: respuestaBorrador[novedad.id] ?? novedad.respuesta,
      });
      setNovedades((prev) => prev.map((n) => (n.id === novedad.id ? actualizada : n)));
    } catch {
      setError("No se pudo actualizar la novedad.");
    }
  }

  async function handleGuardarRespuesta(novedad) {
    setError("");
    try {
      const actualizada = await novedadesApi.update(novedad.id, {
        ...novedad,
        respuesta: respuestaBorrador[novedad.id] ?? "",
      });
      setNovedades((prev) => prev.map((n) => (n.id === novedad.id ? actualizada : n)));
    } catch {
      setError("No se pudo guardar la respuesta.");
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta novedad?")) return;
    await novedadesApi.remove(id);
    setNovedades((prev) => prev.filter((n) => n.id !== id));
  }

  if (cargando) return <Loader texto="Cargando novedades..." />;

  const filtradas = filtro === "TODAS" ? novedades : novedades.filter((n) => n.estado === filtro);

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFiltro("TODAS")}
          className={`px-3 py-1.5 rounded-full text-sm border ${filtro === "TODAS" ? "bg-plum text-blush border-plum" : "border-plum/20"}`}
        >
          Todas
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`px-3 py-1.5 rounded-full text-sm border ${filtro === e ? "bg-plum text-blush border-plum" : "border-plum/20"}`}
          >
            {ESTADO_LABEL[e]}
          </button>
        ))}
      </div>

      <ErrorMessage mensaje={error} />

      {filtradas.length === 0 ? (
        <p className="text-plum-ink/50 py-8">No hay novedades para mostrar.</p>
      ) : (
        <div className="space-y-3 mt-2">
          {filtradas.map((n) => (
            <div key={n.id} className="border border-plum/10 rounded-2xl p-5 bg-white/40">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium">{n.asunto}</p>
                  <p className="text-sm text-plum-ink/50">
                    {n.usuario?.nombre} {n.usuario?.apellido}
                    {n.orden && ` · Pedido #${n.orden.id}`}
                    {" · "}
                    {new Date(n.fechaCreacion).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${ESTADO_COLOR[n.estado]}`}>
                  {ESTADO_LABEL[n.estado]}
                </span>
              </div>

              <p className="text-sm text-plum-ink/70 mt-3">{n.descripcion}</p>

              <div className="mt-4 border-t border-plum/10 pt-4">
                <label className="block text-xs font-medium text-plum-ink/60 mb-1">
                  Respuesta interna
                </label>
                <textarea
                  rows={2}
                  defaultValue={n.respuesta || ""}
                  onChange={(e) =>
                    setRespuestaBorrador((prev) => ({ ...prev, [n.id]: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60 text-sm"
                  placeholder="Escribe una respuesta o nota para este reporte..."
                />
                <div className="flex flex-wrap gap-2 mt-3 items-center">
                  <button
                    onClick={() => handleGuardarRespuesta(n)}
                    className="px-3 py-1.5 rounded-full border border-plum/20 text-sm hover:bg-plum hover:text-blush transition-colors"
                  >
                    Guardar respuesta
                  </button>
                  {ESTADOS.map((estado) => (
                    <button
                      key={estado}
                      onClick={() => handleCambiarEstado(n, estado)}
                      disabled={n.estado === estado}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors disabled:opacity-30 ${
                        n.estado === estado
                          ? "bg-plum text-blush border-plum"
                          : "border-plum/20 hover:bg-plum hover:text-blush"
                      }`}
                    >
                      {ESTADO_LABEL[estado]}
                    </button>
                  ))}
                  {esAdmin && (
                    <button
                      onClick={() => handleEliminar(n.id)}
                      className="px-3 py-1.5 rounded-full border border-rose/30 text-rose hover:bg-rose hover:text-white transition-colors text-sm ml-auto"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
