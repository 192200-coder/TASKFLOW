// src/lib/api/notifications.ts
import api from './axios';
import { Notification } from '../types/notification';

export const notificationsApi = {
  getUnread: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },
};