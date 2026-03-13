// src/components/layout/Navbar.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Menu } from 'lucide-react';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

interface NavbarProps {
  /** Callback para abrir el sidebar drawer en móvil */
  onMenuClick?: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user } = useAuth();

  return (
    <nav
      className="flex items-center justify-between px-4 border-b flex-shrink-0"
      style={{
        background:  'white',
        borderColor: 'rgba(13,15,20,.08)',
        height:      56,
      }}
    >
      {/* ── Izquierda: hamburguesa solo en móvil ── */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors flex-shrink-0"
        style={{ color: 'var(--ink-muted)' }}
        onMouseOver={e => (e.currentTarget.style.background = 'var(--cream)')}
        onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Derecha: notificaciones + usuario ── */}
      <div className="flex items-center gap-3">
        <NotificationsDropdown />

        <div className="flex items-center gap-2.5">
          {/* Nombre/email — ocultos en móvil */}
          <div className="hidden sm:block text-right">
            <p
              className="text-sm font-semibold leading-tight"
              style={{ color: 'var(--ink)' }}
            >
              {user?.name}
            </p>
            <p className="text-xs leading-tight" style={{ color: 'var(--ink-muted)' }}>
              {user?.email}
            </p>
          </div>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0"
            style={{ background: 'var(--amber)' }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};