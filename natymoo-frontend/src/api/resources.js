import api from "./client";

export function createResource(path) {
  return {
    list: () => api.get(path).then((r) => r.data),
    get: (id) => api.get(`${path}/${id}`).then((r) => r.data),
    create: (data) => api.post(path, data).then((r) => r.data),
    update: (id, data) => api.put(`${path}/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`${path}/${id}`).then((r) => r.data),
  };
}

export const productosApi = createResource("/productos");
export const categoriasApi = createResource("/categorias");
export const variantesApi = createResource("/variantes-producto");
export const imagenesApi = createResource("/imagenes-producto");
export const carritosApi = createResource("/carritos-compra");
export const detalleCarritoApi = createResource("/detalle-carrito");
export const cuponesApi = createResource("/cupones");
export const ordenesApi = createResource("/ordenes-compra");
export const detalleOrdenApi = createResource("/detalle-orden");
export const historialOrdenApi = createResource("/historial-estado-orden");
export const pagosApi = createResource("/pagos");
export const resenasApi = createResource("/resenas-producto");
export const listaDeseosApi = createResource("/lista-deseos");
export const direccionesApi = createResource("/direcciones-usuario");
export const rolesApi = createResource("/roles");
export const usuariosApi = createResource("/usuarios");
export const novedadesApi = createResource("/novedades");
