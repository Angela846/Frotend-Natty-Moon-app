import { useEffect, useState } from "react";
import { categoriasApi } from "../../api/resources";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import FieldError from "../../components/FieldError";
import { requerido, soloLetras, validarFormulario, tieneErrores } from "../../utils/validation";

export default function AdminCategories() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [erroresForm, setErroresForm] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    categoriasApi.list().then(setCategorias).finally(() => setCargando(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const nuevosErrores = validarFormulario(form, {
      nombre: [(v) => requerido(v, "El nombre")],
    });
    setErroresForm(nuevosErrores);
    if (tieneErrores(nuevosErrores)) return;

    try {
      if (editandoId) {
        const actualizada = await categoriasApi.update(editandoId, { ...form, activo: true });
        setCategorias((prev) => prev.map((c) => (c.id === editandoId ? actualizada : c)));
      } else {
        const creada = await categoriasApi.create({ ...form, activo: true });
        setCategorias((prev) => [...prev, creada]);
      }
      setForm({ nombre: "", descripcion: "" });
      setErroresForm({});
      setEditandoId(null);
    } catch {
      setError("No pudimos guardar la categoría.");
    }
  }

  function handleEditar(cat) {
    setEditandoId(cat.id);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || "" });
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await categoriasApi.remove(id);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("No se pudo eliminar. Puede tener productos asociados.");
    }
  }

  if (cargando) return <Loader texto="Cargando categorías..." />;

  return (
    <div>
      <form onSubmit={handleSubmit} className="border border-plum/10 rounded-2xl p-6 bg-white/40 mb-8 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: soloLetras(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          />
          <FieldError mensaje={erroresForm.nombre} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <input
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          />
        </div>
        <button type="submit" className="px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium h-fit">
          {editandoId ? "Guardar" : "Crear"}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={() => { setEditandoId(null); setForm({ nombre: "", descripcion: "" }); }}
            className="px-5 py-2 rounded-full border border-plum/20 text-sm h-fit"
          >
            Cancelar
          </button>
        )}
      </form>

      <ErrorMessage mensaje={error} />

      <div className="space-y-2">
        {categorias.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between border border-plum/10 rounded-xl p-4 bg-white/40">
            <div>
              <p className="font-medium">{cat.nombre}</p>
              {cat.descripcion && <p className="text-sm text-plum-ink/50">{cat.descripcion}</p>}
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => handleEditar(cat)} className="px-3 py-1.5 rounded-full border border-plum/20 hover:bg-plum hover:text-blush transition-colors">
                Editar
              </button>
              <button onClick={() => handleEliminar(cat.id)} className="px-3 py-1.5 rounded-full border border-rose/30 text-rose hover:bg-rose hover:text-white transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
