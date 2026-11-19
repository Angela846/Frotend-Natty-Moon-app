import { LoginResponse } from '../entities/LoginResponse';

export interface AuthRepository {
    register(
        nombre: string,
        apellido: string,
        email: string,
        password: string,
        telefono?: string
    ): Promise<LoginResponse>;

    login(
        email: string,
        password: string
    ): Promise<LoginResponse>;

    // Usuario de la sesión actual (según la cookie del backend)
    me(): Promise<LoginResponse>;

    // Cierra la sesión en el servidor (borra la cookie)
    logout(): Promise<void>;
}
