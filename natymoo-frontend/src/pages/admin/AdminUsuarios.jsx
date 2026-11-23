import { useEffect, useState } from "react";
import { usuariosApi, rolesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";

export default function AdminUsuarios() {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([usuariosApi.list(), rolesApi.list()])
      .then(([u, r]) => {
        setUsuarios(u);
        setRoles(r);
      })
      .catch(() => setError("No pudimos cargar los usuarios."))
      .finally(() => setCargando(false));
  }, []);

  async function handleCambiarRol(usuarioObj, rolId) {
    setError("");
    try {
      const actualizado = await usuariosApi.update(usuarioObj.id, {
        ...usuarioObj,
        rol: { id: Number(rolId) },
      });
      setUsuarios((prev) => prev.map((u) => (u.id === usuarioObj.id ? actualizado : u)));
    } catch {
      setError("No se pudo cambiar el rol.");
    }
  }

  async function handleToggleActivo(usuarioObj) {
    setError("");
    try {
      const actualizado = await usuariosApi.update(usuarioObj.id, {
        ...usuarioObj,
        activo: !usuarioObj.activo,
      });
      setUsuarios((prev) => prev.map((u) => (u.id === usuarioObj.id ? actualizado : u)));
    } catch {
      setError("No se pudo actualizar el estado del usuario.");
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    try {
      await usuariosApi.remove(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError("No se pudo eliminar. Puede tener órdenes, direcciones o reseñas asociadas.");
    }
  }

  if (cargando) return <Loader texto="Cargando usuarios..." />;

  return (
    <div>
      <ErrorMessage mensaje={error} />
      <div className="space-y-2 mt-2">
        {usuarios.map((u) => (
          <div key={u.id} className="flex items-center justify-between border border-plum/10 rounded-xl p-4 bg-white/40 flex-wrap gap-3">
            <div>
              <p className="font-medium">
                {u.nombre} {u.apellido}
                {u.id === yo.id && <span className="text-xs text-plum-ink/40 ml-2">(tú)</span>}
              </p>
              <p className="text-sm text-plum-ink/50">{u.email}</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={u.rol?.id || ""}
                disabled={u.id === yo.id}
                onChange={(e) => handleCambiarRol(u, e.target.value)}
                className="px-3 py-1.5 rounded-full border border-plum/20 text-sm bg-white/60 disabled:opacity-50"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>

              <button
                onClick={() => handleToggleActivo(u)}
                disabled={u.id === yo.id}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors disabled:opacity-50 ${
                  u.activo ? "border-sage text-sage" : "border-plum/20 text-plum-ink/40"
                }`}
              >
                {u.activo ? "Activo" : "Inactivo"}
              </button>

              <button
                onClick={() => handleEliminar(u.id)}
                disabled={u.id === yo.id}
                className="px-3 py-1.5 rounded-full border border-rose/30 text-rose hover:bg-rose hover:text-white transition-colors text-sm disabled:opacity-50"
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
