// src/lib/api/tasks.ts
import api from './axios';
import { Task, CreateTaskDTO, UpdateTaskDTO, TaskComment, TaskHistory } from '../types/task';

export const tasksApi = {
  createTask: async (data: CreateTaskDTO): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data.task;
  },

  updateTask: async (taskId: number, data: UpdateTaskDTO): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data.task;
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  moveTask: async (taskId: number, columnId: number, position: number): Promise<Task> => {
    const response = await api.patch(`/tasks/${taskId}/move`, {
      column_id: columnId,
      position,
    });
    return response.data.task;
  },

  // Backend devuelve Task directamente (sin wrapper)
  getTaskDetails: async (taskId: number): Promise<Task> => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Backend devuelve array de historial directamente
  getTaskHistory: async (taskId: number): Promise<TaskHistory[]> => {
    const response = await api.get(`/tasks/${taskId}/history`);
    return response.data;
  },

  // ── Comentarios ──────────────────────────────────────────────────────────
  getComments: async (taskId: number): Promise<TaskComment[]> => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  createComment: async (taskId: number, content: string): Promise<TaskComment> => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    // Ajustar si el backend devuelve { comment } o directo
    return response.data.comment ?? response.data;
  },

  deleteComment: async (taskId: number, commentId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
};