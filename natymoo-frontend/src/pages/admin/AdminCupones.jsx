import { useEffect, useState } from "react";
import { cuponesApi } from "../../api/resources";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import FieldError from "../../components/FieldError";
import {
  requerido,
  numeroPositivo,
  soloNoNegativo,
  fechaFinDespuesDeInicio,
  validarFormulario,
  tieneErrores,
} from "../../utils/validation";

const VACIO = {
  codigo: "",
  tipoDescuento: "PORCENTAJE",
  valor: "",
  montoMinimo: "0",
  fechaInicio: "",
  fechaFin: "",
  usoMaximo: "",
};

/**
 * Calcula el estado REAL de un cupón a partir de sus fechas, en vez de
 * confiar solo en el interruptor manual "activo". Así, un cupón pasa a
 * "Vencido" solo automáticamente al llegar su fecha de fin — nadie tiene
 * que acordarse de apagarlo a mano.
 *
 * El interruptor manual sigue existiendo para poder desactivar un cupón
 * ANTES de su fecha de fin si hace falta (ej. se agotaron las unidades del
 * producto en oferta), pero ya no es la única señal de si sigue vigente.
 */
function calcularEstadoCupon(cupon) {
  const ahora = new Date();
  const inicio = new Date(cupon.fechaInicio);
  const fin = new Date(cupon.fechaFin);

  if (!cupon.activo) return { etiqueta: "Desactivado", color: "border-plum-ink/20 text-plum-ink/40" };
  if (ahora < inicio) return { etiqueta: "Programado", color: "border-plum/30 text-plum" };
  if (ahora > fin) return { etiqueta: "Vencido", color: "border-rose/40 text-rose" };
  if (cupon.usoMaximo && cupon.usosActuales >= cupon.usoMaximo) {
    return { etiqueta: "Agotado", color: "border-rose/40 text-rose" };
  }
  return { etiqueta: "Vigente", color: "border-sage text-sage" };
}

export default function AdminCupones() {
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [erroresForm, setErroresForm] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    cuponesApi.list().then(setCupones).finally(() => setCargando(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const nuevosErrores = validarFormulario(form, {
      codigo: [(v) => requerido(v, "El código")],
      valor: [(v) => numeroPositivo(v, "El valor del descuento")],
    });
    const errorFechas = fechaFinDespuesDeInicio(form.fechaInicio, form.fechaFin);
    if (errorFechas) nuevosErrores.fechaFin = errorFechas;

    if (form.tipoDescuento === "PORCENTAJE" && Number(form.valor) > 100) {
      nuevosErrores.valor = "Un descuento por porcentaje no puede superar el 100%.";
    }

    setErroresForm(nuevosErrores);
    if (tieneErrores(nuevosErrores)) return;

    try {
      const creado = await cuponesApi.create({
        codigo: form.codigo.toUpperCase(),
        tipoDescuento: form.tipoDescuento,
        valor: Number(form.valor),
        montoMinimo: Number(form.montoMinimo || 0),
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
        usoMaximo: form.usoMaximo ? Number(form.usoMaximo) : null,
        usosActuales: 0,
        activo: true,
      });
      setCupones((prev) => [...prev, creado]);
      setForm(VACIO);
      setErroresForm({});
    } catch {
      setError("Revisa los datos. El código debe ser único y las fechas válidas.");
    }
  }

  async function handleToggleActivo(cupon) {
    const actualizado = await cuponesApi.update(cupon.id, { ...cupon, activo: !cupon.activo });
    setCupones((prev) => prev.map((c) => (c.id === cupon.id ? actualizado : c)));
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este cupón?")) return;
    await cuponesApi.remove(id);
    setCupones((prev) => prev.filter((c) => c.id !== id));
  }

  if (cargando) return <Loader texto="Cargando cupones..." />;

  return (
    <div>
      <form onSubmit={handleSubmit} className="border border-plum/10 rounded-2xl p-6 bg-white/40 mb-8">
        <h2 className="text-lg mb-4">Nuevo cupón</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <input
              placeholder="Código (ej. VERANO20)"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
            <FieldError mensaje={erroresForm.codigo} />
          </div>
          <select
            value={form.tipoDescuento}
            onChange={(e) => setForm({ ...form, tipoDescuento: e.target.value })}
            className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          >
            <option value="PORCENTAJE">Porcentaje (%)</option>
            <option value="MONTO_FIJO">Monto fijo ($)</option>
          </select>
          <div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Valor"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: soloNoNegativo(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
            <FieldError mensaje={erroresForm.valor} />
          </div>
          <div>
            <label className="block text-xs text-plum-ink/50 mb-1">Fecha inicio</label>
            <input
              type="datetime-local"
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
          </div>
          <div>
            <label className="block text-xs text-plum-ink/50 mb-1">Fecha fin</label>
            <input
              type="datetime-local"
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
            <FieldError mensaje={erroresForm.fechaFin} />
          </div>
          <input
            type="number"
            min="1"
            placeholder="Uso máximo (opcional)"
            value={form.usoMaximo}
            onChange={(e) => setForm({ ...form, usoMaximo: soloNoNegativo(e.target.value) })}
            className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          />
        </div>

        <ErrorMessage mensaje={error} />

        <button type="submit" className="mt-4 px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium">
          Crear cupón
        </button>
      </form>

      <div className="space-y-2">
        {cupones.map((c) => {
          const estado = calcularEstadoCupon(c);
          return (
            <div key={c.id} className="flex items-center justify-between border border-plum/10 rounded-xl p-4 bg-white/40 flex-wrap gap-2">
              <div>
                <p className="font-medium">{c.codigo}</p>
                <p className="text-sm text-plum-ink/50">
                  {c.tipoDescuento === "PORCENTAJE" ? `${c.valor}%` : `$${Number(c.valor).toLocaleString("es-CO")}`}
                  {" · "}
                  Vence {new Date(c.fechaFin).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  {c.usoMaximo && ` · ${c.usosActuales}/${c.usoMaximo} usos`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-3 py-1.5 rounded-full border font-medium ${estado.color}`}>
                  {estado.etiqueta}
                </span>
                <button
                  onClick={() => handleToggleActivo(c)}
                  title={c.activo ? "Desactivar manualmente antes de la fecha de fin" : "Reactivar (solo funcionará si aún no venció)"}
                  className="px-3 py-1.5 rounded-full border border-plum/20 text-plum-ink/60 hover:bg-plum hover:text-blush hover:border-plum transition-colors"
                >
                  {c.activo ? "Desactivar" : "Reactivar"}
                </button>
                <button onClick={() => handleEliminar(c.id)} className="px-3 py-1.5 rounded-full border border-rose/30 text-rose hover:bg-rose hover:text-white transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
        {cupones.length === 0 && <p className="text-plum-ink/50 py-8">Todavía no has creado ningún cupón.</p>}
      </div>
    </div>
  );
}
