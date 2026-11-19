import { apiFetch, obtenerIdUsuarioActual } from '../api/httpClient';
import {
  DetalleOrdenResponse,
  Orden,
  OrdenCompraResponse,
  PagoResponse,
  mapOrden,
} from '../../Domain/entities/Orden';
import { Cupon } from '../../Domain/entities/Cupon';
import { CarritoCompraResponse, DetalleCarritoResponse } from '../../Domain/entities/Carrito';



export type CrearOrdenInput = {
  direccionId: number;
  metodoPago: 'TARJETA' | 'PSE' | 'EFECTIVO' | 'TRANSFERENCIA' | 'NEQUI' | 'DAVIPLATA' | 'NU';
  codigoCupon?: string;
  
  costoEnvio?: number;
};

type Pago = NonNullable<PagoResponse>;

const redondear = (valor: number) => Math.round(valor * 100) / 100;



function pagoDe(ordenId: number, pagos: Pago[]): PagoResponse {
  const deLaOrden = pagos.filter((p) => p.orden?.id === ordenId);
  return deLaOrden.length > 0 ? deLaOrden[deLaOrden.length - 1] : null;
}


export async function completarOrdenes(
  ordenes: OrdenCompraResponse[],
  token: string
): Promise<Orden[]> {

  const [detalles, pagos] = await Promise.all([
    apiFetch<DetalleOrdenResponse[]>('/api/detalle-orden', { token }),
    apiFetch<Pago[]>('/api/pagos', { token }),
  ]);

  return [...ordenes]
    .sort((a, b) => b.id - a.id)
    .map((o) => mapOrden(o, detalles, pagoDe(o.id, pagos)));
}



async function validarCupon(codigo: string, subtotal: number, token: string): Promise<Cupon> {
  const cupones = await apiFetch<Cupon[]>('/api/cupones', { token });
  const cupon = cupones.find((c) => c.codigo.toUpperCase() === codigo.trim().toUpperCase());

  if (!cupon) {
    throw new Error('El cupón no existe.');
  }

  const ahora = new Date();

  if (!cupon.activo || new Date(cupon.fechaInicio) > ahora || new Date(cupon.fechaFin) < ahora) {
    throw new Error('El cupón no está vigente.');
  }

  if (cupon.usoMaximo != null && cupon.usosActuales >= cupon.usoMaximo) {
    throw new Error('El cupón ya alcanzó su límite de usos.');
  }

  if (subtotal < Number(cupon.montoMinimo ?? 0)) {
    throw new Error(`Este cupón requiere una compra mínima de $${cupon.montoMinimo}.`);
  }

  return cupon;
}


function calcularDescuento(cupon: Cupon, subtotal: number): number {
  const descuento = cupon.tipoDescuento === 'PORCENTAJE'
    ? subtotal * (Number(cupon.valor) / 100)
    : Number(cupon.valor);

  return redondear(Math.min(descuento, subtotal));
}


export const OrdenService = {

  async crear(input: CrearOrdenInput, token: string): Promise<Orden> {

 

    const miId = await obtenerIdUsuarioActual();

    // El carrito activo del usuario
    const carritos = await apiFetch<CarritoCompraResponse[]>('/api/carritos-compra', { token });
    const carrito = carritos.find((c) => c.usuario?.id === miId && c.estado === 'ACTIVO');

    if (!carrito) {
      throw new Error('Tu carrito está vacío.');
    }

    const todosLosDetalles = await apiFetch<DetalleCarritoResponse[]>('/api/detalle-carrito', { token });
    const items = todosLosDetalles.filter((d) => d.carrito?.id === carrito.id);

    if (items.length === 0) {
      throw new Error('Tu carrito está vacío.');
    }

   
    const variantes = await Promise.all(
      items.map((d) => apiFetch<Record<string, any>>(`/api/variantes-producto/${d.variante.id}`))
    );

    items.forEach((d, i) => {
      if (d.cantidad > Number(variantes[i].stock ?? 0)) {
        const nombre = d.variante.producto?.nombre ?? 'Un producto';
        throw new Error(`${nombre} (${d.variante.talla}/${d.variante.color}) ya no tiene stock suficiente.`);
      }
    });

    
    const subtotal = redondear(
      items.reduce((sum, d) => sum + Number(d.precioUnitario) * d.cantidad, 0)
    );

    const cupon = input.codigoCupon
      ? await validarCupon(input.codigoCupon, subtotal, token)
      : null;

    const descuento = cupon ? calcularDescuento(cupon, subtotal) : 0;
    const costoEnvio = redondear(input.costoEnvio ?? 0);
    const total = redondear(subtotal - descuento + costoEnvio);

   
    const orden = await apiFetch<OrdenCompraResponse>('/api/ordenes-compra', {
      method: 'POST',
      body: {
        usuario: { id: miId },
        direccion: { id: input.direccionId },
        cupon: cupon ? { id: cupon.id } : null,
        subtotal,
        descuento,
        costoEnvio,
        total,
        estado: 'PENDIENTE',
      },
      token,
    });

  
    for (const d of items) {
      await apiFetch('/api/detalle-orden', {
        method: 'POST',
        body: {
          orden: { id: orden.id },
          variante: { id: d.variante.id },
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: redondear(Number(d.precioUnitario) * d.cantidad),
        },
        token,
      });
    }

    
    for (let i = 0; i < items.length; i++) {
      const variante = variantes[i];

      await apiFetch(`/api/variantes-producto/${variante.id}`, {
        method: 'PUT',
        body: { ...variante, stock: Number(variante.stock) - items[i].cantidad },
        token,
      });
    }

    
    if (total > 0) {
      await apiFetch('/api/pagos', {
        method: 'POST',
        body: {
          orden: { id: orden.id },
          metodoPago: input.metodoPago,
          monto: total,
          estado: 'PENDIENTE',
        },
        token,
      });
    }

   
    await apiFetch('/api/historial-estado-orden', {
      method: 'POST',
      body: {
        orden: { id: orden.id },
        estado: 'PENDIENTE',
        comentario: 'Pedido creado desde la app móvil',
      },
      token,
    });

   
    const carritoActual = await apiFetch<Record<string, any>>(`/api/carritos-compra/${carrito.id}`, { token });

    await apiFetch(`/api/carritos-compra/${carrito.id}`, {
      method: 'PUT',
      body: { ...carritoActual, estado: 'CONVERTIDO' },
      token,
    });

    const ordenGuardada = await apiFetch<OrdenCompraResponse>(`/api/ordenes-compra/${orden.id}`, { token });
    const [completa] = await completarOrdenes([ordenGuardada], token);

    return completa;
  },

  async misOrdenes(token: string): Promise<Orden[]> {
    // [MOVIL] Modificado: el backend devuelve las órdenes de TODOS los usuarios,
    // así que la app se queda solo con las del usuario logueado.
    const [miId, ordenes] = await Promise.all([
      obtenerIdUsuarioActual(),
      apiFetch<OrdenCompraResponse[]>('/api/ordenes-compra', { token }),
    ]);

    const mias = ordenes.filter((o) => o.usuario?.id === miId);

    return await completarOrdenes(mias, token);
  },
};