import { apiFetch, obtenerIdUsuarioActual } from '../api/httpClient';
import { DireccionInput, DireccionResponse } from '../../Domain/entities/Direccion';


export const DireccionService = {

  async misDirecciones(token: string): Promise<DireccionResponse[]> {
    
    const [miId, todas] = await Promise.all([
      obtenerIdUsuarioActual(),
      apiFetch<DireccionResponse[]>('/api/direcciones-usuario', { token }),
    ]);

    return todas.filter((d) => d.usuario?.id === miId);
  },

  async crear(input: DireccionInput, token: string): Promise<DireccionResponse> {
   
    const miId = await obtenerIdUsuarioActual();

    return await apiFetch<DireccionResponse>('/api/direcciones-usuario', {
      method: 'POST',
      body: {
        ...input,
        usuario: { id: miId },
        pais: input.pais ?? 'Colombia',
        esPrincipal: input.esPrincipal ?? false,
      },
      token,
    });
  },

  async actualizar(id: number, input: DireccionInput, token: string): Promise<DireccionResponse> {
   
    const actual = await apiFetch<Record<string, any>>(`/api/direcciones-usuario/${id}`, { token });

    return await apiFetch<DireccionResponse>(`/api/direcciones-usuario/${id}`, {
      method: 'PUT',
      body: { ...actual, ...input },
      token,
    });
  },

  async eliminar(id: number, token: string): Promise<void> {
    
    await apiFetch<void>(`/api/direcciones-usuario/${id}`, { method: 'DELETE', token });
  },
};