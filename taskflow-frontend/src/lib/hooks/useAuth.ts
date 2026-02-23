// src/lib/hooks/useAuth.ts
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth';
import { LoginCredentials, RegisterCredentials } from '../types/user';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const setToken = (token: string) => {
    // Guardar en localStorage (para el cliente)
    localStorage.setItem('token', token);
    
    // Guardar en cookie (para el proxy/middleware)
    // max-age=604800 = 7 días
    document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      console.log('1. Intentando login...');
      const response = await authApi.login(credentials);
      console.log('2. Respuesta del backend:', response);
      
      setToken(response.token);
      console.log('3. Token guardado en localStorage y cookie');
      
      toast.success('¡Bienvenido!');
      
      console.log('4. Intentando redirigir a /dashboard');
      
      // Pequeño delay para asegurar que la cookie se establezca
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      
    } catch (error: any) {
      console.error('Error en login:', error);
      toast.error(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterCredentials) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      setToken(response.token);
      toast.success('¡Registro exitoso!');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      
    } catch (error: any) {
      console.error('Error en registro:', error);
      toast.error(error.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    router.push('/login');
    toast.success('Sesión cerrada');
  };

  return { login, register, logout, loading };
};