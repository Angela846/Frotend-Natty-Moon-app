import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../../context/AuthContext';

// Solo se recuerda el correo. La contraseña nunca se guarda en el teléfono:
// la sesión se mantiene con la cookie del backend.
const REMEMBER_KEY = '@natymoon:remembered_email';
// Clave de versiones anteriores, que guardaba también la contraseña.
const OLD_CREDENTIALS_KEY = '@natymoon:remembered_credentials';

const LoginViewModel = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();

    // Al abrir la pantalla de login (por ejemplo, justo después de cerrar
    // sesión), si había un correo guardado lo precargamos por comodidad, PERO
    // el checkbox "Recordarme" siempre arranca desmarcado.
    useEffect(() => {
        void (async () => {
            try {
                // Borra las contraseñas que guardaron versiones anteriores.
                await AsyncStorage.removeItem(OLD_CREDENTIALS_KEY);
                const savedEmail = await AsyncStorage.getItem(REMEMBER_KEY);
                if (savedEmail) {
                    setEmail(savedEmail);
                }
            } catch (error) {
                if (__DEV__) console.log('Error al leer el correo guardado:', error);
            }
        })();
    }, []);

    // Devuelve true si el login fue exitoso, para que la vista
    // decida si navega o no.
    const handleLogin = async (): Promise<boolean> => {
        if (!email || !password) {
            Alert.alert(
                'NatyMoon',
                'Por favor completa todos los campos.'
            );
            return false;
        }

        setLoading(true);

        try {
            await login(email, password);

            // Guardamos (o borramos) solo el correo según el checkbox
            // "Recordarme". La contraseña no se guarda nunca.
            if (remember) {
                await AsyncStorage.setItem(REMEMBER_KEY, email);
            } else {
                await AsyncStorage.removeItem(REMEMBER_KEY);
            }

            return true;

        } catch (error: any) {
            // El backend ya distingue credenciales inválidas de otros
            // errores; este mensaje llega listo para mostrar tal cual.
            Alert.alert(
                'NatyMoon',
                error?.message || 'Error en el correo o la contraseña.'
            );
            return false;

        } finally {
            setLoading(false);
        }
    };

    return {
        email,
        password,
        remember,
        showPassword,
        loading,
        setEmail,
        setPassword,
        setRemember,
        setShowPassword,
        login: handleLogin,
    };
};

export default LoginViewModel;