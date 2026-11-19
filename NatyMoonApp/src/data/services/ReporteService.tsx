import { apiFetch } from '../api/httpClient';
import { DetalleOrdenResponse, OrdenCompraResponse, PagoResponse } from '../../Domain/entities/Orden';

export type ResumenReporte = {
  totalVentas: number;
  totalPedidos: number;
  pedidosPorEstado: Record<string, number>;
  ventasPorMetodoPago: Record<string, number>;
  topProductos: {
    nombreProducto: string;
    cantidadVendida: number;
    ingresos: number;
  }[];
};

type Pago = NonNullable<PagoResponse>;


const CANTIDAD_TOP_PRODUCTOS = 5;

const redondear = (valor: number) => Math.round(valor * 100) / 100;



export const ReporteService = {

  async obtenerResumen(token: string): Promise<ResumenReporte> {

    const [ordenes, pagos, detalles] = await Promise.all([
      apiFetch<OrdenCompraResponse[]>('/api/ordenes-compra', { token }),
      apiFetch<Pago[]>('/api/pagos', { token }),
      apiFetch<DetalleOrdenResponse[]>('/api/detalle-orden', { token }),
    ]);

    
    const idsValidos = new Set(
      ordenes.filter((o) => o.estado !== 'CANCELADO').map((o) => o.id)
    );

    
    const pedidosPorEstado: Record<string, number> = {};
    for (const orden of ordenes) {
      pedidosPorEstado[orden.estado] = (pedidosPorEstado[orden.estado] ?? 0) + 1;
    }

   
    const totalVentas = redondear(
      ordenes
        .filter((o) => idsValidos.has(o.id))
        .reduce((sum, o) => sum + Number(o.total), 0)
    );

   
    const ventasPorMetodoPago: Record<string, number> = {};
    for (const pago of pagos) {
      const cuenta =
        idsValidos.has(pago.orden?.id) &&
        pago.estado !== 'RECHAZADO' &&
        (pago.estado as string) !== 'REEMBOLSADO';

      if (cuenta) {
        ventasPorMetodoPago[pago.metodoPago] = redondear(
          (ventasPorMetodoPago[pago.metodoPago] ?? 0) + Number(pago.monto)
        );
      }
    }

    
    const porProducto: Record<string, { cantidadVendida: number; ingresos: number }> = {};
    for (const detalle of detalles) {
      if (!idsValidos.has(detalle.orden?.id)) continue;

      const nombre = detalle.variante?.producto?.nombre ?? 'Producto';
      const actual = porProducto[nombre] ?? { cantidadVendida: 0, ingresos: 0 };

      porProducto[nombre] = {
        cantidadVendida: actual.cantidadVendida + detalle.cantidad,
        ingresos: redondear(actual.ingresos + Number(detalle.subtotal)),
      };
    }

    const topProductos = Object.entries(porProducto)
      .map(([nombreProducto, datos]) => ({ nombreProducto, ...datos }))
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, CANTIDAD_TOP_PRODUCTOS);

    return {
      totalVentas,
      totalPedidos: ordenes.length,
      pedidosPorEstado,
      ventasPorMetodoPago,
      topProductos,
    };
  },
};