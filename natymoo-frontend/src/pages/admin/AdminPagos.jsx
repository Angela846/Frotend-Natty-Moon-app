import { useEffect, useState } from "react";
import { pagosApi, ordenesApi } from "../../api/resources";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import FieldError from "../../components/FieldError";
import { requerido, numeroPositivo, soloNoNegativo, validarFormulario, tieneErrores } from "../../utils/validation";

const METODOS = ["NEQUI", "DAVIPLATA", "NU"];
const ESTADOS = ["PENDIENTE", "APROBADO", "RECHAZADO", "REEMBOLSADO"];

export default function AdminPagos() {
  const [pagos, setPagos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [erroresForm, setErroresForm] = useState({});

  const [form, setForm] = useState({
    ordenId: "",
    metodoPago: "TARJETA",
    monto: "",
    referenciaTransaccion: "",
  });

  useEffect(() => {
    Promise.all([pagosApi.list(), ordenesApi.list()])
      .then(([p, o]) => {
        setPagos(p);
        setOrdenes(o);
      })
      .finally(() => setCargando(false));
  }, []);

  async function handleCrear(e) {
    e.preventDefault();
    setError("");

    const nuevosErrores = validarFormulario(form, {
      ordenId: [(v) => requerido(v, "La orden")],
      monto: [(v) => numeroPositivo(v, "El monto")],
    });
    setErroresForm(nuevosErrores);
    if (tieneErrores(nuevosErrores)) return;

    try {
      const creado = await pagosApi.create({
        orden: { id: Number(form.ordenId) },
        metodoPago: form.metodoPago,
        monto: Number(form.monto),
        referenciaTransaccion: form.referenciaTransaccion,
        estado: "PENDIENTE",
      });
      setPagos((prev) => [...prev, creado]);
      setForm({ ordenId: "", metodoPago: "TARJETA", monto: "", referenciaTransaccion: "" });
      setErroresForm({});
    } catch {
      setError("No se pudo registrar el pago. Verifica el número de orden.");
    }
  }

  async function handleCambiarEstado(pago, estado) {
    setError("");
    try {
      const actualizado = await pagosApi.update(pago.id, { ...pago, estado });
      setPagos((prev) => prev.map((p) => (p.id === pago.id ? actualizado : p)));
    } catch {
      setError("No se pudo actualizar el estado del pago.");
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este registro de pago?")) return;
    await pagosApi.remove(id);
    setPagos((prev) => prev.filter((p) => p.id !== id));
  }

  if (cargando) return <Loader texto="Cargando pagos..." />;

  return (
    <div>
      <form onSubmit={handleCrear} className="border border-plum/10 rounded-2xl p-6 bg-white/40 mb-8">
        <h2 className="text-lg mb-4">Registrar pago</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <select
              value={form.ordenId}
              onChange={(e) => setForm({ ...form, ordenId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            >
              <option value="">Selecciona una orden</option>
              {ordenes.map((o) => (
                <option key={o.id} value={o.id}>
                  Orden #{o.id} — {o.usuario?.nombre} — ${Number(o.total).toLocaleString("es-CO")}
                </option>
              ))}
            </select>
            <FieldError mensaje={erroresForm.ordenId} />
          </div>
          <select
            value={form.metodoPago}
            onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}
            className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          >
            {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Monto"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: soloNoNegativo(e.target.value) })}
            className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          />
          <FieldError mensaje={erroresForm.monto} />
          <input
            placeholder="Referencia de transacción"
            value={form.referenciaTransaccion}
            onChange={(e) => setForm({ ...form, referenciaTransaccion: e.target.value })}
            className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          />
        </div>
        <ErrorMessage mensaje={error} />
        <button type="submit" className="mt-4 px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium">
          Registrar pago
        </button>
      </form>

      <div className="space-y-2">
        {pagos.map((pago) => (
          <div key={pago.id} className="flex items-center justify-between border border-plum/10 rounded-xl p-4 bg-white/40 flex-wrap gap-3">
            <div>
              <p className="font-medium text-sm">
                Orden #{pago.orden?.id} · {pago.metodoPago}
              </p>
              <p className="text-sm text-plum-ink/50">
                ${Number(pago.monto).toLocaleString("es-CO")}
                {pago.referenciaTransaccion && ` · Ref: ${pago.referenciaTransaccion}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pago.estado}
                onChange={(e) => handleCambiarEstado(pago, e.target.value)}
                className="px-3 py-1.5 rounded-full border border-plum/20 text-sm bg-white/60"
              >
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <button
                onClick={() => handleEliminar(pago.id)}
                className="px-3 py-1.5 rounded-full border border-rose/30 text-rose hover:bg-rose hover:text-white transition-colors text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
