import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function AdminRoute({ children }) {
  const { usuario, esAdmin, cargando } = useAuth();

  if (cargando) return <Loader texto="Verificando permisos..." />;

  if (!usuario) return <Navigate to="/login" replace />;
  if (!esAdmin) return <Navigate to="/" replace />;

  return children;
}
