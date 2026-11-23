import { useEffect, useState } from "react";
import { direccionesApi, usuariosApi } from "../../api/resources";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";

export default function AdminDirecciones() {
  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    Promise.all([direccionesApi.list(), usuariosApi.list()])
      .then(([d, u]) => {
        setDirecciones(d);
        setUsuarios(u);
      })
      .catch(() => setError("No pudimos cargar las direcciones."))
      .finally(() => setCargando(false));
  }, []);

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta dirección?")) return;
    try {
      await direccionesApi.remove(id);
      setDirecciones((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("No se pudo eliminar. Puede estar asociada a una orden.");
    }
  }

  const filtradas = filtroUsuario
    ? direcciones.filter((d) => d.usuario?.id === Number(filtroUsuario))
    : direcciones;

  if (cargando) return <Loader texto="Cargando direcciones..." />;

  return (
    <div>
      <div className="mb-6">
        <select
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
          className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60 text-sm"
        >
          <option value="">Todos los usuarios</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
          ))}
        </select>
      </div>

      <ErrorMessage mensaje={error} />

      {filtradas.length === 0 ? (
        <p className="text-plum-ink/50 py-8">No hay direcciones para mostrar.</p>
      ) : (
        <div className="space-y-2 mt-2">
          {filtradas.map((d) => (
            <div key={d.id} className="flex items-center justify-between border border-plum/10 rounded-xl p-4 bg-white/40">
              <div>
                <p className="font-medium text-sm">
                  {d.alias || "Dirección"} — {d.usuario?.nombre} {d.usuario?.apellido}
                </p>
                <p className="text-sm text-plum-ink/50">
                  {d.calle} {d.numero}, {d.ciudad}, {d.departamento}
                </p>
              </div>
              <button
                onClick={() => handleEliminar(d.id)}
                className="px-3 py-1.5 rounded-full border border-rose/30 text-rose hover:bg-rose hover:text-white transition-colors text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
