
export interface LoginResponse {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    rol: string;
    activo: boolean;
 
   
    token: string;
}