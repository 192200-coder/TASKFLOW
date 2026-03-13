// src/components/notifications/NotificationsDropdown.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, Loader2, MessageSquare, AtSign } from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications';
import { Notification } from '@/lib/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

const POLL_INTERVAL = 30_000;

// Icono según tipo de notificación
const NotifIcon = ({ type }: { type: string }) => {
  if (type === 'MENTION') return <AtSign size={14} style={{ color: 'var(--amber)' }} />;
  return <MessageSquare size={14} style={{ color: 'var(--teal)' }} />;
};

export const NotificationsDropdown = () => {
  const [isOpen,         setIsOpen]         = useState(false);
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const dropdownRef                          = useRef<HTMLDivElement>(null);
  const pollRef                              = useRef<ReturnType<typeof setInterval> | null>(null);
  const router                               = useRouter();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await notificationsApi.getUnread();
      // El endpoint ya filtra is_read: false, pero por si acaso
      const unread = Array.isArray(data) ? data.filter((n: Notification) => !n.is_read) : [];
      setNotifications(unread);
      setUnreadCount(unread.length);
    } catch {
      // fallo silencioso en polling
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  // Polling cada 30s
  useEffect(() => {
    pollRef.current = setInterval(() => loadNotifications(false), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadNotifications]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Acciones ───────────────────────────────────────────────────────────────
  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) loadNotifications(false); // refresca siempre al abrir
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silencioso */ }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* silencioso */ }
  };

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.data?.board_id) {
      const url = n.data.task_id
        ? `/boards/${n.data.board_id}?task=${n.data.task_id}`
        : `/boards/${n.data.board_id}`;
      router.push(url);
    }
    setIsOpen(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>

      {/* Campana */}
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        style={{ color: 'var(--ink-muted)' }}
        onMouseOver={e => (e.currentTarget.style.background = 'var(--cream)')}
        onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-bold px-1"
            style={{ background: '#c0392b', fontSize: 9, lineHeight: 1 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 rounded-2xl border overflow-hidden z-50"
          style={{
            width:       320,
            background:  'white',
            borderColor: 'rgba(13,15,20,.09)',
            boxShadow:   '0 16px 48px rgba(13,15,20,.16)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(13,15,20,.07)' }}
          >
            <span
              className="font-bold text-sm"
              style={{ fontFamily: "'Syne', sans-serif", color: 'var(--ink)' }}
            >
              Notificaciones
              {unreadCount > 0 && (
                <span
                  className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: 'var(--ink-muted)' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseOut={e  => (e.currentTarget.style.color = 'var(--ink-muted)')}
              >
                <CheckCheck size={13} /> Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin" size={20} style={{ color: 'var(--amber)' }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={28} style={{ color: 'rgba(13,15,20,.1)' }} />
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  Sin notificaciones nuevas
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors"
                  style={{ borderColor: 'rgba(13,15,20,.05)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--cream)')}
                  onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Icono tipo */}
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: n.type === 'MENTION' ? 'var(--amber-dim)' : 'var(--teal-dim)' }}
                  >
                    <NotifIcon type={n.type} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ color: 'var(--ink)' }}>
                      {n.data?.message ?? 'Nueva notificación'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>

                  {/* Punto no leído */}
                  <div
                    className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                    style={{ background: 'var(--amber)' }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};