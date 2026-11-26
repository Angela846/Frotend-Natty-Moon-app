import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LowStockAlert from "../../components/LowStockAlert";
import NotificationBell from "../../components/NotificationBell";
import Logo from "../../components/Logo";

const tabs = [
  { to: "/admin", label: "Productos", icon: "🏷️", end: true },
  { to: "/admin/categorias", label: "Categorías", icon: "📂" },
  { to: "/admin/cupones", label: "Cupones", icon: "🎟️" },
  { to: "/admin/pedidos", label: "Pedidos", icon: "📦" },
  { to: "/admin/pagos", label: "Pagos", icon: "💳" },
  { to: "/admin/novedades", label: "Novedades", icon: "🚩" },
  { to: "/admin/usuarios", label: "Usuarios", icon: "👤" },
  { to: "/admin/roles", label: "Roles", icon: "🔑" },
  { to: "/admin/direcciones", label: "Direcciones", icon: "📍" },
];

// Color del item activo del menú. Para azul, usa: "bg-plum text-white"
const ACTIVO = "bg-sun text-nocturne";

export default function AdminLayout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen bg-nocturne text-blush flex flex-col sm:flex-row">
      {/* Sidebar */}
      <aside className="sm:w-64 shrink-0 border-b sm:border-b-0 sm:border-r border-white/10 bg-[#070D26] sm:min-h-screen flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="inline-block bg-white/95 rounded-lg px-3 py-1.5">
            <Logo className="h-6 w-auto" textClassName="font-display text-lg text-plum" />
          </Link>
          <p className="text-xs text-sun mt-2 uppercase tracking-wide">Panel administrativo</p>
        </div>

        <nav className="p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? ACTIVO
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span>{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 mt-auto hidden sm:block">
          <p className="text-xs text-white/40 mb-2">Conectado como</p>
          <p className="text-sm text-white/80 truncate">{usuario?.nombre} {usuario?.apellido}</p>
          <div className="flex flex-col gap-2 mt-3">
            <Link to="/" className="text-xs text-white/50 hover:text-white">
              ← Volver a la tienda
            </Link>
            <button onClick={logout} className="text-xs text-sun hover:text-sun-light text-left">
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido: tarjeta clara para que los formularios mantengan buen contraste */}
      <main className="flex-1 p-4 sm:p-10">
        <div className="max-w-5xl mx-auto flex justify-end mb-3">
          <NotificationBell dark />
        </div>
        <div className="max-w-5xl mx-auto bg-blush text-plum-ink rounded-3xl p-6 sm:p-8 min-h-[70vh]">
          <LowStockAlert />
          <Outlet />
        </div>
      </main>
    </div>
  );
}