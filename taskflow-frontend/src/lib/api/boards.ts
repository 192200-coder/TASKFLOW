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

  // Requiere en el backend: PATCH /api/boards/:boardId/members/:userId { role }
  // Añadir en boardRoutes.js:
  //   router.patch('/:boardId/members/:userId', updateMemberRole);
  // Y en boardController.js:
  //   const updateMemberRole = async (req, res) => {
  //     const { boardId, userId } = req.params;
  //     const { role } = req.body;
  //     const membership = await BoardMember.findOne({ where: { board_id: boardId, user_id: req.user.id, role: 'admin' } });
  //     if (!membership) return res.status(403).json({ error: 'Sin permisos' });
  //     await BoardMember.update({ role }, { where: { board_id: boardId, user_id: userId } });
  //     res.json({ message: 'Rol actualizado' });
  //   };
  updateMemberRole: async (boardId: number, userId: number, role: string) => {
    const response = await api.patch(`/boards/${boardId}/members/${userId}`, { role });
    return response.data;
  },
};