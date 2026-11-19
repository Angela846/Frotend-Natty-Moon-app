import { apiFetch, obtenerIdUsuarioActual } from '../api/httpClient';
import {
  Carrito,
  CarritoCompraResponse,
  DetalleCarritoResponse,
  mapDetalleCarrito,
} from '../../Domain/entities/Carrito';


async function obtenerCarritoActivo(
  token: string,
  crearSiNoExiste: boolean
): Promise<CarritoCompraResponse | null> {

  const [miId, carritos] = await Promise.all([
    obtenerIdUsuarioActual(),
    apiFetch<CarritoCompraResponse[]>('/api/carritos-compra', { token }),
  ]);

  const activo = carritos.find(
    (c) => c.usuario?.id === miId && c.estado === 'ACTIVO'
  );

  if (activo || !crearSiNoExiste) {
    return activo ?? null;
  }

  return await apiFetch<CarritoCompraResponse>('/api/carritos-compra', {
    method: 'POST',
    body: { usuario: { id: miId }, estado: 'ACTIVO' },
    token,
  });
}


async function detallesDelCarrito(
  carritoId: number,
  token: string
): Promise<DetalleCarritoResponse[]> {
  const todos = await apiFetch<DetalleCarritoResponse[]>('/api/detalle-carrito', { token });
  return todos.filter((d) => d.carrito?.id === carritoId);
}


export const CarritoService = {

  async agregar(varianteId: number, cantidad: number, token: string): Promise<void> {

    
    const variante = await apiFetch<Record<string, any>>(`/api/variantes-producto/${varianteId}`);

    
    const producto = variante.producto ?? {};
    const precioUnitario =
      Number(producto.precioOferta ?? producto.precioBase ?? 0) +
      Number(variante.precioAdicional ?? 0);

    
    const carrito = await obtenerCarritoActivo(token, true);
    if (!carrito) {
      throw new Error('No se pudo obtener tu carrito.');
    }

  
    const detalles = await detallesDelCarrito(carrito.id, token);
    const existente = detalles.find((d) => d.variante?.id === varianteId);
    const cantidadTotal = (existente?.cantidad ?? 0) + cantidad;

    if (cantidadTotal > Number(variante.stock ?? 0)) {
      throw new Error(`Solo hay ${variante.stock} disponibles de esta talla y color.`);
    }

    if (existente) {
      await apiFetch(`/api/detalle-carrito/${existente.id}`, {
        method: 'PUT',
        body: {
          carrito: { id: carrito.id },
          variante: { id: varianteId },
          cantidad: cantidadTotal,
          precioUnitario: existente.precioUnitario,
        },
        token,
      });
    } else {
      await apiFetch('/api/detalle-carrito', {
        method: 'POST',
        body: {
          carrito: { id: carrito.id },
          variante: { id: varianteId },
          cantidad,
          precioUnitario,
        },
        token,
      });
    }
  },

  async ver(token: string): Promise<Carrito> {
   
    const carrito = await obtenerCarritoActivo(token, false);

    if (!carrito) {
      return { productos: [], total: 0 };
    }

    const detalles = await detallesDelCarrito(carrito.id, token);
    const productos = detalles.map(mapDetalleCarrito);
    const total = productos.reduce((sum, p) => sum + p.subtotal, 0);
    return { productos, total };
  },

  async actualizarCantidad(idDetalle: number, cantidad: number, token: string): Promise<void> {

    const actual = await apiFetch<DetalleCarritoResponse>(`/api/detalle-carrito/${idDetalle}`, { token });

    await apiFetch(`/api/detalle-carrito/${idDetalle}`, {
      method: 'PUT',
      body: {
        carrito: { id: actual.carrito.id },
        variante: { id: actual.variante.id },
        cantidad,
        precioUnitario: actual.precioUnitario,
      },
      token,
    });
  },

  async eliminarProducto(idDetalle: number, token: string): Promise<void> {
    // [MOVIL] Modificado: ruta del backend /api/detalle-carrito/{id}.
    await apiFetch(`/api/detalle-carrito/${idDetalle}`, { method: 'DELETE', token });
  },

  async vaciar(token: string): Promise<void> {
    const carrito = await obtenerCarritoActivo(token, false);
    if (!carrito) return;

    const detalles = await detallesDelCarrito(carrito.id, token);

    for (const detalle of detalles) {
      await apiFetch(`/api/detalle-carrito/${detalle.id}`, { method: 'DELETE', token });
    }
  },
};