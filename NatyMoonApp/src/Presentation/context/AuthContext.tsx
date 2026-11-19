import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

import { LoginResponse } from '../../Domain/entities/LoginResponse';
import { LoginAuthUseCase } from '../../Domain/UseCases/auth/LoginAuth';
import { RegisterAuthUseCase } from '../../Domain/UseCases/auth/RegisterAuth';
import { AuthRepositoryImpl } from '../../data/repositories/AuthRepositoryImpl';
import { setUnauthorizedHandler } from '../../data/api/httpClient';


export type Rol = 'ADMIN' | 'EMPLEADO' | 'USER';

type AuthContextType = {
  user: LoginResponse | null;
  isLoadingSession: boolean;

 
  isStaff: boolean;

  
  isAdmin: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (
    nombre: string,
    apellido: string,
    email: string,
    password: string,
    telefono?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

const authRepository = new AuthRepositoryImpl();
const loginUseCase = new LoginAuthUseCase(authRepository);
const registerUseCase = new RegisterAuthUseCase(authRepository);



export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {

  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);


  
  useEffect(() => {
    (async () => {
      try {
        const actual = await authRepository.me();
        setUser(actual);
      } catch {
        setUser(null);
      } finally {
        setIsLoadingSession(false);
      }
    })();
  }, []);



  const login = async (email: string, password: string) => {
    const result = await loginUseCase.execute(email, password);
    setUser(result);
  };


 

  const register = async (
    nombre: string,
    apellido: string,
    email: string,
    password: string,
    telefono?: string
  ) => {
    const result = await registerUseCase.execute(
      nombre,
      apellido,
      email,
      password,
      telefono
    );

    setUser(result);
  };


  
  const logout = useCallback(async () => {
    try {
      await authRepository.logout();
    } catch (error) {
      if (__DEV__) console.log('No se pudo cerrar la sesión en el servidor:', error);
    }
    setUser(null);
  }, []);


  
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    return () => setUnauthorizedHandler(null);
  }, [logout]);


  const isStaff =
    user?.rol === 'ADMIN' || user?.rol === 'EMPLEADO';

  const isAdmin =
    user?.rol === 'ADMIN';


  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingSession,
        isStaff,
        isAdmin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};




export const useAuth = () => {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    );
  }

  return context;
};