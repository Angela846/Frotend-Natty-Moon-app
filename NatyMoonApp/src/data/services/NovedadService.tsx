import { apiFetch, obtenerIdUsuarioActual } from '../api/httpClient';
import { CrearNovedadInput, EstadoNovedad, Novedad } from '../../Domain/entities/Novedad';


export const NovedadService = {

  // Cliente
  async misNovedades(token: string): Promise<Novedad[]> {
    
    const [miId, todas] = await Promise.all([
      obtenerIdUsuarioActual(),
      apiFetch<Novedad[]>('/api/novedades', { token }),
    ]);

    return todas.filter((n) => n.usuario?.id === miId);
  },

  
  async crear(input: CrearNovedadInput, token: string): Promise<Novedad> {
    
    const miId = await obtenerIdUsuarioActual();

    return await apiFetch<Novedad>('/api/novedades', {
      method: 'POST',
      body: {
        usuario: { id: miId },
        orden: input.ordenId ? { id: input.ordenId } : null,
        asunto: input.asunto,
        descripcion: input.descripcion,
        estado: 'ABIERTA',
      },
      token,
    });
  },

 
  async listarTodas(token: string): Promise<Novedad[]> {
    return await apiFetch<Novedad[]>('/api/novedades', { token });
  },

 
  async responder(id: number, estado: EstadoNovedad, respuesta: string, token: string): Promise<Novedad> {
   
    const actual = await apiFetch<Record<string, any>>(`/api/novedades/${id}`, { token });

    return await apiFetch<Novedad>(`/api/novedades/${id}`, {
      method: 'PUT',
      body: { ...actual, estado, respuesta },
      token,
    });
  },
};