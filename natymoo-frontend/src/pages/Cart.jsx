import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { imagenesApi } from "../api/resources";
import Loader from "../components/Loader";

export default function Cart() {
  const { items, total, actualizarCantidad, eliminarDelCarrito, cargando } = useCart();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const [procesandoId, setProcesandoId] = useState(null);
  const [imagenes, setImagenes] = useState([]);

  useEffect(() => {
    imagenesApi.list().then(setImagenes).catch(() => setImagenes([]));
  }, []);

  function imagenPrincipal(productoId) {
    const propias = imagenes.filter((i) => i.producto?.id === productoId);
    return propias.find((i) => i.esPrincipal)?.url || propias[0]?.url || null;
  }

  async function handleCambiarCantidad(item, nuevaCantidad) {
    if (nuevaCantidad < 1) return;
    setProcesandoId(item.id);
    try {
      const resultado = await actualizarCantidad(item.id, nuevaCantidad);
      if (!resultado.ok && resultado.motivo) {
        mostrarToast(resultado.motivo, "error");
      }
    } finally {
      setProcesandoId(null);
    }
  }

  if (cargando) return <Loader texto="Cargando tu carrito..." />;

  if (items.length === 0) {
    return (
      <div className="container-natymoo py-24 text-center">
        <h1 className="text-2xl mb-3">Tu carrito está vacío</h1>
        <p className="text-plum-ink/60 mb-6">
          Explora el catálogo y encuentra algo cómodo para hoy.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container-natymoo py-12">
      <h1 className="text-3xl mb-8">Tu carrito</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const stockConocido = item.variante?.stock;
            const enElTope =
              typeof stockConocido === "number" && item.cantidad >= stockConocido;
            const urlImagen = imagenPrincipal(item.variante?.producto?.id);

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 border border-plum/10 rounded-2xl p-4 bg-white/40"
              >
                <div className="w-20 h-20 rounded-xl bg-blush-soft flex items-center justify-center shrink-0 overflow-hidden">
                  {urlImagen ? (
                    <img
                      src={urlImagen}
                      alt={item.variante?.producto?.nombre ?? "Producto"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-plum/20 text-xs">natymoo</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {item.variante?.producto?.nombre ?? "Producto"}
                  </p>
                  <p className="text-sm text-plum-ink/50">
                    Talla {item.variante?.talla} · {item.variante?.color}
                  </p>
                  <p className="text-sm text-plum mt-1">
                    ${Number(item.precioUnitario).toLocaleString("es-CO")}
                  </p>
                  {enElTope && (
                    <p className="text-xs text-rose mt-1">
                      Llegaste al máximo disponible ({stockConocido})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCambiarCantidad(item, item.cantidad - 1)}
                    disabled={procesandoId === item.id}
                    className="w-8 h-8 rounded-full border border-plum/20 hover:border-plum/50 flex items-center justify-center disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.cantidad}</span>
                  <button
                    onClick={() => handleCambiarCantidad(item, item.cantidad + 1)}
                    disabled={procesandoId === item.id || enElTope}
                    className="w-8 h-8 rounded-full border border-plum/20 hover:border-plum/50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => eliminarDelCarrito(item.id)}
                  className="text-sm text-plum-ink/40 hover:text-rose transition-colors ml-2"
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </div>

        <div className="border border-plum/10 rounded-2xl p-6 h-fit bg-white/40">
          <h2 className="text-lg mb-4">Resumen</h2>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-plum-ink/50 border-b border-plum/10">
                <th className="font-medium pb-2">Producto</th>
                <th className="font-medium pb-2 text-center">Cant.</th>
                <th className="font-medium pb-2 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-plum/5 last:border-0">
                  <td className="py-2 pr-2 truncate max-w-[120px]">
                    {item.variante?.producto?.nombre ?? "Producto"}
                  </td>
                  <td className="py-2 text-center text-plum-ink/70">{item.cantidad}</td>
                  <td className="py-2 text-right">
                    ${(Number(item.precioUnitario) * item.cantidad).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between text-sm text-plum-ink/70 mb-2 pt-2 border-t border-plum/10">
            <span>Subtotal</span>
            <span>${total.toLocaleString("es-CO")}</span>
          </div>
          <div className="flex justify-between font-medium text-lg mt-4 pt-4 border-t border-plum/10">
            <span>Total</span>
            <span>${total.toLocaleString("es-CO")}</span>
          </div>
          <button
            onClick={() => navigate("/checkout")}
            className="mt-6 w-full py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors"
          >
            Continuar a pagar
          </button>
        </div>
      </div>
    </div>
  );
}
