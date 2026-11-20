import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function EmpleadoRoute({ children }) {
  const { usuario, esStaff, cargando } = useAuth();

  if (cargando) return <Loader texto="Verificando permisos..." />;

  if (!usuario) return <Navigate to="/login" replace />;
  if (!esStaff) return <Navigate to="/" replace />;

  return children;
}
