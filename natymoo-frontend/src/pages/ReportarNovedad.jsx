import { useEffect, useState } from "react";
import { novedadesApi, ordenesApi } from "../api/resources";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { requerido, longitudMinima, validarFormulario, tieneErrores } from "../utils/validation";
import FieldError from "../components/FieldError";

const ESTADO_LABEL = { ABIERTA: "Abierta", EN_PROCESO: "En proceso", RESUELTA: "Resuelta" };
const ESTADO_COLOR = {
  ABIERTA: "bg-rose/15 text-rose",
  EN_PROCESO: "bg-amber-100 text-amber-700",
  RESUELTA: "bg-sage/20 text-sage",
};

export default function ReportarNovedad() {
  const { usuario } = useAuth();
  const [misNovedades, setMisNovedades] = useState([]);
  const [misOrdenes, setMisOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [form, setForm] = useState({ asunto: "", descripcion: "", ordenId: "" });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    Promise.all([novedadesApi.list(), ordenesApi.list()])
      .then(([n, o]) => {
        setMisNovedades(
          n
            .filter((x) => (x.usuarioId ?? x.usuario?.id) === usuario.id)
            .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
        );
        setMisOrdenes(o.filter((x) => (x.usuarioId ?? x.usuario?.id) === usuario.id));
      })
      .catch(() => setError("No pudimos cargar tus novedades."))
      .finally(() => setCargando(false));
  }, [usuario.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setExito("");

    const nuevosErrores = validarFormulario(form, {
      asunto: [(v) => requerido(v, "El asunto")],
      descripcion: [(v) => requerido(v, "La descripción"), (v) => longitudMinima(v, 5, "La descripción")],
    });
    setErrores(nuevosErrores);
    if (tieneErrores(nuevosErrores)) return;

    setEnviando(true);
    try {
      const creada = await novedadesApi.create({
        usuarioId: usuario.id,
        usuario: { id: usuario.id },
        ordenCompraId: form.ordenId ? Number(form.ordenId) : null,
        orden: form.ordenId ? { id: Number(form.ordenId) } : null,
        asunto: form.asunto,
        descripcion: form.descripcion,
      });
      setMisNovedades((prev) => [creada, ...prev]);
      setForm({ asunto: "", descripcion: "", ordenId: "" });
      setExito("Tu reporte fue enviado. Te responderemos pronto.");
    } catch (err) {
      const erroresBackend = err.response?.data?.errores;
      const primerError = erroresBackend ? Object.values(erroresBackend)[0] : null;
      console.error("Error al enviar la novedad:", err.response?.status, err.response?.data ?? err.message);
      const sinPermiso = [401, 403].includes(err.response?.status);
      setError(
        primerError ||
          err.response?.data?.mensaje ||
          (sinPermiso
            ? "Tu cuenta no tiene permiso para enviar reportes (error " + err.response.status + ")."
            : "No pudimos enviar tu reporte. Intenta de nuevo.")
      );
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <Loader texto="Cargando..." />;

  return (
    <div className="container-natymoo py-12 max-w-2xl">
      <h1 className="text-3xl mb-2">Reportar una novedad</h1>
      <p className="text-plum-ink/60 mb-8">
        ¿Algo no salió como esperabas? Cuéntanos qué pasó y te ayudamos.
      </p>

      <form onSubmit={handleSubmit} className="border border-plum/10 rounded-2xl p-6 bg-white/40 mb-10">
        <div className="mb-4">
          <label htmlFor="novedad-asunto" className="block text-sm font-medium mb-1">Asunto</label>
          <input id="novedad-asunto"
            value={form.asunto}
            onChange={(e) => setForm({ ...form, asunto: e.target.value })}
            placeholder="Ej: Llegó una talla equivocada"
            className="w-full px-4 py-2.5 rounded-xl border border-plum/20 bg-white/60"
          />
          <FieldError mensaje={errores.asunto} />
        </div>

        <div className="mb-4">
          <label htmlFor="novedad-orden" className="block text-sm font-medium mb-1">¿Es sobre algún pedido? (opcional)</label>
          <select id="novedad-orden"
            value={form.ordenId}
            onChange={(e) => setForm({ ...form, ordenId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-plum/20 bg-white/60"
          >
            <option value="">No, es algo general</option>
            {misOrdenes.map((o) => (
              <option key={o.id} value={o.id}>
                Pedido #{o.id} — {new Date(o.fechaCreacion).toLocaleDateString("es-CO")}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="novedad-descripcion" className="block text-sm font-medium mb-1">Cuéntanos qué pasó</label>
          <textarea id="novedad-descripcion"
            rows={4}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Danos todos los detalles que puedas..."
            className="w-full px-4 py-2.5 rounded-xl border border-plum/20 bg-white/60"
          />
          <FieldError mensaje={errores.descripcion} />
        </div>

        <ErrorMessage mensaje={error} />
        {exito && <p className="text-sm text-sage mb-3">{exito}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="px-6 py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar reporte"}
        </button>
      </form>

      <h2 className="text-xl mb-4">Mis reportes</h2>
      {misNovedades.length === 0 ? (
        <p className="text-plum-ink/50">Todavía no has reportado ninguna novedad.</p>
      ) : (
        <div className="space-y-3">
          {misNovedades.map((n) => (
            <div key={n.id} className="border border-plum/10 rounded-xl p-4 bg-white/40">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">{n.asunto}</p>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${ESTADO_COLOR[n.estado]}`}>
                  {ESTADO_LABEL[n.estado]}
                </span>
              </div>
              <p className="text-sm text-plum-ink/60 mt-1">{n.descripcion}</p>
              {n.respuesta && (
                <div className="mt-3 pt-3 border-t border-plum/10">
                  <p className="text-xs font-medium text-plum-ink/50 mb-1">Respuesta de natymoo</p>
                  <p className="text-sm text-plum-ink/70">{n.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}