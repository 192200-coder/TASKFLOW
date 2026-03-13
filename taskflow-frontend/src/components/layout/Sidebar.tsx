// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Settings, LogOut,
  Layout, PanelLeftClose, PanelLeftOpen, X,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  /** Móvil: controla si el drawer está visible */
  mobileOpen?: boolean;
  /** Callback para cerrar el drawer desde el layout */
  onMobileClose?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/boards',    icon: Layout,          label: 'Tableros'   },
    { href: '/members',   icon: Users,           label: 'Miembros'   },
    { href: '/settings',  icon: Settings,        label: 'Ajustes'    },
  ];

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', width: '100%',
    borderRadius: 12, transition: 'all .15s ease',
    background: 'transparent', border: 'none', cursor: 'pointer',
    overflow: 'hidden', whiteSpace: 'nowrap',
  };

  // En móvil siempre se muestra expandido cuando el drawer está abierto
  const isCollapsed = collapsed;

  return (
    <aside
      style={{
        // ── Desktop: ancho fijo con colapso ──────────────────────────────────
        width: isCollapsed ? 64 : 224,
        minWidth: isCollapsed ? 64 : 224,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0f14',
        borderRight: '1px solid rgba(255,255,255,.06)',
        transition: 'width .25s cubic-bezier(.4,0,.2,1), min-width .25s cubic-bezier(.4,0,.2,1), transform .25s cubic-bezier(.4,0,.2,1)',
        flexShrink: 0,
        // ── Móvil: drawer deslizante ─────────────────────────────────────────
        // Ocupa posición fija fuera del flujo, se desliza con transform
        position: undefined,
        zIndex: undefined,
      }}
      // Usamos clases de Tailwind para el comportamiento móvil/desktop
      // ya que los media queries no se pueden usar en inline styles
      className={[
        // En móvil: fixed drawer que entra/sale con translate
        'fixed top-0 left-0 z-30',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // En desktop: vuelve al flujo normal, siempre visible
        'lg:relative lg:translate-x-0 lg:z-auto',
      ].join(' ')}
    >
      {/* ── Header: Logo + botón colapso (desktop) / botón cerrar (móvil) ── */}
      <div
        style={{
          height: 56, display: 'flex', alignItems: 'center',
          padding: '0 12px', gap: 8,
          borderBottom: '1px solid rgba(255,255,255,.06)',
          flexShrink: 0,
        }}
      >
        {/* Logo: visible cuando no está colapsado */}
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: 'var(--amber)', boxShadow: '0 0 8px var(--amber)',
            }} />
            <span style={{
              fontFamily: "'Syne', sans-serif", fontSize: '1.05rem',
              fontWeight: 800, color: 'white', letterSpacing: '-.02em',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              TaskFlow
            </span>
          </div>
        )}

        {/* Botón cerrar — solo visible en móvil */}
        <button
          onClick={onMobileClose}
          className="lg:hidden"
          style={{
            ...btnBase,
            width: 32, minWidth: 32, height: 32,
            justifyContent: 'center',
            color: 'rgba(255,255,255,.3)',
            flexShrink: 0,
            marginLeft: 'auto',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.07)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.8)';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.3)';
          }}
        >
          <X size={16} />
        </button>

        {/* Botón colapso — solo visible en desktop */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="hidden lg:flex"
          style={{
            ...btnBase,
            width: 32, minWidth: 32, height: 32,
            justifyContent: 'center',
            color: 'rgba(255,255,255,.3)',
            flexShrink: 0,
            marginLeft: isCollapsed ? 'auto' : 0,
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.07)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.8)';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.3)';
          }}
        >
          {isCollapsed
            ? <PanelLeftOpen  size={16} />
            : <PanelLeftClose size={16} />
          }
        </button>
      </div>

      {/* ── Usuario ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px', borderBottom: '1px solid rgba(255,255,255,.06)',
        overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--amber)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13,
          overflow: 'hidden',
        }}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user?.name?.charAt(0).toUpperCase()
          }
        </div>
        {!isCollapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {user?.name}
            </p>
            <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {user?.email}
            </p>
          </div>
        )}
      </div>

      {/* ── Navegación ── */}
      <nav style={{ flex: 1, padding: '10px 8px', overflow: 'hidden' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {menuItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  onClick={onMobileClose} // cierra el drawer al navegar en móvil
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: 10, padding: '8px 10px', borderRadius: 12,
                    textDecoration: 'none', transition: 'all .15s ease',
                    background: isActive ? 'rgba(232,145,58,.15)' : 'transparent',
                    color:      isActive ? 'var(--amber)'          : 'rgba(255,255,255,.45)',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                  }}
                  onMouseOver={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)';
                      (e.currentTarget as HTMLElement).style.color = 'white';
                    }
                  }}
                  onMouseOut={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.45)';
                    }
                  }}
                >
                  <item.icon size={18} style={{ flexShrink: 0 }} />
                  {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Logout ── */}
      <div style={{ padding: '10px 8px 16px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
        <button
          onClick={logout}
          title={isCollapsed ? 'Cerrar sesión' : undefined}
          style={{
            ...btnBase,
            gap: 10, padding: '8px 10px',
            color: 'rgba(255,255,255,.35)',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.8)';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.35)';
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};