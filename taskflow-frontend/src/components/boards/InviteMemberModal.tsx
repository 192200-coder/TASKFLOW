// src/components/boards/InviteMemberModal.tsx
'use client';

import { useState, useRef } from 'react';
import { boardsApi } from '@/lib/api/boards';
import { Board, BoardMemberUser } from '@/lib/types/board';
import { X, UserPlus, Loader2, Crown, Eye, Users, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteMemberModalProps {
  board: Board;
  onClose: () => void;
  onMemberAdded: (member: BoardMemberUser) => void;
  onMemberRoleChanged?: (userId: number, newRole: Role) => void;
}

const ROLE_CONFIG = {
  admin:  { label: 'Admin',   icon: '👑', color: 'var(--amber)',     bg: 'rgba(232,145,58,.1)' },
  member: { label: 'Miembro', icon: '👤', color: 'var(--teal)',      bg: 'rgba(42,125,110,.1)' },
  viewer: { label: 'Lector',  icon: '👁',  color: 'var(--ink-muted)', bg: 'rgba(13,15,20,.06)'  },
} as const;

type Role = keyof typeof ROLE_CONFIG;

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin:  'Puede editar el tablero, invitar miembros y gestionar tareas.',
  member: 'Puede crear y editar tareas, mover tarjetas y comentar.',
  viewer: 'Solo puede ver el tablero sin realizar cambios.',
};

/* ── Selector de rol inline — usa position:fixed para no desplazar el scroll ── */
const InlineRoleSelector = ({
  value,
  onChange,
}: {
  value: Role;
  onChange: (r: Role) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const cfg = ROLE_CONFIG[value];

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top:   rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(p => !p);
  };

  return (
    <div className="flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <span>{cfg.label}</span>
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          {/* Backdrop transparente para cerrar */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Menú anclado con fixed — nunca empuja el scroll */}
          <div
            className="fixed z-50 rounded-xl border overflow-hidden"
            style={{
              top:         menuPos.top,
              right:       menuPos.right,
              background:  'white',
              borderColor: 'rgba(13,15,20,.09)',
              boxShadow:   '0 8px 24px rgba(13,15,20,.18)',
              minWidth:    130,
            }}
          >
            {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG.admin][]).map(([key, c]) => (
              <button
                key={key}
                onClick={() => { onChange(key); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors text-left"
                style={{ color: c.color, background: value === key ? c.bg : 'transparent' }}
                onMouseOver={e => (e.currentTarget.style.background = c.bg)}
                onMouseOut={e  => (e.currentTarget.style.background = value === key ? c.bg : 'transparent')}
              >
                <span>{c.icon}</span>
                {c.label}
                {value === key && <Check size={10} className="ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Componente principal ────────────────────────────────────────────────────── */
export const InviteMemberModal = ({
  board,
  onClose,
  onMemberAdded,
  onMemberRoleChanged,
}: InviteMemberModalProps) => {
  const [email,   setEmail]   = useState('');
  const [role,    setRole]    = useState<Role>('member');
  const [loading, setLoading] = useState(false);

  // Estado local de roles para reflejar cambios sin recargar
  const [memberRoles, setMemberRoles] = useState<Record<number, Role>>(() => {
    const map: Record<number, Role> = {};
    board.members?.forEach(m => {
      map[m.id] = (m.BoardMember?.role ?? 'member') as Role;
    });
    return map;
  });
  const [savingRole, setSavingRole] = useState<number | null>(null);

  const members = board.members ?? [];

  // ── Invitar nuevo miembro ─────────────────────────────────────────────
  const handleInvite = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ingresa un email válido');
      return;
    }
    setLoading(true);
    try {
      const response = await boardsApi.inviteMember(board.id, email.trim(), role);
      const newMember: BoardMemberUser = {
        ...response.member,
        BoardMember: {
          board_id:  board.id,
          user_id:   response.member.id,
          role,
          joined_at: new Date().toISOString(),
        },
      };
      onMemberAdded(newMember);
      setMemberRoles(prev => ({ ...prev, [newMember.id]: role }));
      toast.success(`${response.member.name} añadido al tablero`);
      setEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Error al invitar miembro');
    } finally {
      setLoading(false);
    }
  };

  // ── Cambiar rol de miembro existente ──────────────────────────────────
  // Requiere: PATCH /api/boards/:boardId/members/:userId { role }
  const handleRoleChange = async (memberId: number, newRole: Role) => {
    const previousRole = memberRoles[memberId];
    setMemberRoles(prev => ({ ...prev, [memberId]: newRole }));
    setSavingRole(memberId);
    try {
      await boardsApi.updateMemberRole(board.id, memberId, newRole);
      onMemberRoleChanged?.(memberId, newRole);
      toast.success('Rol actualizado');
    } catch (err: any) {
      setMemberRoles(prev => ({ ...prev, [memberId]: previousRole }));
      toast.error(err?.response?.data?.error ?? 'Error al cambiar el rol');
    } finally {
      setSavingRole(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,15,20,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 480,
          maxHeight: '85vh',
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(13,15,20,.25)',
          border: '1px solid rgba(13,15,20,.07)',
          animation: 'modalIn .2s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(13,15,20,.07)' }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--ink)' }}>
              Miembros del tablero
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>{board.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--ink-muted)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(13,15,20,.06)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scroll container */}
        <div className="flex-1 overflow-y-auto">

          {/* Formulario de invitación */}
          <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(13,15,20,.07)' }}>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
              Invitar por correo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
              placeholder="usuario@email.com"
              className="w-full px-4 py-2.5 rounded-xl border-[1.5px] text-sm outline-none transition-all mb-3"
              style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink)', background: 'var(--paper)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(13,15,20,.1)')}
            />

            {/* Selector de rol (3 botones) */}
            <div className="flex gap-2 mb-2">
              {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG.admin][]).map(([key, c]) => (
                <button
                  key={key}
                  onClick={() => setRole(key)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-[1.5px] transition-all text-xs font-semibold"
                  style={{
                    borderColor: role === key ? c.color : 'rgba(13,15,20,.1)',
                    background:  role === key ? c.bg    : 'transparent',
                    color:       role === key ? c.color : 'var(--ink-muted)',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--ink-muted)' }}>
              {ROLE_DESCRIPTIONS[role]}
            </p>

            <button
              onClick={handleInvite}
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ fontFamily: "'Syne', sans-serif", background: 'var(--ink)', color: 'var(--paper)' }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              Invitar al tablero
            </button>
          </div>

          {/* Lista de miembros actuales */}
          {members.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--ink-muted)' }}>
                Miembros actuales · {members.length}
              </p>
              <div className="space-y-3">
                {members.map(member => {
                  const isOwner     = board.owner_id === member.id;
                  const currentRole = memberRoles[member.id] ?? 'member';
                  const isSaving    = savingRole === member.id;

                  return (
                    <div key={member.id} className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ background: isOwner ? 'var(--amber)' : 'var(--teal)' }}
                      >
                        {member.avatar_url
                          ? <img src={member.avatar_url} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          : member.name.charAt(0).toUpperCase()
                        }
                      </div>

                      {/* Nombre y email */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{member.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--ink-muted)' }}>{member.email}</p>
                      </div>

                      {/* Rol */}
                      {isOwner ? (
                        <span
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(232,145,58,.1)', color: 'var(--amber)' }}
                        >
                          👑 Dueño
                        </span>
                      ) : isSaving ? (
                        <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--ink-muted)' }} />
                      ) : (
                        <InlineRoleSelector
                          value={currentRole}
                          onChange={newRole => handleRoleChange(member.id, newRole)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};