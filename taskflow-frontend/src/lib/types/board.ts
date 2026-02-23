// src/lib/types/board.ts
import { User } from './user';
import { Task } from './task';

export interface Board {
  id: number;
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  columns?: Column[];
  // Sequelize belongsToMany devuelve User[] con BoardMember anidado como pivot
  members?: BoardMemberUser[];
  owner?: User;
}

export interface Column {
  id: number;
  name: string;
  position: number;
  board_id: number;
  created_at?: string;
  updated_at?: string;
  tasks?: Task[];
}

// Estructura REAL que devuelve Sequelize en una relación M:M con belongsToMany:
// los campos del User vienen al nivel raíz, y la tabla pivot viene en BoardMember
export interface BoardMemberUser extends User {
  BoardMember: {
    board_id: number;
    user_id: number;
    role: 'admin' | 'member' | 'viewer';
    joined_at: string;
  };
}

// Tipo separado para cuando se maneja la membresía directamente (no como User)
export interface BoardMember {
  board_id: number;
  user_id: number;
  role: 'admin' | 'member' | 'viewer';
  joined_at?: string;
}