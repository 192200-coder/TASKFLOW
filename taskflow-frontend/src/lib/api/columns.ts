// src/lib/api/columns.ts
import api from './axios';
import { Column } from '../types/board';

interface CreateColumnDTO {
  name: string;
  board_id: number;
  position?: number;
}

interface UpdateColumnDTO {
  name?: string;
  position?: number;
}

export const columnsApi = {
  createColumn: async (data: CreateColumnDTO): Promise<{ column: Column }> => {
    const response = await api.post('/columns', data);
    return response.data;
  },

  updateColumn: async (columnId: number, data: UpdateColumnDTO): Promise<{ column: Column }> => {
    const response = await api.put(`/columns/${columnId}`, data);
    return response.data;
  },

  deleteColumn: async (columnId: number): Promise<void> => {
    await api.delete(`/columns/${columnId}`);
  },

  reorderColumns: async (
    boardId: number,
    columns: { id: number; position: number }[]
  ): Promise<void> => {
    await api.post(`/columns/board/${boardId}/reorder`, { columns });
  },
};