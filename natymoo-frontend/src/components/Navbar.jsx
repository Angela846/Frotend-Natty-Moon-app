import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Logo from "./Logo";

export default function Navbar() {
  const { usuario, logout, esAdmin, esEmpleado } = useAuth();
  const { cantidadTotal } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 bg-blush/90 backdrop-blur border-b border-plum/10">
      <div className="container-natymoo flex items-center justify-between h-20">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-plum-ink">
          <Link to="/" className="hover:text-rose transition-colors">
            Catálogo
          </Link>
          {usuario && (
            <Link to="/pedidos" className="hover:text-rose transition-colors">
              Mis pedidos
            </Link>
          )}
          {usuario && (
            <Link to="/cuenta" className="hover:text-rose transition-colors">
              Mi cuenta
            </Link>
          )}
          {usuario && (
            <Link to="/novedades" className="hover:text-rose transition-colors">
              Reportar novedad
            </Link>
          )}
          {esAdmin && (
            <Link to="/admin" className="hover:text-rose transition-colors">
              Panel admin
            </Link>
          )}
          {esEmpleado && (
            <Link to="/empleado" className="hover:text-rose transition-colors">
              Panel empleado
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {usuario && (
            <Link
              to="/favoritos"
              className="text-plum-ink hover:text-rose transition-colors"
              aria-label="Favoritos"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
          <Link
            to="/carrito"
            className="relative flex items-center gap-1 text-plum-ink hover:text-rose transition-colors"
            aria-label="Carrito de compras"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h2l1.5 10.5a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.75L20 8H7" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="20" r="1"/>
              <circle cx="17" cy="20" r="1"/>
            </svg>
            {cantidadTotal > 0 && (
              <span className="absolute -top-2 -right-3 bg-rose text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center">
                {cantidadTotal}
              </span>
            )}
          </Link>

          {usuario ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-plum-ink/70">
                Hola, {usuario.nombre}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-2 rounded-full border border-plum/20 hover:bg-plum hover:text-blush transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-2 rounded-full bg-plum text-blush hover:bg-plum-dark transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
