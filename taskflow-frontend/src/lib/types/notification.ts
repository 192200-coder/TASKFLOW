// src/lib/types/notification.ts
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  data: {
    message: string;
    task_id?: number;
    board_id?: number;
    comment_id?: number;
  };
  is_read: boolean;
  created_at: string;
}