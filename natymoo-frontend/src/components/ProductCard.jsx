import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

export default function ProductCard({ producto, imagenUrl, agotado }) {
  const { usuario } = useAuth();
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
      <div className="aspect-[4/5] rounded-2xl bg-blush-soft border border-plum/10 overflow-hidden flex items-center justify-center relative">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={producto.nombre}
            className={`w-full h-full object-cover ${agotado ? "opacity-40 grayscale" : ""}`}
          />
        ) : (
          <span className={`font-display text-plum/20 text-4xl select-none ${agotado ? "opacity-40" : ""}`}>
            natymoo
          </span>
        )}
        {agotado ? (
          <span className="absolute top-3 left-3 bg-plum-ink text-white text-xs font-medium px-3 py-1 rounded-full">
            Agotado
          </span>
        ) : (
          tieneOferta && (
            <span className="absolute top-3 left-3 bg-rose text-white text-xs font-medium px-3 py-1 rounded-full">
              Oferta
            </span>
          )
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
          <span className="font-display text-lg text-plum">
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
