// src/components/tasks/MentionInput.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/lib/types/user';
import { Send, Loader2 } from 'lucide-react';

interface MentionInputProps {
  boardMembers: User[];
  onSend: (content: string) => Promise<void>;
  sending?: boolean;
}

interface MentionState {
  active: boolean;
  query:  string;       // texto después del @
  start:  number;       // posición del @ en el string
}

const MENTION_IDLE: MentionState = { active: false, query: '', start: -1 };

export const MentionInput = ({ boardMembers, onSend, sending = false }: MentionInputProps) => {
  const [value,      setValue]      = useState('');
  const [mention,    setMention]    = useState<MentionState>(MENTION_IDLE);
  const [menuPos,    setMenuPos]    = useState({ top: 0, left: 0 });
  const [activeIdx,  setActiveIdx]  = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);

  // Miembros filtrados según lo que se escribió después del @
  const filtered = mention.active
    ? boardMembers.filter(m =>
        m.name.toLowerCase().startsWith(mention.query.toLowerCase())
      ).slice(0, 6)
    : [];

  // Reposicionar el menú debajo del input cuando cambia la query
  useEffect(() => {
    if (mention.active && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setMenuPos({
        top:  rect.top - 8,   // encima del input
        left: rect.left,
      });
      setActiveIdx(0);
    }
  }, [mention.active, mention.query]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setMention(MENTION_IDLE);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Detectar @ mientras el usuario escribe ──────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursor   = e.target.selectionStart ?? newValue.length;
    setValue(newValue);

    // Buscar el @ más cercano a la izquierda del cursor
    const textToCursor = newValue.slice(0, cursor);
    const atIdx = textToCursor.lastIndexOf('@');

    if (atIdx !== -1) {
      const query = textToCursor.slice(atIdx + 1);
      // Activar solo si no hay espacio en la query (una palabra)
      if (!query.includes(' ') && query.length <= 30) {
        setMention({ active: true, query, start: atIdx });
        return;
      }
    }
    setMention(MENTION_IDLE);
  };

  // ── Insertar mención al seleccionar un miembro ──────────────────────────
  const insertMention = useCallback((member: User) => {
    // Reemplaza @query por @nombre completo + espacio
    const before = value.slice(0, mention.start);
    const after  = value.slice(mention.start + 1 + mention.query.length);
    const inserted = `${before}@${member.name}${after} `;
    setValue(inserted);
    setMention(MENTION_IDLE);
    // Devolver foco al input
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value, mention]);

  // ── Navegación con teclado en el desplegable ────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mention.active && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => (i + 1) % filtered.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filtered[activeIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setMention(MENTION_IDLE);
        return;
      }
    }

    // Enter sin mención activa → enviar
    if (e.key === 'Enter' && !e.shiftKey && !mention.active) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    await onSend(trimmed);
    setValue('');
    setMention(MENTION_IDLE);
  };

  // Renderizar el texto con las menciones resaltadas (para previsualización)
  const renderPreview = () => {
    if (!value.includes('@')) return null;
    const parts = value.split(/(@[\w\u00C0-\u024F]+(?:\s[\w\u00C0-\u024F]+)?)/g);
    return (
      <div
        className="px-4 py-2 text-xs rounded-xl border-[1.5px] pointer-events-none mb-1"
        style={{
          borderColor: 'rgba(13,15,20,.07)',
          background:  'var(--paper)',
          color:       'var(--ink-muted)',
          lineHeight:  1.5,
        }}
        aria-hidden
      >
        {parts.map((part, i) =>
          part.startsWith('@') ? (
            <span key={i} style={{ color: 'var(--amber)', fontWeight: 600 }}>{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Previsualización con menciones resaltadas */}
      {value.includes('@') && renderPreview()}

      {/* Input principal */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un comentario... usa @ para mencionar"
          disabled={sending}
          className="flex-1 px-4 py-2 rounded-xl border-[1.5px] text-sm outline-none transition-all disabled:opacity-50"
          style={{
            borderColor: mention.active ? 'var(--amber)' : 'rgba(13,15,20,.1)',
            background:  'var(--paper)',
            color:       'var(--ink)',
            boxShadow:   mention.active ? '0 0 0 3px rgba(232,145,58,.1)' : 'none',
          }}
          onFocus={e  => { if (!mention.active) e.target.style.borderColor = 'var(--amber)'; }}
          onBlur={e   => { if (!mention.active) e.target.style.borderColor = 'rgba(13,15,20,.1)'; }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || sending}
          className="px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          style={{ background: 'var(--amber)', color: 'white' }}
          title="Enviar comentario"
        >
          {sending
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />
          }
        </button>
      </div>

      {/* Desplegable de menciones — position:fixed para no quedar cortado */}
      {mention.active && filtered.length > 0 && (
        <div
          ref={menuRef}
          className="fixed z-50 rounded-xl border overflow-hidden"
          style={{
            top:         menuPos.top,
            left:        menuPos.left,
            minWidth:    220,
            maxWidth:    280,
            background:  'white',
            borderColor: 'rgba(13,15,20,.09)',
            boxShadow:   '0 8px 24px rgba(13,15,20,.18)',
            transform:   'translateY(-100%)',
          }}
        >
          <div
            className="px-3 py-1.5 border-b text-xs font-semibold uppercase tracking-widest"
            style={{ borderColor: 'rgba(13,15,20,.06)', color: 'var(--ink-muted)' }}
          >
            Mencionar miembro
          </div>
          {filtered.map((member, idx) => (
            <button
              key={member.id}
              onMouseDown={e => { e.preventDefault(); insertMention(member); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors"
              style={{
                background: idx === activeIdx ? 'var(--cream)' : 'transparent',
                color:      'var(--ink)',
              }}
              onMouseEnter={() => setActiveIdx(idx)}
            >
              {/* Avatar */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: 'var(--teal)', fontSize: 10 }}
              >
                {member.avatar_url
                  ? <img src={member.avatar_url} alt={member.name} className="w-full h-full rounded-full object-cover" />
                  : member.name.charAt(0).toUpperCase()
                }
              </div>
              {/* Nombre con la query resaltada */}
              <span>
                <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                  {member.name.slice(0, mention.query.length)}
                </span>
                <span>{member.name.slice(mention.query.length)}</span>
              </span>
            </button>
          ))}
          <div
            className="px-3 py-1.5 text-xs border-t"
            style={{ borderColor: 'rgba(13,15,20,.06)', color: 'var(--ink-muted)' }}
          >
            ↑↓ navegar · Enter seleccionar · Esc cerrar
          </div>
        </div>
      )}
    </div>
  );
};