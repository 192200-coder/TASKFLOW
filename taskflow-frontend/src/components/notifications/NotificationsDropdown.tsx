'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications';
import { Notification } from '@/lib/types/notification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

const POLL_INTERVAL = 30_000; // 30 segundos

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen]                 = useState(false);
  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [loading, setLoading]               = useState(false);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [hasError, setHasError]             = useState(false);
  const dropdownRef                          = useRef<HTMLDivElement>(null);
  const pollRef                              = useRef<ReturnType<typeof setInterval> | null>(null);
  const router                               = useRouter();

  // ── Cargar notificaciones ────────────────────────────────────────────
  const loadNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await notificationsApi.getUnread();
      setNotifications(data);
      setUnreadCount(data.length);
      setHasError(false);
    } catch (error) {
      // No mostramos toast en el polling para no molestar al usuario
      setHasError(true);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Carga inicial + polling
  useEffect(() => {
    loadNotifications(true);

    pollRef.current = setInterval(() => loadNotifications(false), POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadNotifications]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Acciones ─────────────────────────────────────────────────────────
  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // fallo silencioso, la UI no retrocede
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // fallo silencioso
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.data?.board_id) {
      const url = notification.data.task_id
        ? `/boards/${notification.data.board_id}?task=${notification.data.task_id}`
        : `/boards/${notification.data.board_id}`;
      router.push(url);
    }
    setIsOpen(false);
  };

  // Recargar al abrir
  const handleToggle = () => {
    if (!isOpen) loadNotifications(false);
    setIsOpen(prev => !prev);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Botón campana ── */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700 text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Check size={12} />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-6">
                <Loader2 className="animate-spin text-gray-400" size={20} />
              </div>
            ) : hasError ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">No se pudieron cargar las notificaciones</p>
                <button
                  onClick={() => loadNotifications(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 gap-2">
                <Bell size={24} className="text-gray-300" />
                <p className="text-sm text-gray-400">Sin notificaciones nuevas</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                >
                  <p className="text-sm text-gray-800 leading-snug">
                    {notification.data?.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notification.created_at), "dd MMM 'a las' HH:mm", { locale: es })}
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