import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Loader texto="Verificando sesión..." />;

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
