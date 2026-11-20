import { Routes, Route } from "react-router-dom";
import StorefrontLayout from "./layouts/StorefrontLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import EmpleadoRoute from "./components/EmpleadoRoute";

import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import ReportarNovedad from "./pages/ReportarNovedad";
import NotFound from "./pages/NotFound";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCupones from "./pages/admin/AdminCupones";
import AdminOrdenes from "./pages/admin/AdminOrdenes";
import AdminPagos from "./pages/admin/AdminPagos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminDirecciones from "./pages/admin/AdminDirecciones";
import AdminNovedades from "./pages/admin/AdminNovedades";

import EmpleadoLayout from "./pages/empleado/EmpleadoLayout";
import EmpleadoPedidos from "./pages/empleado/EmpleadoPedidos";
import EmpleadoStock from "./pages/empleado/EmpleadoStock";
import EmpleadoNovedades from "./pages/empleado/EmpleadoNovedades";

export default function App() {
  return (
    <Routes>
      {/* Tienda: navbar + footer */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/productos/:id" element={<ProductDetail />} />
        <Route path="/carrito" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/pedidos" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/cuenta" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/favoritos" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/novedades" element={<ProtectedRoute><ReportarNovedad /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Panel admin: chrome propio, oscuro, distinto a la tienda */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminProducts />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="cupones" element={<AdminCupones />} />
        <Route path="pedidos" element={<AdminOrdenes />} />
        <Route path="pagos" element={<AdminPagos />} />
        <Route path="novedades" element={<AdminNovedades />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="direcciones" element={<AdminDirecciones />} />
      </Route>

      {/* Panel empleado: chrome propio, distinto al admin y a la tienda */}
      <Route path="/empleado" element={<EmpleadoRoute><EmpleadoLayout /></EmpleadoRoute>}>
        <Route index element={<EmpleadoPedidos />} />
        <Route path="stock" element={<EmpleadoStock />} />
        <Route path="novedades" element={<EmpleadoNovedades />} />
      </Route>
    </Routes>
  );
}
