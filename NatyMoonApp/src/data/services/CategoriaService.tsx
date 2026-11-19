import { apiFetch } from '../api/httpClient';
import { Categoria } from '../../Domain/entities/Categoria';

export const CategoriaService = {

  async listar(): Promise<Categoria[]> {
    return await apiFetch<Categoria[]>('/api/categorias');
  },

  async crear(nombre: string, descripcion: string, imagen: string, token: string): Promise<Categoria> {
    // [MOVIL] Modificado: se quitó "imagen" del body (ver nota arriba).
    return await apiFetch<Categoria>('/api/categorias', {
      method: 'POST',
      body: { nombre, descripcion, activo: true },
      token,
    });
  },

  async actualizar(
    id: number,
    nombre: string,
    descripcion: string,
    imagen: string,
    token: string
  ): Promise<Categoria> {

    const actual = await apiFetch<Record<string, any>>(`/api/categorias/${id}`);

    return await apiFetch<Categoria>(`/api/categorias/${id}`, {
      method: 'PUT',
      body: { ...actual, nombre, descripcion },
      token,
    });
  },

  async eliminar(id: number, token: string): Promise<void> {
    await apiFetch<void>(`/api/categorias/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};