// src/lib/types/user.ts
export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  email_verified_at?: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}