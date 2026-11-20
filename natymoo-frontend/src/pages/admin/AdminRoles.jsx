import { useEffect, useState } from "react";
import { rolesApi } from "../../api/resources";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";

export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    rolesApi.list().then(setRoles).finally(() => setCargando(false));
  }, []);

  async function handleCrear(e) {
    e.preventDefault();
    setError("");
    try {
      const creado = await rolesApi.create({ nombre: nombre.toUpperCase() });
      setRoles((prev) => [...prev, creado]);
      setNombre("");
    } catch {
      setError("No se pudo crear el rol. Puede que ya exista.");
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este rol? Falla si hay usuarios asignados a él.")) return;
    try {
      await rolesApi.remove(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("No se pudo eliminar: hay usuarios usando este rol.");
    }
  }

  if (cargando) return <Loader texto="Cargando roles..." />;

  return (
    <div>
      <form onSubmit={handleCrear} className="border border-plum/10 rounded-2xl p-6 bg-white/40 mb-8 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Nombre del rol</label>
          <input
            required
            placeholder="Ej: EMPLEADO"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          />
        </div>
        <button type="submit" className="px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium">
          Crear rol
        </button>
      </form>

      <ErrorMessage mensaje={error} />

      <div className="space-y-2 mt-4">
        {roles.map((rol) => (
          <div key={rol.id} className="flex items-center justify-between border border-plum/10 rounded-xl p-4 bg-white/40">
            <p className="font-medium">{rol.nombre}</p>
            <button
              onClick={() => handleEliminar(rol.id)}
              className="text-sm px-3 py-1.5 rounded-full border border-rose/30 text-rose hover:bg-rose hover:text-white transition-colors"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
