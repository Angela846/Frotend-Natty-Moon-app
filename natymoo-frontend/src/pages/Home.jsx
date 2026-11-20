import { useEffect, useState } from "react";
import { productosApi, categoriasApi, imagenesApi, variantesApi } from "../api/resources";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import Logo from "../components/Logo";
import { guardarCache, leerCache } from "../utils/cache";

const CLAVE_CACHE_CATALOGO = "catalogo";
// El catalogo (precios, stock) puede cambiar, asi que la cache solo dura un
// rato: sirve para que la pagina se vea al instante al recargar, mientras
// se confirma con el backend en segundo plano.
const TTL_CATALOGO_MS = 3 * 60 * 1000; // 3 minutos

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // 1) Si hay algo guardado de una visita reciente, mostrarlo ya mismo.
    const enCache = leerCache(CLAVE_CACHE_CATALOGO, TTL_CATALOGO_MS);
    if (enCache) {
      setProductos(enCache.productos);
      setCategorias(enCache.categorias);
      setImagenes(enCache.imagenes);
      setVariantes(enCache.variantes);
      setCargando(false);
    }

    // 2) Confirmar/actualizar con el backend igual, sin bloquear la pantalla
    // si ya se mostro algo desde cache.
    Promise.all([productosApi.list(), categoriasApi.list(), imagenesApi.list(), variantesApi.list()])
      .then(([prods, cats, imgs, vars]) => {
        const productosActivos = prods.filter((p) => p.activo !== false);
        const categoriasActivas = cats.filter((c) => c.activo !== false);
        setProductos(productosActivos);
        setCategorias(categoriasActivas);
        setImagenes(imgs);
        setVariantes(vars);
        guardarCache(CLAVE_CACHE_CATALOGO, {
          productos: productosActivos,
          categorias: categoriasActivas,
          imagenes: imgs,
          variantes: vars,
        });
      })
      .finally(() => setCargando(false));
  }, []);

  function imagenPrincipal(productoId) {
    const propias = imagenes.filter((i) => i.producto?.id === productoId);
    return propias.find((i) => i.esPrincipal)?.url || propias[0]?.url || null;
  }

  function stockTotal(productoId) {
    return variantes
      .filter((v) => v.producto?.id === productoId)
      .reduce((acc, v) => acc + v.stock, 0);
  }

  const productosFiltrados = productos
    .filter((p) => (categoriaActiva ? p.categoria?.id === categoriaActiva : true))
    .filter((p) => {
      if (!busqueda.trim()) return true;
      const texto = busqueda.trim().toLowerCase();
      return (
        p.nombre?.toLowerCase().includes(texto) ||
        p.descripcion?.toLowerCase().includes(texto) ||
        p.categoria?.nombre?.toLowerCase().includes(texto)
      );
    });

  return (
    <div>
      {/* Hero */}
      <section className="container-natymoo pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="grid sm:grid-cols-5 gap-10 items-center">
          <div className="sm:col-span-3">
            <p className="text-rose font-medium text-sm mb-3">
              Nueva colección de temporada
            </p>
            <h1 className="font-display text-4xl sm:text-6xl leading-[1.05] text-plum-ink">
              Descansar bien
              <br />
              <span className="italic text-plum">empieza por lo que usas</span>
            </h1>
            <p className="mt-6 text-plum-ink/70 max-w-md text-lg">
              Pijamas y ropa de estar en casa hechas con telas suaves,
              pensadas para tus noches más tranquilas.
            </p>
            <a
              href="#catalogo"
              className="inline-block mt-8 px-7 py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors"
            >
              Ver catálogo
            </a>
          </div>
          <div className="sm:col-span-2 relative">
            <div className="aspect-square rounded-[2rem] bg-gradient-to-br from-rose/30 via-blush-deep to-sage/20 flex items-center justify-center p-10">
              <Logo
                className="w-full max-w-[220px] h-auto opacity-90 drop-shadow-sm"
                textClassName="font-display text-5xl text-plum/30 rotate-[-6deg] select-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catalogo */}
      <section id="catalogo" className="container-natymoo pb-24">
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-ink/30"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-11 pr-10 py-3 rounded-full border border-plum/20 bg-white/60 focus:border-plum outline-none text-sm"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-plum-ink/40 hover:text-plum-ink"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h2 className="text-2xl">Catálogo</h2>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoriaActiva(null)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                categoriaActiva === null
                  ? "bg-plum text-blush border-plum"
                  : "border-plum/20 text-plum-ink/70 hover:border-plum/40"
              }`}
            >
              Todo
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  categoriaActiva === cat.id
                    ? "bg-plum text-blush border-plum"
                    : "border-plum/20 text-plum-ink/70 hover:border-plum/40"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <Loader texto="Cargando productos..." />
        ) : productosFiltrados.length === 0 ? (
          <p className="text-plum-ink/50 py-16 text-center">
            {busqueda
              ? `No encontramos productos para "${busqueda}".`
              : "Todavía no hay productos en esta categoría."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {productosFiltrados.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                imagenUrl={imagenPrincipal(producto.id)}
                agotado={stockTotal(producto.id) === 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
