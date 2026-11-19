import { LoginResponse } from '../../Domain/entities/LoginResponse';
import { AuthRepository } from '../../Domain/repositories/AuthRepository';
import { apiFetch } from '../api/httpClient';


type UsuarioResponse = Omit<LoginResponse, 'token'>;


const aLoginResponse = (usuario: UsuarioResponse): LoginResponse => ({
    ...usuario,
    token: '',
});

export class AuthRepositoryImpl implements AuthRepository {

    async register(
        nombre: string,
        apellido: string,
        email: string,
        password: string,
        telefono?: string
    ): Promise<LoginResponse> {

       
        const usuario = await apiFetch<UsuarioResponse>('/api/auth/register', {
            method: 'POST',
            body: { nombre, apellido, email, password, telefono },
        });

        return aLoginResponse(usuario);
    }

    async login(
        email: string,
        password: string
    ): Promise<LoginResponse> {

      
        const usuario = await apiFetch<UsuarioResponse>('/api/auth/login', {
            method: 'POST',
            body: { email, password },
        });

        return aLoginResponse(usuario);
    }

    
    async me(): Promise<LoginResponse> {
        const usuario = await apiFetch<UsuarioResponse>('/api/auth/me');
        return aLoginResponse(usuario);
    }

   
    async logout(): Promise<void> {
        await apiFetch('/api/auth/logout', { method: 'POST' });
    }
}