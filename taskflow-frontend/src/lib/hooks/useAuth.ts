// src/lib/hooks/useAuth.ts
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { LoginCredentials, RegisterCredentials } from '../types/user';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const { setUser, logout } = useAuthContext();
  const router = useRouter();

  const setToken = (token: string) => {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
  };

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      setToken(response.token);
      setUser(response.user); // ← sincronizar contexto inmediatamente
      toast.success('¡Bienvenido!');
      setTimeout(() => router.push('/dashboard'), 100);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterCredentials) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      setToken(response.token);
      setUser(response.user); // ← sincronizar contexto inmediatamente
      toast.success('¡Registro exitoso!');
      setTimeout(() => router.push('/dashboard'), 100);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return { login, register, logout, loading };
};