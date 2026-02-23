// src/components/notifications/NotificationsDropdown.tsx (NUEVO)
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications';
import { Notification } from '@/lib/types/notification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    
    // Cerrar al hacer clic fuera
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getUnread();
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.data?.task_id) {
      router.push(`/boards/${notification.data.board_id}?task=${notification.data.task_id}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-gray-700">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Check size={12} />
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-gray-400" size={20} />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-500 p-4">
                No hay notificaciones nuevas
              </p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <p className="text-sm text-gray-800">{notification.data?.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(notification.created_at), 'dd MMM HH:mm', { locale: es })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};