import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";

export default function Wishlist() {
  const { items, cargando } = useWishlist();

  if (cargando) return <Loader texto="Cargando tus favoritos..." />;

  if (items.length === 0) {
    return (
      <div className="container-natymoo py-24 text-center">
        <h1 className="text-2xl mb-3">Todavía no tienes favoritos</h1>
        <p className="text-plum-ink/60 mb-6">
          Toca el corazón en cualquier producto para guardarlo aquí.
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
      <h1 className="text-3xl mb-8">Mis favoritos</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {items
          .filter((i) => i.producto)
          .map((i) => (
            <ProductCard key={i.id} producto={i.producto} />
          ))}
      </div>
    </div>
  );
}
