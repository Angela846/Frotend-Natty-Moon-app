import { useEffect, useState } from "react";
import { productosApi, categoriasApi, variantesApi, imagenesApi } from "../../api/resources";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import FieldError from "../../components/FieldError";
import Modal from "../../components/Modal";
import { requerido, numeroPositivo, numeroNoNegativo, soloNoNegativo, extraerMensajeError, validarFormulario, tieneErrores } from "../../utils/validation";
import { useToast } from "../../context/ToastContext";

const GENEROS = ["HOMBRE", "MUJER", "UNISEX", "NINO", "NINA"];
const VACIO = {
  nombre: "",
  descripcion: "",
  categoria: "",
  precioBase: "",
  precioOferta: "",
  genero: "MUJER",
  material: "",
  activo: true,
};

const VARIANTE_VACIA = () => ({ sku: "", talla: "", color: "", stock: "" });
const IMAGEN_VACIA = () => ({ url: "" });

export default function AdminProducts() {
  const { mostrarToast } = useToast();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState(VACIO);
  const [erroresForm, setErroresForm] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [expandidoId, setExpandidoId] = useState(null);
  const [tabExpandida, setTabExpandida] = useState("variantes");
  const [nuevaVariante, setNuevaVariante] = useState({ talla: "", color: "", stock: 0, sku: "" });
  const [nuevaImagenUrl, setNuevaImagenUrl] = useState("");

  // Filas del formulario de creacion: variantes (talla/color/stock/sku) e
  // imagenes (url), para dejar todo listo de una sola vez al crear el
  // producto, sin tener que entrar despues a "Variantes / imágenes".
  const [variantesForm, setVariantesForm] = useState([VARIANTE_VACIA()]);
  const [imagenesForm, setImagenesForm] = useState([IMAGEN_VACIA()]);
  const [erroresVariantes, setErroresVariantes] = useState({});

  function cargarTodo() {
    setCargando(true);
    return Promise.all([productosApi.list(), categoriasApi.list(), variantesApi.list(), imagenesApi.list()])
      .then(([p, c, v, img]) => {
        setProductos(p);
        setCategorias(c);
        setVariantes(v);
        setImagenes(img);
      })
      .catch(() => setError("No pudimos cargar el catálogo."))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    void cargarTodo();
  }, []);

  function resetForm() {
    setForm(VACIO);
    setErroresForm({});
    setEditandoId(null);
    setVariantesForm([VARIANTE_VACIA()]);
    setImagenesForm([IMAGEN_VACIA()]);
    setErroresVariantes({});
    setModalAbierto(false);
  }

  function handleAbrirNuevo() {
    setForm(VACIO);
    setErroresForm({});
    setEditandoId(null);
    setVariantesForm([VARIANTE_VACIA()]);
    setImagenesForm([IMAGEN_VACIA()]);
    setErroresVariantes({});
    setModalAbierto(true);
  }

  // ---------- Filas de variantes dentro del formulario de creacion ----------
  function actualizarFilaVariante(index, campo, valor) {
    setVariantesForm((prev) => prev.map((v, i) => (i === index ? { ...v, [campo]: valor } : v)));
  }
  function agregarFilaVariante() {
    setVariantesForm((prev) => [...prev, VARIANTE_VACIA()]);
  }
  function quitarFilaVariante(index) {
    setVariantesForm((prev) => prev.filter((_, i) => i !== index));
  }

  // ---------- Filas de imagenes dentro del formulario de creacion ----------
  function actualizarFilaImagen(index, valor) {
    setImagenesForm((prev) => prev.map((img, i) => (i === index ? { url: valor } : img)));
  }
  function agregarFilaImagen() {
    setImagenesForm((prev) => [...prev, IMAGEN_VACIA()]);
  }
  function quitarFilaImagen(index) {
    setImagenesForm((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const nuevosErrores = validarFormulario(form, {
      nombre: [(v) => requerido(v, "El nombre")],
      categoria: [(v) => requerido(v, "La categoría")],
      precioBase: [(v) => numeroPositivo(v, "El precio base")],
      precioOferta: [(v) => (v === "" ? null : numeroPositivo(v, "El precio de oferta"))],
    });
    setErroresForm(nuevosErrores);

    // Al crear (no al editar) exigimos al menos una variante completa: un
    // producto sin ninguna combinacion de talla/color no se puede comprar.
    let erroresVariantesNuevos = {};
    let variantesValidas = [];
    if (!editandoId) {
      const filasConAlgo = variantesForm.filter(
        (v) => v.sku || v.talla || v.color || v.stock !== ""
      );
      if (filasConAlgo.length === 0) {
        erroresVariantesNuevos.general = "Agrega al menos una variante (talla, color y stock).";
      } else {
        filasConAlgo.forEach((v, i) => {
          if (!v.sku || !v.talla || !v.color || v.stock === "") {
            erroresVariantesNuevos[i] = "Completa SKU, talla, color y stock en esta fila.";
          } else if (Number(v.stock) < 0) {
            erroresVariantesNuevos[i] = "El stock no puede ser negativo.";
          } else if (variantes.some((existente) => existente.sku === v.sku)) {
            erroresVariantesNuevos[i] = `El SKU "${v.sku}" ya existe en otro producto. Usa uno distinto.`;
          }
        });
        if (Object.keys(erroresVariantesNuevos).length === 0) {
          variantesValidas = filasConAlgo;
        }
      }
    }
    setErroresVariantes(erroresVariantesNuevos);

    if (tieneErrores(nuevosErrores) || Object.keys(erroresVariantesNuevos).length > 0) return;

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      categoria: { id: Number(form.categoria) },
      precioBase: Number(form.precioBase),
      precioOferta: form.precioOferta ? Number(form.precioOferta) : null,
      genero: form.genero,
      material: form.material,
      activo: editandoId ? form.activo : true,
    };

    setGuardando(true);
    try {
      if (editandoId) {
        const actualizado = await productosApi.update(editandoId, payload);
        setProductos((prev) => prev.map((p) => (p.id === editandoId ? actualizado : p)));
        mostrarToast(`"${actualizado.nombre}" se actualizó correctamente.`, "exito");
        resetForm();
      } else {
        // 1) Crear el producto primero. Si esto falla, no se creó nada.
        const creado = await productosApi.create(payload);
        setProductos((prev) => [...prev, creado]);

        // 2) Crear variantes e imagenes. Si algo de esto falla (ej. un SKU
        // repetido), el producto YA existe -no reintentar creandolo de nuevo-
        // asi que avisamos claramente qué se guardó y qué no.
        try {
          const variantesCreadas = await Promise.all(
            variantesValidas.map((v) =>
              variantesApi.create({
                producto: { id: creado.id },
                sku: v.sku,
                talla: v.talla,
                color: v.color,
                stock: Number(v.stock),
                precioAdicional: 0,
                activo: true,
              })
            )
          );
          setVariantes((prev) => [...prev, ...variantesCreadas]);

          const imagenesConUrl = imagenesForm.filter((img) => img.url.trim());
          const imagenesCreadas = await Promise.all(
            imagenesConUrl.map((img, i) =>
              imagenesApi.create({
                producto: { id: creado.id },
                url: img.url.trim(),
                orden: i,
                esPrincipal: i === 0,
              })
            )
          );
          setImagenes((prev) => [...prev, ...imagenesCreadas]);

          const detalle = [
            variantesCreadas.length > 0 ? `${variantesCreadas.length} variante(s)` : null,
            imagenesCreadas.length > 0 ? `${imagenesCreadas.length} imagen(es)` : null,
          ]
            .filter(Boolean)
            .join(" y ");
          mostrarToast(
            `"${creado.nombre}" se creó correctamente${detalle ? ` con ${detalle}` : ""}.`,
            "exito"
          );
          resetForm();
        } catch (errVariante) {
          // El producto SI se creó. Avisamos y dejamos que termine de
          // agregar las variantes/imagenes desde el panel del producto.
          const motivo = extraerMensajeError(errVariante, "motivo desconocido");
          mostrarToast(
            `"${creado.nombre}" se creó, pero no se pudieron guardar todas las variantes/imágenes (${motivo}). Agrégalas desde "Variantes / imágenes".`,
            "error"
          );
          resetForm();
        }
      }
    } catch (err) {
      const mensajeBackend = extraerMensajeError(err, null);
      setError(mensajeBackend || "No pudimos guardar el producto. Revisa los datos del formulario.");
      mostrarToast(mensajeBackend || "No se pudo guardar el producto.", "error");
    } finally {
      setGuardando(false);
    }
  }

  function handleEditar(producto) {
    setEditandoId(producto.id);
    setErroresForm({});
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      categoria: producto.categoria?.id || "",
      precioBase: producto.precioBase,
      precioOferta: producto.precioOferta || "",
      genero: producto.genero || "MUJER",
      material: producto.material || "",
      activo: producto.activo !== false,
    });
    setModalAbierto(true);
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este producto? Esto también borrará sus variantes.")) return;
    const producto = productos.find((p) => p.id === id);
    try {
      await productosApi.remove(id);
      setProductos((prev) => prev.filter((p) => p.id !== id));
      mostrarToast(`"${producto?.nombre || "Producto"}" se eliminó correctamente.`, "exito");
    } catch {
      setError("No se pudo eliminar. Puede tener órdenes asociadas.");
      mostrarToast("No se pudo eliminar el producto.", "error");
    }
  }

  async function handleToggleActivo(producto) {
    try {
      const actualizado = await productosApi.update(producto.id, {
        ...producto,
        activo: !producto.activo,
      });
      setProductos((prev) => prev.map((p) => (p.id === producto.id ? actualizado : p)));
      mostrarToast(
        `"${actualizado.nombre}" ahora está ${actualizado.activo ? "activo" : "inactivo"}.`,
        "info"
      );
    } catch {
      setError("No se pudo cambiar el estado del producto.");
      mostrarToast("No se pudo cambiar el estado del producto.", "error");
    }
  }

  function stockTotal(productoId) {
    return variantes
      .filter((v) => v.producto?.id === productoId)
      .reduce((acc, v) => acc + v.stock, 0);
  }

  async function handleCrearVariante(productoId) {
    if (!nuevaVariante.talla || !nuevaVariante.color || !nuevaVariante.sku) return;

    if (Number(nuevaVariante.stock) < 0) {
      mostrarToast("El stock no puede ser negativo.", "error");
      return;
    }

    if (variantes.some((v) => v.sku === nuevaVariante.sku)) {
      mostrarToast(`El SKU "${nuevaVariante.sku}" ya existe en otro producto. Usa uno distinto.`, "error");
      return;
    }

    try {
      const creada = await variantesApi.create({
        producto: { id: productoId },
        sku: nuevaVariante.sku,
        talla: nuevaVariante.talla,
        color: nuevaVariante.color,
        stock: Number(nuevaVariante.stock),
        precioAdicional: 0,
        activo: true,
      });
      setVariantes((prev) => [...prev, creada]);
      setNuevaVariante({ talla: "", color: "", stock: 0, sku: "" });
      mostrarToast("Variante agregada.", "exito");
    } catch (err) {
      mostrarToast(extraerMensajeError(err, "No se pudo agregar la variante."), "error");
    }
  }

  async function handleActualizarStock(varianteId, stock) {
    const v = variantes.find((v) => v.id === varianteId);
    const stockSeguro = Math.max(0, Number(stock) || 0);
    try {
      const actualizada = await variantesApi.update(varianteId, { ...v, stock: stockSeguro });
      setVariantes((prev) => prev.map((x) => (x.id === varianteId ? actualizada : x)));
    } catch (err) {
      mostrarToast(extraerMensajeError(err, "No se pudo actualizar el stock."), "error");
    }
  }

  async function handleEliminarVariante(id) {
    try {
      await variantesApi.remove(id);
      setVariantes((prev) => prev.filter((v) => v.id !== id));
      mostrarToast("Variante eliminada.", "info");
    } catch (err) {
      mostrarToast(extraerMensajeError(err, "No se pudo eliminar la variante."), "error");
    }
  }

  async function handleAgregarImagen(productoId) {
    if (!nuevaImagenUrl.trim()) return;
    const imagenesDelProducto = imagenes.filter((i) => i.producto?.id === productoId);
    try {
      const creada = await imagenesApi.create({
        producto: { id: productoId },
        url: nuevaImagenUrl.trim(),
        orden: imagenesDelProducto.length,
        esPrincipal: imagenesDelProducto.length === 0,
      });
      setImagenes((prev) => [...prev, creada]);
      setNuevaImagenUrl("");
      mostrarToast("Imagen agregada.", "exito");
    } catch (err) {
      mostrarToast(extraerMensajeError(err, "No se pudo agregar la imagen."), "error");
    }
  }

  async function handleMarcarPrincipal(imagen) {
    const otras = imagenes.filter(
      (i) => i.producto?.id === imagen.producto?.id && i.id !== imagen.id && i.esPrincipal
    );
    try {
      await Promise.all(otras.map((i) => imagenesApi.update(i.id, { ...i, esPrincipal: false })));
      const actualizada = await imagenesApi.update(imagen.id, { ...imagen, esPrincipal: true });
      setImagenes((prev) =>
        prev.map((i) => {
          if (i.id === actualizada.id) return actualizada;
          if (otras.some((o) => o.id === i.id)) return { ...i, esPrincipal: false };
          return i;
        })
      );
    } catch (err) {
      mostrarToast(extraerMensajeError(err, "No se pudo marcar como principal."), "error");
    }
  }

  async function handleEliminarImagen(id) {
    try {
      await imagenesApi.remove(id);
      setImagenes((prev) => prev.filter((i) => i.id !== id));
      mostrarToast("Imagen eliminada.", "info");
    } catch (err) {
      mostrarToast(extraerMensajeError(err, "No se pudo eliminar la imagen."), "error");
    }
  }

  if (cargando) return <Loader texto="Cargando productos..." />;

  return (
    <div>
      <Modal
        abierto={modalAbierto}
        onCerrar={resetForm}
        titulo={editandoId ? "Editar producto" : "Nuevo producto"}
      >
      <form onSubmit={handleSubmit}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <input
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
            <FieldError mensaje={erroresForm.nombre} />
          </div>
          <div>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            >
              <option value="">Selecciona categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <FieldError mensaje={erroresForm.categoria} />
          </div>
          <div>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio base"
              value={form.precioBase}
              onChange={(e) => setForm({ ...form, precioBase: soloNoNegativo(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
            <FieldError mensaje={erroresForm.precioBase} />
          </div>
          <div>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio oferta (opcional)"
              value={form.precioOferta}
              onChange={(e) => setForm({ ...form, precioOferta: soloNoNegativo(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
            <FieldError mensaje={erroresForm.precioOferta} />
          </div>
          <select
            value={form.genero}
            onChange={(e) => setForm({ ...form, genero: e.target.value })}
            className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          >
            {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input
            placeholder="Material"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          />
        </div>
        <textarea
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          className="w-full mt-4 px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
          rows={3}
        />

        {editandoId && (
          <label className="flex items-center gap-2 mt-4 text-sm">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Producto activo (visible en la tienda)
          </label>
        )}

        {/* Variantes e imagenes solo al crear: al editar se gestionan desde
            "Variantes / imágenes" en la tarjeta del producto ya creado. */}
        {!editandoId && (
          <>
            <div className="mt-6 pt-6 border-t border-plum/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Variantes (talla, color, stock)</h3>
                <button
                  type="button"
                  onClick={agregarFilaVariante}
                  className="text-sm text-plum font-medium hover:text-rose"
                >
                  + Agregar otra variante
                </button>
              </div>
              <div className="space-y-2">
                {variantesForm.map((v, i) => (
                  <div key={i}>
                    <div className="flex gap-2 flex-wrap items-center">
                      <input
                        placeholder="SKU"
                        value={v.sku}
                        onChange={(e) => actualizarFilaVariante(i, "sku", e.target.value)}
                        className="w-28 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      <input
                        placeholder="Talla"
                        value={v.talla}
                        onChange={(e) => actualizarFilaVariante(i, "talla", e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      <input
                        placeholder="Color"
                        value={v.color}
                        onChange={(e) => actualizarFilaVariante(i, "color", e.target.value)}
                        className="w-28 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Stock"
                        value={v.stock}
                        onChange={(e) => actualizarFilaVariante(i, "stock", soloNoNegativo(e.target.value))}
                        className="w-24 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      {variantesForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => quitarFilaVariante(i)}
                          className="text-plum-ink/40 hover:text-rose px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <FieldError mensaje={erroresVariantes[i]} />
                  </div>
                ))}
                <FieldError mensaje={erroresVariantes.general} />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-plum/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Imágenes (URL)</h3>
                <button
                  type="button"
                  onClick={agregarFilaImagen}
                  className="text-sm text-plum font-medium hover:text-rose"
                >
                  + Agregar otra imagen
                </button>
              </div>
              <div className="space-y-2">
                {imagenesForm.map((img, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="https://..."
                      value={img.url}
                      onChange={(e) => actualizarFilaImagen(i, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-plum/20 text-sm"
                    />
                    {i === 0 && img.url && (
                      <span className="text-xs text-plum-ink/40 whitespace-nowrap">Principal</span>
                    )}
                    {imagenesForm.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarFilaImagen(i)}
                        className="text-plum-ink/40 hover:text-rose px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-plum-ink/40 mt-2">
                Opcional. Si no pones ninguna, se muestra el placeholder de la marca.
              </p>
            </div>
          </>
        )}

        <ErrorMessage mensaje={error} />

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={guardando}
            className="px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium disabled:opacity-50"
          >
            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear producto"}
          </button>
          <button type="button" onClick={resetForm} className="px-5 py-2 rounded-full border border-plum/20 text-sm">
            Cancelar
          </button>
        </div>
      </form>
      </Modal>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Productos</h2>
        <button
          onClick={handleAbrirNuevo}
          className="px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium hover:bg-plum-dark transition-colors"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="space-y-3">
        {productos.map((producto) => (
          <div key={producto.id} className="border border-plum/10 rounded-2xl bg-white/40 overflow-hidden">
            <div className="flex items-center justify-between p-4 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{producto.nombre}</p>
                  <button
                    onClick={() => handleToggleActivo(producto)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                      producto.activo !== false
                        ? "bg-sage/20 text-sage"
                        : "bg-plum-ink/10 text-plum-ink/50"
                    }`}
                  >
                    {producto.activo !== false ? "Activo" : "Inactivo"}
                  </button>
                  {stockTotal(producto.id) === 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose/15 text-rose font-medium">
                      Agotado
                    </span>
                  )}
                  {stockTotal(producto.id) > 0 && stockTotal(producto.id) <= 5 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose/10 text-rose font-medium">
                      Stock bajo ({stockTotal(producto.id)})
                    </span>
                  )}
                </div>
                <p className="text-sm text-plum-ink/50">
                  {producto.categoria?.nombre} · ${Number(producto.precioBase).toLocaleString("es-CO")}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => {
                    setExpandidoId(expandidoId === producto.id ? null : producto.id);
                    setTabExpandida("variantes");
                  }}
                  className="px-3 py-1.5 rounded-full border border-plum/20 hover:bg-plum hover:text-blush transition-colors"
                >
                  Variantes / imágenes
                </button>
                <button onClick={() => handleEditar(producto)} className="px-3 py-1.5 rounded-full border border-plum/20 hover:bg-plum hover:text-blush transition-colors">
                  Editar
                </button>
                <button onClick={() => handleEliminar(producto.id)} className="px-3 py-1.5 rounded-full border border-rose/30 text-rose hover:bg-rose hover:text-white transition-colors">
                  Eliminar
                </button>
              </div>
            </div>

            {expandidoId === producto.id && (
              <div className="border-t border-plum/10 p-4 bg-blush-soft/50">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setTabExpandida("variantes")}
                    className={`px-3 py-1 rounded-full text-sm ${tabExpandida === "variantes" ? "bg-plum text-blush" : "text-plum-ink/50"}`}
                  >
                    Variantes
                  </button>
                  <button
                    onClick={() => setTabExpandida("imagenes")}
                    className={`px-3 py-1 rounded-full text-sm ${tabExpandida === "imagenes" ? "bg-plum text-blush" : "text-plum-ink/50"}`}
                  >
                    Imágenes
                  </button>
                </div>

                {tabExpandida === "variantes" ? (
                  <>
                    <p className="text-sm font-medium mb-3">Variantes (talla / color / stock)</p>
                    <div className="space-y-2 mb-4">
                      {variantes.filter((v) => v.producto?.id === producto.id).map((v) => (
                        <div key={v.id} className="flex items-center gap-3 text-sm bg-white/60 rounded-lg px-3 py-2">
                          <span className="w-16">{v.talla}</span>
                          <span className="flex-1">{v.color}</span>
                          <span className="text-plum-ink/40">{v.sku}</span>
                          <input
                            type="number"
                            min="0"
                            defaultValue={v.stock}
                            onBlur={(e) => handleActualizarStock(v.id, e.target.value)}
                            className="w-20 px-2 py-1 rounded border border-plum/20"
                          />
                          <button onClick={() => handleEliminarVariante(v.id)} className="text-plum-ink/40 hover:text-rose">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        placeholder="SKU"
                        value={nuevaVariante.sku}
                        onChange={(e) => setNuevaVariante({ ...nuevaVariante, sku: e.target.value })}
                        className="w-28 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      <input
                        placeholder="Talla"
                        value={nuevaVariante.talla}
                        onChange={(e) => setNuevaVariante({ ...nuevaVariante, talla: e.target.value })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      <input
                        placeholder="Color"
                        value={nuevaVariante.color}
                        onChange={(e) => setNuevaVariante({ ...nuevaVariante, color: e.target.value })}
                        className="w-28 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Stock"
                        value={nuevaVariante.stock}
                        onChange={(e) => setNuevaVariante({ ...nuevaVariante, stock: soloNoNegativo(e.target.value) })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      <button
                        onClick={() => handleCrearVariante(producto.id)}
                        className="px-4 py-1.5 rounded-full bg-plum text-blush text-sm font-medium"
                      >
                        Agregar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-3">Imágenes del producto (URL)</p>
                    <div className="space-y-2 mb-4">
                      {imagenes.filter((i) => i.producto?.id === producto.id).map((img) => (
                        <div key={img.id} className="flex items-center gap-3 text-sm bg-white/60 rounded-lg px-3 py-2">
                          <span className="flex-1 truncate">{img.url}</span>
                          <button
                            onClick={() => handleMarcarPrincipal(img)}
                            className={`px-2 py-1 rounded-full text-xs border ${
                              img.esPrincipal ? "bg-rose text-white border-rose" : "border-plum/20 text-plum-ink/50"
                            }`}
                          >
                            {img.esPrincipal ? "Principal" : "Marcar principal"}
                          </button>
                          <button onClick={() => handleEliminarImagen(img.id)} className="text-plum-ink/40 hover:text-rose">
                            ✕
                          </button>
                        </div>
                      ))}
                      {imagenes.filter((i) => i.producto?.id === producto.id).length === 0 && (
                        <p className="text-sm text-plum-ink/40">Sin imágenes todavía. Se usa el placeholder de marca.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="https://..."
                        value={nuevaImagenUrl}
                        onChange={(e) => setNuevaImagenUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-plum/20 text-sm"
                      />
                      <button
                        onClick={() => handleAgregarImagen(producto.id)}
                        className="px-4 py-1.5 rounded-full bg-plum text-blush text-sm font-medium"
                      >
                        Agregar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
