import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { carritosApi, detalleCarritoApi, variantesApi } from "../api/resources";
import { useAuth } from "./AuthContext";
import { guardarCache, leerCache, borrarCache } from "../utils/cache";

const CartContext = createContext(null);

// El carrito cambia seguido (agregar/quitar), asi que su cache vence rapido:
// solo sirve para que al recargar la pagina se vea al instante mientras se
// confirma con el servidor en segundo plano, no para ahorrarse la sincronizacion.
const TTL_CARRITO_MS = 2 * 60 * 1000; // 2 minutos

// El backend (DTO DetalleCarritoRequest) usa carritoCompraId y varianteProductoId.
// Se aceptan tambien las otras formas por si una respuesta trae el objeto anidado.
const carritoIdDe = (d) => d.carritoCompraId ?? d.carritoId ?? d.carrito?.id;
const varianteIdDe = (d) => d.varianteProductoId ?? d.varianteId ?? d.variante?.id;

export function CartProvider({ children }) {
  const { usuario } = useAuth();
  const [carrito, setCarrito] = useState(null);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  function claveCache(usuarioId) {
    return `carrito:${usuarioId}`;
  }

  // Guarda en localStorage cada vez que cambia el carrito, para que la
  // proxima carga de la pagina lo pueda mostrar sin esperar al backend.
  function guardarEnCache(usuarioId, carritoData, itemsData) {
    if (!usuarioId) return;
    guardarCache(claveCache(usuarioId), { carrito: carritoData, items: itemsData });
  }

  const cargarCarrito = useCallback(
    async (mostrarSpinner = true) => {
      if (!usuario) {
        setCarrito(null);
        setItems([]);
        return;
      }
      if (mostrarSpinner) setCargando(true);
      try {
        const todos = await carritosApi.list();
        // El backend usa "usuarioId" (DTO); por si alguna respuesta trae el
        // objeto "usuario", se aceptan las dos formas.
        let propio = todos.find(
          (c) => (c.usuarioId ?? c.usuario?.id) === usuario.id && c.estado === "ACTIVO"
        );
        if (!propio) {
          propio = await carritosApi.create({
            usuarioId: usuario.id,
            usuario: { id: usuario.id },
            estado: "ACTIVO",
          });
        }
        setCarrito(propio);

        const detalles = await detalleCarritoApi.list();
        const propios = detalles.filter(
          (d) => carritoIdDe(d) === propio.id
        );
        // Si el detalle solo trae "varianteId", se completa con la variante
        // entera (producto, talla, color, stock) para poder mostrarla.
        let itemsDelUsuario = propios;
        if (propios.length > 0) {
          const todasVariantes = await variantesApi.list();
          itemsDelUsuario = propios.map((d) => {
            const vid = varianteIdDe(d);
            const completa = todasVariantes.find((v) => v.id === vid);
            return completa ? { ...d, variante: completa } : d;
          });
        }
        setItems(itemsDelUsuario);
        guardarEnCache(usuario.id, propio, itemsDelUsuario);
      } catch (err) {
        console.error(
          "Error del carrito:",
          err.response?.status,
          err.response?.data ?? err.message
        );
      } finally {
        if (mostrarSpinner) setCargando(false);
      }
    },
    [usuario]
  );

  useEffect(() => {
    if (!usuario) {
      setCarrito(null);
      setItems([]);
      return;
    }

    // 1) Mostrar lo que ya teniamos guardado, al instante, sin esperar red.
    const enCache = leerCache(claveCache(usuario.id), TTL_CARRITO_MS);
    if (enCache) {
      setCarrito(enCache.carrito);
      setItems(enCache.items);
    }

    // 2) Confirmar/actualizar con el backend en segundo plano (sin spinner
    // si ya habia algo en cache, para que no "parpadee" la pantalla).
    cargarCarrito(!enCache);
  }, [usuario, cargarCarrito]);

  async function agregarAlCarrito(variante, cantidad = 1) {
    if (!carrito) return { ok: false, motivo: "No se pudo acceder a tu carrito." };

    // Consultamos el stock real antes de confirmar: el que trae "variante"
    // puede ser de hace un rato (ej. si la pagina de producto lleva abierta
    // un tiempo), y el stock puede haber bajado por otra compra.
    let stockReal;
    try {
      const fresca = await variantesApi.get(variante.id);
      stockReal = fresca.stock;
    } catch {
      stockReal = variante.stock; // si falla la consulta, seguimos con lo que teniamos
    }

    const existente = items.find((i) => varianteIdDe(i) === variante.id);
    const cantidadActualEnCarrito = existente?.cantidad || 0;
    const cantidadDeseada = cantidadActualEnCarrito + cantidad;

    if (cantidadDeseada > stockReal) {
      const disponiblesParaAgregar = Math.max(stockReal - cantidadActualEnCarrito, 0);
      return {
        ok: false,
        stockDisponible: stockReal,
        motivo:
          disponiblesParaAgregar > 0
            ? `Solo puedes agregar ${disponiblesParaAgregar} más de este producto (quedan ${stockReal} en stock).`
            : `Ya tienes en el carrito todo el stock disponible (${stockReal}).`,
      };
    }

    const precioUnitario =
      Number(variante.producto?.precioBase || 0) +
      Number(variante.precioAdicional || 0);

    // Ojo: la respuesta del backend al crear/actualizar el detalle del
    // carrito solo trae el "id" de la variante (asi se mando la peticion),
    // no toda su info (nombre del producto, stock real, etc.) -- Java la
    // rellena con valores por defecto (ej. stock: 0), asi que si usaramos
    // esa respuesta tal cual para mostrarla, saldria sin nombre y con
    // "0 disponibles" aunque sí haya stock. Por eso aca se pisa el campo
    // "variante" de la respuesta con la variante COMPLETA que ya teniamos
    // del lado del cliente (incluye producto, stock actualizado, etc).
    const varianteCompleta = { ...variante, stock: stockReal };

    let nuevosItems;
    if (existente) {
      const actualizado = await detalleCarritoApi.update(existente.id, {
        id: existente.id,
        carritoCompraId: carrito.id,
        varianteProductoId: variante.id,
        cantidad: cantidadDeseada,
        precioUnitario: existente.precioUnitario,
      });
      const itemCompleto = { ...actualizado, variante: varianteCompleta };
      nuevosItems = items.map((i) => (i.id === itemCompleto.id ? itemCompleto : i));
    } else {
      const nuevo = await detalleCarritoApi.create({
        carritoCompraId: carrito.id,
        varianteProductoId: variante.id,
        cantidad,
        precioUnitario,
      });
      const itemCompleto = { ...nuevo, variante: varianteCompleta };
      nuevosItems = [...items, itemCompleto];
    }
    setItems(nuevosItems);
    guardarEnCache(usuario.id, carrito, nuevosItems);
    return { ok: true };
  }

  async function actualizarCantidad(detalleId, cantidad) {
    if (cantidad < 1) return { ok: false };
    const item = items.find((i) => i.id === detalleId);
    if (!item) return { ok: false, motivo: "No encontramos ese producto en tu carrito." };

    // Igual que al agregar: confirmamos el stock real antes de subir la
    // cantidad, para no dejar comprar mas de lo que hay disponible.
    let stockReal;
    try {
      const fresca = await variantesApi.get(varianteIdDe(item));
      stockReal = fresca.stock;
    } catch {
      stockReal = item.variante?.stock ?? Infinity;
    }

    if (cantidad > stockReal) {
      return {
        ok: false,
        stockDisponible: stockReal,
        motivo: `Solo quedan ${stockReal} unidades disponibles de este producto.`,
      };
    }

    const actualizado = await detalleCarritoApi.update(detalleId, {
      id: detalleId,
      carritoCompraId: carrito.id,
      varianteProductoId: varianteIdDe(item),
      cantidad,
      precioUnitario: item.precioUnitario,
    });
    // Mismo motivo que en agregarAlCarrito: la respuesta del backend trae
    // la variante "pelada" (solo id), asi que se preserva la variante
    // completa que ya teniamos, actualizando su stock con el valor fresco
    // que se acaba de consultar arriba.
    const itemCompleto = {
      ...actualizado,
      variante: { ...item.variante, stock: stockReal },
    };
    const nuevosItems = items.map((i) => (i.id === detalleId ? itemCompleto : i));
    setItems(nuevosItems);
    guardarEnCache(usuario.id, carrito, nuevosItems);
    return { ok: true };
  }

  async function eliminarDelCarrito(detalleId) {
    await detalleCarritoApi.remove(detalleId);
    const nuevosItems = items.filter((i) => i.id !== detalleId);
    setItems(nuevosItems);
    guardarEnCache(usuario.id, carrito, nuevosItems);
  }

  async function vaciarCarritoLocal() {
    setItems([]);
    if (usuario) {
      guardarEnCache(usuario.id, carrito, []);
      borrarCache(claveCache(usuario.id));
    }
  }

  const total = items.reduce(
    (acc, item) => acc + Number(item.precioUnitario) * item.cantidad,
    0
  );
  const cantidadTotal = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        carrito,
        items,
        cargando,
        total,
        cantidadTotal,
        agregarAlCarrito,
        actualizarCantidad,
        eliminarDelCarrito,
        recargar: cargarCarrito,
        vaciarCarritoLocal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}