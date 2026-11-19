import { apiFetch } from '../api/httpClient';
import { Orden, OrdenCompraResponse } from '../../Domain/entities/Orden';
import { completarOrdenes } from './OrdenService';


export const OrdenAdminService = {

  async verTodasLasOrdenes(token: string): Promise<Orden[]> {
    
    const ordenes = await apiFetch<OrdenCompraResponse[]>('/api/ordenes-compra', { token });
    return await completarOrdenes(ordenes, token);
  },

  async cambiarEstado(id: number, estado: string, token: string, comentario?: string): Promise<OrdenCompraResponse> {
    
    const actual = await apiFetch<Record<string, any>>(`/api/ordenes-compra/${id}`, { token });

    const actualizada = await apiFetch<OrdenCompraResponse>(`/api/ordenes-compra/${id}`, {
      method: 'PUT',
      body: { ...actual, estado },
      token,
    });

    
    await apiFetch('/api/historial-estado-orden', {
      method: 'POST',
      body: {
        orden: { id },
        estado,
        comentario: comentario ?? 'Estado actualizado desde la app móvil',
      },
      token,
    });

    return actualizada;
  },
};