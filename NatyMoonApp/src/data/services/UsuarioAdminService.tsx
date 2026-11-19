import { apiFetch } from '../api/httpClient';
import { UsuarioAdmin } from '../../Domain/entities/UsuarioAdmin';

export type CrearStaffInput = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  rolNombre: 'ADMIN' | 'EMPLEADO';
};



const NO_DISPONIBLE =
  'Esta opción todavía no está disponible: el servidor no permite hacerlo por ahora.';

export const UsuarioAdminService = {

 
  async listar(token: string): Promise<UsuarioAdmin[]> {
    return await apiFetch<UsuarioAdmin[]>('/api/usuarios', { token });
  },

  async cambiarEstado(id: number, activo: boolean, token: string): Promise<UsuarioAdmin> {
    
    throw new Error(NO_DISPONIBLE);
  },

  
  async eliminar(id: number, token: string): Promise<void> {
    await apiFetch<void>(`/api/usuarios/${id}`, { method: 'DELETE', token });
  },

  async crearStaff(input: CrearStaffInput, token: string): Promise<UsuarioAdmin> {
    
    throw new Error(NO_DISPONIBLE);
  },
};