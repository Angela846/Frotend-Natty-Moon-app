import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { direccionesApi, usuariosApi } from "../api/resources";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { soloLetras, soloNumeros } from "../utils/validation";

export default function Account() {
  const { usuario } = useAuth();
  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [form, setForm] = useState({
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    telefono: usuario.telefono || "",
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    direccionesApi
      .list()
      .then((todas) => setDirecciones(todas.filter((d) => d.usuario?.id === usuario.id)))
      .catch(() => setError("No pudimos cargar tus direcciones."))
      .finally(() => setCargando(false));
  }, [usuario.id]);

  async function handleGuardarPerfil(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    try {
      await usuariosApi.update(usuario.id, { ...usuario, ...form });
      setMensaje("Perfil actualizado. Los cambios se verán al recargar la página.");
      setEditandoPerfil(false);
    } catch {
      setError("No pudimos actualizar tu perfil.");
    }
  }

  async function handleEliminarDireccion(id) {
    await direccionesApi.remove(id);
    setDirecciones((prev) => prev.filter((d) => d.id !== id));
  }

  if (cargando) return <Loader texto="Cargando tu cuenta..." />;

  return (
    <div className="container-natymoo py-12 max-w-2xl">
      <h1 className="text-3xl mb-8">Mi cuenta</h1>

      <section className="border border-plum/10 rounded-2xl p-6 bg-white/40 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg">Datos personales</h2>
          {!editandoPerfil && (
            <button
              onClick={() => setEditandoPerfil(true)}
              className="text-sm text-plum font-medium hover:text-rose"
            >
              Editar
            </button>
          )}
        </div>

        {editandoPerfil ? (
          <form onSubmit={handleGuardarPerfil} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: soloLetras(e.target.value) })}
                className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
                placeholder="Nombre"
              />
              <input
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: soloLetras(e.target.value) })}
                className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
                placeholder="Apellido"
              />
            </div>
            <input
              value={form.telefono}
              inputMode="numeric"
              onChange={(e) => setForm({ ...form, telefono: soloNumeros(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
              placeholder="Teléfono"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditandoPerfil(false)}
                className="px-5 py-2 rounded-full border border-plum/20 text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <dl className="text-sm space-y-2 text-plum-ink/70">
            <div className="flex justify-between">
              <dt>Nombre</dt>
              <dd>{usuario.nombre} {usuario.apellido}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Correo</dt>
              <dd>{usuario.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Teléfono</dt>
              <dd>{usuario.telefono || "—"}</dd>
            </div>
          </dl>
        )}

        {mensaje && <p className="text-sm text-sage mt-3">{mensaje}</p>}
        <ErrorMessage mensaje={error} />
      </section>

      <section className="border border-plum/10 rounded-2xl p-6 bg-white/40">
        <h2 className="text-lg mb-4">Mis direcciones</h2>
        {direcciones.length === 0 ? (
          <p className="text-sm text-plum-ink/50">
            Todavía no tienes direcciones guardadas. Se crean automáticamente
            al hacer tu primer pedido.
          </p>
        ) : (
          <div className="space-y-3">
            {direcciones.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border border-plum/10 rounded-xl p-4"
              >
                <div>
                  <p className="font-medium text-sm">{d.alias || "Dirección"}</p>
                  <p className="text-sm text-plum-ink/60">
                    {d.calle} {d.numero}, {d.ciudad}
                  </p>
                </div>
                <button
                  onClick={() => handleEliminarDireccion(d.id)}
                  className="text-sm text-plum-ink/40 hover:text-rose"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
