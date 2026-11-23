import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import FieldError from "../components/FieldError";
import {
  requerido,
  esEmailValido,
  longitudMinima,
  telefonoValido,
  soloLetras,
  soloNumeros,
  validarFormulario,
  tieneErrores,
} from "../utils/validation";

export default function Register() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
  });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const nuevosErrores = validarFormulario(form, {
      nombre: [(v) => requerido(v, "El nombre")],
      apellido: [(v) => requerido(v, "El apellido")],
      email: [esEmailValido],
      password: [(v) => longitudMinima(v, 6, "La contraseña")],
      telefono: [telefonoValido],
    });
    setErrores(nuevosErrores);
    if (tieneErrores(nuevosErrores)) return;

    setEnviando(true);
    try {
      await registrar(form);
      navigate("/");
    } catch (err) {
      const erroresBackend = err.response?.data?.errores;
      const primerError = erroresBackend ? Object.values(erroresBackend)[0] : null;
      setError(
        primerError || err.response?.data?.mensaje || "No pudimos crear tu cuenta."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container-natymoo py-20 max-w-md">
      <h1 className="text-3xl mb-2">Crea tu cuenta</h1>
      <p className="text-plum-ink/60 mb-8">Unos datos y listo.</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-nombre" className="block text-sm font-medium mb-1">Nombre</label>
            <input id="reg-nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: soloLetras(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-plum/20 bg-white/60 focus:border-plum outline-none"
            />
            <FieldError mensaje={errores.nombre} />
          </div>
          <div>
            <label htmlFor="reg-apellido" className="block text-sm font-medium mb-1">Apellido</label>
            <input id="reg-apellido"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: soloLetras(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-plum/20 bg-white/60 focus:border-plum outline-none"
            />
            <FieldError mensaje={errores.apellido} />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input id="reg-email"
            type="email"
            value={form.email}
            onChange={set("email")}
            className="w-full px-4 py-3 rounded-xl border border-plum/20 bg-white/60 focus:border-plum outline-none"
          />
          <FieldError mensaje={errores.email} />
        </div>

        <div>
          <label htmlFor="reg-telefono" className="block text-sm font-medium mb-1">Teléfono</label>
          <input id="reg-telefono"
            inputMode="numeric"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: soloNumeros(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl border border-plum/20 bg-white/60 focus:border-plum outline-none"
          />
          <FieldError mensaje={errores.telefono} />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium mb-1">Contraseña</label>
          <input id="reg-password"
            type="password"
            value={form.password}
            onChange={set("password")}
            className="w-full px-4 py-3 rounded-xl border border-plum/20 bg-white/60 focus:border-plum outline-none"
          />
          <FieldError mensaje={errores.password} />
          {!errores.password && <p className="text-xs text-plum-ink/40 mt-1">Mínimo 6 caracteres</p>}
        </div>

        <ErrorMessage mensaje={error} />

        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors disabled:opacity-50"
        >
          {enviando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-plum-ink/60">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="text-plum font-medium hover:text-rose">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
