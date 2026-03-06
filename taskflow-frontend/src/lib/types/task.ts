// src/lib/types/task.ts
import { User } from './user';

export type Priority = 'Alta' | 'Media' | 'Baja';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  priority: Priority;
  due_date?: string | null;
  position: number;
  column_id: number;
  assigned_to?: number | null;
  created_by: number;
  created_at: string;
  assignee?: User | null;
  creator?: User;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  column_id: number;
  position?: number;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: Priority;
  due_date?: string | null;
  assigned_to?: number | null;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface TaskHistory {
  id: number;
  task_id: number;
  user_id: number;
  action: string;
  field_changed?: string | null;   // ← añadido
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
  user?: User;
}