import { apiFetch } from '../api/httpClient';
import { ImagenProductoResponse } from '../../Domain/entities/ImagenProducto';

import {
  Product,
  ProductoInput,
  ProductoResponse,
  VarianteProductoInput,
  VarianteProductoResponse,
  mapProducto,
} from '../../Domain/entities/Producto';


const MAX_LARGO_URL_IMAGEN = 500;


async function cargarTodoElCatalogo(): Promise<{
  productos: ProductoResponse[];
  variantes: VarianteProductoResponse[];
  imagenes: ImagenProductoResponse[];
}> {
  const [productos, variantes, imagenes] = await Promise.all([
    apiFetch<ProductoResponse[]>('/api/productos'),
    apiFetch<VarianteProductoResponse[]>('/api/variantes-producto'),
    apiFetch<ImagenProductoResponse[]>('/api/imagenes-producto'),
  ]);

  return { productos, variantes, imagenes };
}

function imagenPrincipalDe(
  productoId: number,
  imagenes: ImagenProductoResponse[]
): string {
  const delProducto = imagenes.filter((img) => img.producto.id === productoId);
  const principal = delProducto.find((img) => img.esPrincipal) ?? delProducto[0];
  return principal?.url ?? '';
}

export const ProductoService = {

  // Pública
  async listar(): Promise<Product[]> {
    const { productos, variantes, imagenes } = await cargarTodoElCatalogo();

    return productos
      .filter((p) => p.activo)
      .map((p) => mapProducto(p, variantes, imagenPrincipalDe(p.id, imagenes)));
  },

  async buscarPorId(id: number): Promise<Product> {
    const [producto, variantes, imagenes] = await Promise.all([
      apiFetch<ProductoResponse>(`/api/productos/${id}`),
      apiFetch<VarianteProductoResponse[]>('/api/variantes-producto'),
      apiFetch<ImagenProductoResponse[]>('/api/imagenes-producto'),
    ]);

    return mapProducto(producto, variantes, imagenPrincipalDe(id, imagenes));
  },

  // ADMIN
  async crear(input: ProductoInput, token: string): Promise<ProductoResponse> {
    return await apiFetch<ProductoResponse>('/api/productos', {
      method: 'POST',
      body: input,
      token,
    });
  },

  async actualizar(id: number, input: ProductoInput, token: string): Promise<ProductoResponse> {
    
    const actual = await apiFetch<Record<string, any>>(`/api/productos/${id}`);

    return await apiFetch<ProductoResponse>(`/api/productos/${id}`, {
      method: 'PUT',
      body: { ...actual, ...input },
      token,
    });
  },

  async eliminar(id: number, token: string): Promise<void> {
    await apiFetch<void>(`/api/productos/${id}`, { method: 'DELETE', token });
  },


  async crearVariante(input: VarianteProductoInput, token: string): Promise<VarianteProductoResponse> {
    return await apiFetch<VarianteProductoResponse>('/api/variantes-producto', {
      method: 'POST',
      body: input,
      token,
    });
  },

  async actualizarVariante(
    id: number,
    input: VarianteProductoInput,
    token: string
  ): Promise<VarianteProductoResponse> {
    return await apiFetch<VarianteProductoResponse>(`/api/variantes-producto/${id}`, {
      method: 'PUT',
      body: input,
      token,
    });
  },

  async eliminarVariante(id: number, token: string): Promise<void> {
    await apiFetch<void>(`/api/variantes-producto/${id}`, { method: 'DELETE', token });
  },



  async fijarImagen(productoId: number, url: string, token: string): Promise<void> {

    // La columna url es VARCHAR(500): una foto en base64 no cabe.
    if (url.length > 500) {
      throw new Error(
        'El producto se guardó, pero la foto es muy pesada para el servidor. Usa una URL de imagen (https://...).'
      );
    }

    const imagenes = await apiFetch<ImagenProductoResponse[]>('/api/imagenes-producto');
    const existente = imagenes.find((img) => img.producto.id === productoId);

    if (existente) {
     
      await apiFetch(`/api/imagenes-producto/${existente.id}`, {
        method: 'PUT',
        body: { ...existente, producto: { id: productoId }, url, esPrincipal: true, orden: 1 },
        token,
      });
    } else {
      await apiFetch('/api/imagenes-producto', {
        method: 'POST',
        body: { producto: { id: productoId }, url, esPrincipal: true, orden: 1 },
        token,
      });
    }
  },
};