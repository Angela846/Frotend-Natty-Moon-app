import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  productosApi,
  variantesApi,
  resenasApi,
  imagenesApi,
} from "../api/resources";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { agregarAlCarrito } = useCart();
  const { estaEnFavoritos, alternarFavorito } = useWishlist();

  const [producto, setProducto] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [imagenesProducto, setImagenesProducto] = useState([]);
  const [imagenActiva, setImagenActiva] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [tallaSel, setTallaSel] = useState(null);
  const [colorSel, setColorSel] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [calificacionForm, setCalificacionForm] = useState(5);
  const [comentarioForm, setComentarioForm] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [errorResena, setErrorResena] = useState("");

  useEffect(() => {
    setCargando(true);
    Promise.all([
      productosApi.get(id),
      variantesApi.list(),
      resenasApi.list(),
      imagenesApi.list(),
    ])
      .then(([prod, todasVariantes, todasResenas, todasImagenes]) => {
        setProducto(prod);
        const propias = todasVariantes.filter((v) => v.producto?.id === Number(id));
        setVariantes(propias);
        setResenas(todasResenas.filter((r) => r.producto?.id === Number(id)));

        const imgsPropias = todasImagenes
          .filter((i) => i.producto?.id === Number(id))
          .sort((a, b) => (b.esPrincipal ? 1 : 0) - (a.esPrincipal ? 1 : 0) || a.orden - b.orden);
        setImagenesProducto(imgsPropias);
        setImagenActiva(imgsPropias[0]?.url || null);

        if (propias.length > 0) {
          setTallaSel(propias[0].talla);
          setColorSel(propias[0].color);
        }
      })
      .catch(() => setError("No pudimos cargar este producto."))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <Loader texto="Cargando producto..." />;
  if (error) return <div className="container-natymoo py-16"><ErrorMessage mensaje={error} /></div>;
  if (!producto) return null;

  const tallas = [...new Set(variantes.map((v) => v.talla))];
  const coloresDeTalla = variantes.filter((v) => v.talla === tallaSel);
  const varianteActual = variantes.find(
    (v) => v.talla === tallaSel && v.color === colorSel
  );

  const precio = Number(producto.precioOferta ?? producto.precioBase);

  async function handleAgregar() {
    setMensaje("");
    setError("");
    if (!usuario) {
      navigate("/login");
      return;
    }
    if (!varianteActual) {
      setError("Selecciona talla y color.");
      return;
    }
    if (varianteActual.stock < 1) {
      setError("Esta combinación no tiene stock disponible.");
      return;
    }
    const resultado = await agregarAlCarrito({ ...varianteActual, producto }, 1);
    if (resultado?.ok === false) {
      setError(resultado.motivo || "No se pudo agregar al carrito.");
      return;
    }
    setMensaje("Se agregó al carrito.");
  }

  async function handleEnviarResena(e) {
    e.preventDefault();
    setErrorResena("");
    setEnviandoResena(true);
    try {
      const creada = await resenasApi.create({
        producto: { id: producto.id },
        usuario: { id: usuario.id },
        calificacion: calificacionForm,
        comentario: comentarioForm,
      });
      setResenas((prev) => [{ ...creada, usuario }, ...prev]);
      setComentarioForm("");
      setCalificacionForm(5);
    } catch (err) {
      if (err.response?.status === 500 || err.response?.status === 400) {
        setErrorResena("Ya dejaste una reseña para este producto.");
      } else {
        setErrorResena("No pudimos guardar tu reseña.");
      }
    } finally {
      setEnviandoResena(false);
    }
  }

  return (
    <div className="container-natymoo py-12">
      <div className="grid sm:grid-cols-2 gap-12">
        <div>
          <div className="aspect-[4/5] rounded-2xl bg-blush-soft border border-plum/10 flex items-center justify-center overflow-hidden">
            {imagenActiva ? (
              <img src={imagenActiva} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-plum/20 text-4xl">natymoo</span>
            )}
          </div>
          {imagenesProducto.length > 1 && (
            <div className="flex gap-2 mt-3">
              {imagenesProducto.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setImagenActiva(img.url)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    imagenActiva === img.url ? "border-plum" : "border-transparent"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-plum-ink/50">{producto.categoria?.nombre}</p>
              <h1 className="text-3xl mt-1">{producto.nombre}</h1>
            </div>
            {usuario && (
              <button
                onClick={() => alternarFavorito(producto)}
                aria-label="Alternar favorito"
                className="w-11 h-11 rounded-full border border-plum/15 flex items-center justify-center shrink-0 hover:border-rose transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={estaEnFavoritos(producto.id) ? "#C97B84" : "none"}
                  stroke="#C97B84"
                  strokeWidth="1.8"
                >
                  <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z" />
                </svg>
              </button>
            )}
          </div>
          <p className="font-display text-2xl text-plum mt-3">
            ${precio.toLocaleString("es-CO")}
          </p>
          <p className="mt-5 text-plum-ink/70 leading-relaxed">
            {producto.descripcion}
          </p>

          {producto.material && (
            <p className="mt-3 text-sm text-plum-ink/50">
              Material: {producto.material}
            </p>
          )}

          {tallas.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-medium mb-2">Talla</p>
              <div className="flex gap-2 flex-wrap">
                {tallas.map((talla) => (
                  <button
                    key={talla}
                    onClick={() => {
                      setTallaSel(talla);
                      const primero = variantes.find((v) => v.talla === talla);
                      setColorSel(primero?.color ?? null);
                    }}
                    className={`w-11 h-11 rounded-full border text-sm font-medium transition-colors ${
                      tallaSel === talla
                        ? "bg-plum text-blush border-plum"
                        : "border-plum/20 hover:border-plum/50"
                    }`}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>
          )}

          {coloresDeTalla.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {coloresDeTalla.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setColorSel(v.color)}
                    className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                      colorSel === v.color
                        ? "bg-plum text-blush border-plum"
                        : "border-plum/20 hover:border-plum/50"
                    }`}
                  >
                    {v.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {varianteActual && (
            <p className="mt-4 text-sm text-plum-ink/50">
              {varianteActual.stock > 0
                ? `${varianteActual.stock} disponibles`
                : "Sin stock en esta combinación"}
            </p>
          )}

          <button
            onClick={handleAgregar}
            className="mt-6 w-full sm:w-auto px-8 py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors disabled:opacity-40"
            disabled={!varianteActual || varianteActual.stock < 1}
          >
            Agregar al carrito
          </button>

          {mensaje && <p className="mt-3 text-sm text-sage">{mensaje}</p>}
          {error && <div className="mt-3"><ErrorMessage mensaje={error} /></div>}
        </div>
      </div>

      {/* Resenas */}
      <section className="mt-20 max-w-2xl">
        <h2 className="text-2xl mb-6">Reseñas</h2>

        {usuario && (
          <form onSubmit={handleEnviarResena} className="border border-plum/10 rounded-2xl p-5 bg-white/40 mb-8">
            <p className="text-sm font-medium mb-2">Deja tu reseña</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCalificacionForm(n)}
                  className={`text-2xl leading-none ${n <= calificacionForm ? "text-rose" : "text-plum/20"}`}
                  aria-label={`${n} estrellas`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="¿Qué te pareció? (opcional)"
              value={comentarioForm}
              onChange={(e) => setComentarioForm(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
            {errorResena && <p className="text-sm text-rose mt-2">{errorResena}</p>}
            <button
              type="submit"
              disabled={enviandoResena}
              className="mt-3 px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium disabled:opacity-50"
            >
              {enviandoResena ? "Enviando..." : "Publicar reseña"}
            </button>
          </form>
        )}

        {resenas.length === 0 ? (
          <p className="text-plum-ink/50">Este producto todavía no tiene reseñas.</p>
        ) : (
          <div className="space-y-6">
            {resenas.map((r) => (
              <div key={r.id} className="border-b border-plum/10 pb-6">
                <div className="flex items-center gap-2">
                  <span className="text-rose">
                    {"★".repeat(r.calificacion)}
                    {"☆".repeat(5 - r.calificacion)}
                  </span>
                  <span className="text-sm font-medium">
                    {r.usuario?.nombre ?? "Cliente"}
                  </span>
                </div>
                {r.comentario && (
                  <p className="mt-2 text-plum-ink/70 text-sm">{r.comentario}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
