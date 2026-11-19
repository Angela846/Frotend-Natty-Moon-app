import { apiFetch } from '../api/httpClient';
import { Cupon, CuponInput } from '../../Domain/entities/Cupon';

const estaVigente = (cupon: Cupon): boolean => {
  const ahora = new Date();

  return (
    cupon.activo &&
    new Date(cupon.fechaInicio) <= ahora &&
    new Date(cupon.fechaFin) >= ahora &&
    (cupon.usoMaximo == null || cupon.usosActuales < cupon.usoMaximo)
  );
};

export const CuponService = {

  // Cualquier autenticado
  async listarActivos(token: string): Promise<Cupon[]> {
 
    const todos = await apiFetch<Cupon[]>('/api/cupones', { token });
    return todos.filter(estaVigente);
  },

  async listarTodos(token: string): Promise<Cupon[]> {
    return await apiFetch<Cupon[]>('/api/cupones', { token });
  },

  
  async crear(input: CuponInput, token: string): Promise<Cupon> {
    return await apiFetch<Cupon>('/api/cupones', {
      method: 'POST',
      body: input,
      token,
    });
  },

  async actualizar(id: number, input: CuponInput, token: string): Promise<Cupon> {
    
    const actual = await apiFetch<Record<string, any>>(`/api/cupones/${id}`, { token });

    return await apiFetch<Cupon>(`/api/cupones/${id}`, {
      method: 'PUT',
      body: { ...actual, ...input },
      token,
    });
  },
  async eliminar(id: number, token: string): Promise<void> {
    await apiFetch<void>(`/api/cupones/${id}`, { method: 'DELETE', token });
  },
};