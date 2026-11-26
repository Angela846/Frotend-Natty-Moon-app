import { useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

export default function ProductCard({ producto, imagenUrl, agotado, pocasUnidades }) {
  const { usuario } = useAuth();
  const [imagenFalla, setImagenFalla] = useState(false);
  const { estaEnFavoritos, alternarFavorito } = useWishlist();
  const precio = Number(producto.precioOferta ?? producto.precioBase);
  const tieneOferta = producto.precioOferta && Number(producto.precioOferta) < Number(producto.precioBase);
  const esFavorito = estaEnFavoritos(producto.id);

  function handleFavorito(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!usuario) return;
    alternarFavorito(producto);
  }

  return (
    <Link
      to={`/productos/${producto.id}`}
      className="group block"
    >
      <div className="aspect-[4/5] rounded-[1.75rem] bg-gradient-to-b from-blush-soft to-blush-deep border border-plum/10 overflow-hidden flex items-center justify-center relative shadow-[0_14px_30px_-20px_rgba(43,58,143,0.35)]">
        {imagenUrl && !imagenFalla ? (
          <img
            src={imagenUrl}
            alt={producto.nombre}
            onError={() => setImagenFalla(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${agotado ? "opacity-40 grayscale" : ""}`}
          />
        ) : (
          <div className={`flex flex-col items-center gap-4 ${agotado ? "opacity-40" : ""}`}>
            <span
              className="block w-20 h-20 rounded-full bg-gradient-to-br from-sun-light to-sun shadow-[0_0_40px_8px_rgba(255,210,63,0.35)]"
              aria-hidden="true"
            />
            <span className="font-display text-plum/50 text-xl select-none">natymoo</span>
          </div>
        )}
        {agotado ? (
          <span className="absolute top-3 left-3 bg-plum-ink text-white text-xs font-medium px-3 py-1 rounded-full">
            Agotado
          </span>
        ) : (
          <>
            {tieneOferta && (
              <span className="absolute top-3 left-3 bg-rose text-white text-xs font-semibold px-3 py-1 rounded-full">
                Oferta
              </span>
            )}
            {pocasUnidades && (
              <span className={`absolute left-3 bg-moon text-night text-xs font-semibold px-3 py-1 rounded-full ${tieneOferta ? "top-11" : "top-3"}`}>
                Quedan pocas
              </span>
            )}
          </>
        )}
        {usuario && (
          <button
            onClick={handleFavorito}
            aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={esFavorito ? "#C97B84" : "none"}
              stroke="#C97B84"
              strokeWidth="1.8"
            >
              <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z" />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-medium text-plum-ink group-hover:text-rose transition-colors">
          {producto.nombre}
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-display text-xl font-semibold text-plum">
            ${precio.toLocaleString("es-CO")}
          </span>
          {tieneOferta && (
            <span className="text-sm text-plum-ink/40 line-through">
              ${Number(producto.precioBase).toLocaleString("es-CO")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}