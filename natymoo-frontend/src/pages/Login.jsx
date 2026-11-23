import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import FieldError from "../components/FieldError";
import { esEmailValido, requerido, validarFormulario, tieneErrores } from "../utils/validation";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const nuevosErrores = validarFormulario(form, {
      email: [esEmailValido],
      password: [(v) => requerido(v, "La contraseña")],
    });
    setErrores(nuevosErrores);
    if (tieneErrores(nuevosErrores)) return;

    setEnviando(true);
    try {
      await login(form.email, form.password);
      const destino = location.state?.from?.pathname || "/";
      navigate(destino, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "Credenciales inválidas. Intenta de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container-natymoo py-20 max-w-md">
      <h1 className="text-3xl mb-2">Inicia sesión</h1>
      <p className="text-plum-ink/60 mb-8">Bienvenida de vuelta a natymoo.</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input id="login-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-plum/20 bg-white/60 focus:border-plum outline-none"
          />
          <FieldError mensaje={errores.email} />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium mb-1">Contraseña</label>
          <input id="login-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-plum/20 bg-white/60 focus:border-plum outline-none"
          />
          <FieldError mensaje={errores.password} />
        </div>

        <ErrorMessage mensaje={error} />

        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-plum-ink/60">
        ¿No tienes cuenta?{" "}
        <Link to="/registro" className="text-plum font-medium hover:text-rose">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
