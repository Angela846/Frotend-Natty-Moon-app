import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { productosApi, categoriasApi, imagenesApi, variantesApi } from "../api/resources";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import { guardarCache, leerCache } from "../utils/cache";

// Estrellas del hero: posicion (en %), tamano y desfase del brillo
const ESTRELLAS = [
  { top: "9%", left: "5%", tamano: "text-2xl", retraso: "0s" },
  { top: "22%", left: "14%", tamano: "text-base", retraso: "1.2s" },
  { top: "62%", left: "8%", tamano: "text-xl", retraso: "2.1s" },
  { top: "84%", left: "19%", tamano: "text-sm", retraso: "0.6s" },
  { top: "14%", left: "31%", tamano: "text-lg", retraso: "1.8s" },
  { top: "74%", left: "36%", tamano: "text-2xl", retraso: "2.6s" },
  { top: "8%", left: "48%", tamano: "text-sm", retraso: "0.9s" },
  { top: "46%", left: "47%", tamano: "text-base", retraso: "1.5s" },
  { top: "90%", left: "55%", tamano: "text-lg", retraso: "0.3s" },
  { top: "12%", left: "66%", tamano: "text-xl", retraso: "2.4s" },
  { top: "36%", left: "93%", tamano: "text-2xl", retraso: "1s" },
  { top: "80%", left: "90%", tamano: "text-base", retraso: "1.9s" },
  { top: "6%", left: "92%", tamano: "text-sm", retraso: "2.8s" },
];

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
  const { hash } = useLocation();

  // Link "Catálogo" del Navbar (/#catalogo): bajar a la sección del catálogo
  useEffect(() => {
    if (hash === "#catalogo") {
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

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
      .catch((err) => console.error("No se pudo cargar el catálogo:", err))
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
      <section className="relative overflow-hidden bg-gradient-to-b from-nocturne to-nocturne-mid text-mist">
        <div className="stars absolute inset-0" aria-hidden="true" />
        {ESTRELLAS.map((e, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`twinkle absolute select-none ${e.tamano}`}
            style={{ top: e.top, left: e.left, animationDelay: e.retraso }}
          >
            ✦
          </span>
        ))}
        <div className="container-natymoo relative pt-16 pb-32 sm:pt-20 sm:pb-36 grid sm:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display text-5xl sm:text-5xl lg:text-7xl leading-[1.04] text-mist">
              Descansar bien empieza por lo que usas
            </h1>
            <p className="mt-6 text-mist/80 max-w-md text-lg">
              Pijamas y ropa de estar en casa hechas con telas suaves,
              pensadas para tus noches más tranquilas.
            </p>
            <a
              href="#catalogo"
              className="inline-block mt-10 px-8 py-4 rounded-full bg-sun text-nocturne font-semibold hover:bg-sun-light transition-colors"
            >
              Ver catálogo
            </a>
          </div>
          <img
            src="/natymoon-hero.webp"
            alt="NattyMoon: un osito sentado en la luna sostiene dos pijamas"
            width="900"
            height="900"
            className="w-full max-w-[440px] justify-self-center sm:justify-self-end drop-shadow-[0_0_40px_rgba(255,210,63,0.25)]"
          />
        </div>
      </section>

      {/* Catalogo */}
      <section id="catalogo" className="relative -mt-14 rounded-t-[3rem] bg-blush pt-14 scroll-mt-20">
        <div className="container-natymoo pb-24">
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
          <h2 className="text-4xl">
            Catálogo
            {!cargando && (
              <span className="ml-3 text-base font-body text-plum-ink/40">
                {productosFiltrados.length} {productosFiltrados.length === 1 ? "producto" : "productos"}
              </span>
            )}
          </h2>

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
                pocasUnidades={stockTotal(producto.id) > 0 && stockTotal(producto.id) <= 5}
              />
            ))}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}