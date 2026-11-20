import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { limpiarCacheApp } from "../utils/cache";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Al cargar la app, preguntamos al backend si la cookie sigue siendo valida
    authApi
      .me()
      .then((data) => setUsuario(data))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  async function login(email, password) {
    const data = await authApi.login({ email, password });
    setUsuario(data);
    return data;
  }

  async function registrar(datos) {
    const data = await authApi.register(datos);
    setUsuario(data);
    return data;
  }

  async function logout() {
    await authApi.logout();
    setUsuario(null);
    // Borra todo lo guardado en localStorage (carrito, catalogo cacheado, etc.)
    // para que el proximo usuario que use este navegador no vea datos ajenos.
    limpiarCacheApp();
  }

  const esAdmin = usuario?.rol === "ADMIN";
  const esEmpleado = usuario?.rol === "EMPLEADO";
  const esStaff = esAdmin || esEmpleado;

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, login, registrar, logout, esAdmin, esEmpleado, esStaff }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
