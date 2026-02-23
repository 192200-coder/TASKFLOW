// src/lib/api/boards.ts
import api from './axios';
import { Board } from '../types/board';

export const boardsApi = {
  getMyBoards: async () => {
    const response = await api.get('/boards/my-boards');
    return response.data;
  },

  getBoard: async (boardId: number): Promise<Board> => {
    const response = await api.get(`/boards/${boardId}`);
    return response.data;
  },

  createBoard: async (data: Partial<Board>) => {
    const response = await api.post('/boards', data);
    return response.data;
  },

  updateBoard: async (boardId: number, data: Partial<Board>) => {
    const response = await api.put(`/boards/${boardId}`, data);
    return response.data;
  },

  deleteBoard: async (boardId: number) => {
    const response = await api.delete(`/boards/${boardId}`);
    return response.data;
  },

  inviteMember: async (boardId: number, email: string, role: string) => {
    const response = await api.post(`/boards/${boardId}/invite`, { email, role });
    return response.data;
  },
};