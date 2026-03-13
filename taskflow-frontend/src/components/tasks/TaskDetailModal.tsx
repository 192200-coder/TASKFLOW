// src/components/tasks/TaskDetailModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, UpdateTaskDTO, Priority, TaskComment, TaskHistory } from '@/lib/types/task';
import { User } from '@/lib/types/user';
import { tasksApi } from '@/lib/api/tasks';
import { useAuth } from '@/contexts/AuthContext';
import {
  X, Calendar, Flag, User as UserIcon, AlignLeft,
  MessageSquare, Clock, Trash2, Loader2, Send, ChevronDown,
  CheckCircle2, AlertCircle, Minus,
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { MentionInput } from './MentionInput';

interface TaskDetailModalProps {
  task: Task;
  boardMembers?: User[];
  columnName?: string;
  onClose: () => void;
  onUpdate: (taskId: number, data: UpdateTaskDTO) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { value: 'Alta',  label: 'Alta',  icon: <AlertCircle size={13} />, color: '#c0392b', bg: 'rgba(192,57,43,.1)' },
  { value: 'Media', label: 'Media', icon: <Minus       size={13} />, color: '#b7770d', bg: 'rgba(232,145,58,.1)' },
  { value: 'Baja',  label: 'Baja',  icon: <CheckCircle2 size={13}/>, color: '#1e7e34', bg: 'rgba(39,174,96,.1)' },
];

export const TaskDetailModal = ({
  task,
  boardMembers = [],
  columnName,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) => {
  const { user } = useAuth();

  // ── Campos editables ──────────────────────────────────────────────────
  const [title,       setTitle]       = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority,    setPriority]    = useState<Priority>(task.priority);
  const [dueDate,     setDueDate]     = useState(task.due_date ?? '');
  const [assignedTo,  setAssignedTo]  = useState<number | null>(task.assigned_to ?? null);

  // ── UI state ──────────────────────────────────────────────────────────
  const [saving,          setSaving]          = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [activeTab,       setActiveTab]       = useState<'comments' | 'history'>('comments');
  const [comments,        setComments]        = useState<TaskComment[]>([]);
  const [history,         setHistory]         = useState<TaskHistory[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [sendingComment,  setSendingComment]  = useState(false);
  const [showPriorityDD,  setShowPriorityDD]  = useState(false);
  const [showAssigneeDD,  setShowAssigneeDD]  = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState(false);

  const titleRef      = useRef<HTMLTextAreaElement>(null);
  const priorityRef   = useRef<HTMLDivElement>(null);
  const assigneeRef   = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    priority    !== task.priority ||
    dueDate     !== (task.due_date ?? '') ||
    assignedTo  !== (task.assigned_to ?? null);

  const isOverdue = dueDate && isAfter(new Date(), parseISO(dueDate));

  // ── Cargar comentarios e historial ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [cmts, hist] = await Promise.all([
          tasksApi.getComments(task.id),
          tasksApi.getTaskHistory(task.id),
        ]);
        setComments(cmts);
        setHistory(hist);
      } catch { /* silencioso */ }
      finally { setLoadingComments(false); }
    };
    load();
  }, [task.id]);

  // Auto-scroll al último comentario
  useEffect(() => {
    if (activeTab === 'comments') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node))
        setShowPriorityDD(false);
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node))
        setShowAssigneeDD(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Escape para cerrar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Auto-resize textarea título
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // ── Guardar cambios ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) { toast.error('El título no puede estar vacío'); return; }
    setSaving(true);
    await onUpdate(task.id, {
      title:       title.trim(),
      description: description || undefined,
      priority,
      due_date:    dueDate || null,
      assigned_to: assignedTo,
    });
    setSaving(false);
  };

  // ── Eliminar tarea ──────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task.id);
    onClose();
  };


  const handleDeleteComment = async (commentId: number) => {
    try {
      await tasksApi.deleteComment(task.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { toast.error('Error al eliminar comentario'); }
  };

  // ── Helpers visuales ──────────────────────────────────────────────────
  const getPriorityConfig = (p: Priority) =>
    PRIORITY_OPTIONS.find(o => o.value === p) ?? PRIORITY_OPTIONS[1];

  const getAssignee = () =>
    assignedTo ? boardMembers.find(m => m.id === assignedTo) : null;

  const priorityConfig = getPriorityConfig(priority);
  const assignee       = getAssignee();

  const formatHistoryAction = (h: TaskHistory & { field_changed?: string | null }) => {
    const who = h.user?.name ?? 'Alguien';
    switch (h.action) {
      case 'CREATE': return `${who} creó esta tarea`;
      case 'MOVE':   return `${who} movió la tarea`;
      case 'UPDATE':
        if (h.field_changed === 'title')       return `${who} cambió el título`;
        if (h.field_changed === 'priority')    return `${who} cambió la prioridad de "${h.old_value}" a "${h.new_value}"`;
        if (h.field_changed === 'description') return `${who} actualizó la descripción`;
        if (h.field_changed === 'due_date')    return `${who} cambió la fecha límite`;
        if (h.field_changed === 'assigned_to') return `${who} cambió el responsable`;
        return `${who} actualizó ${h.field_changed}`;
      case 'ASSIGN': return `${who} cambió el responsable`;
      default:       return `${who} realizó una acción`;
    }
  };

  const renderCommentContent = (content: string, members: User[] = []) => {
    // Set de nombres completos en minúsculas para lookup exacto
    const knownNames = new Set(members.map(m => m.name.trim().toLowerCase()));
  
    // Split por tokens que empiecen con @ (captura el separador)
    const tokens = content.split(/(@\S+(?:\s\S+)?)/);
  
    return (
      <>
        {tokens.map((token, i) => {
          if (!token.startsWith('@')) return <span key={i}>{token}</span>;
  
          const twoWordMatch = token.match(/^@([\w\u00C0-\u024F]+\s[\w\u00C0-\u024F]+)/);
          const oneWordMatch = token.match(/^@([\w\u00C0-\u024F]+)/);
  
          let matchedHandle: string | null = null;
          let remainder = '';
  
          // Intentar primero dos palabras (@Nombre Apellido) — solo si existe ese nombre
          if (twoWordMatch) {
            const candidate = twoWordMatch[1].toLowerCase();
            if (knownNames.has(candidate)) {
              matchedHandle = twoWordMatch[1];
              remainder     = token.slice(twoWordMatch[0].length);
            }
          }
  
          // Si no matcheó, intentar una palabra
          if (!matchedHandle && oneWordMatch) {
            const candidate = oneWordMatch[1].toLowerCase();
            const isKnown = knownNames.size > 0
              ? [...knownNames].some(n =>
                  n === candidate ||
                  n.startsWith(candidate + ' ') ||
                  n === candidate
                )
              : true; // sin lista de miembros: resaltar cualquier @palabra
  
            if (isKnown) {
              matchedHandle = oneWordMatch[1];
              remainder     = token.slice(oneWordMatch[0].length);
            }
          }
  
          if (!matchedHandle) return <span key={i}>{token}</span>;
  
          return (
            <span key={i}>
              <span
                style={{
                  color:        'var(--amber)',
                  fontWeight:   700,
                  background:   'rgba(232,145,58,.1)',
                  borderRadius: 4,
                  padding:      '0 3px',
                }}
              >
                @{matchedHandle}
              </span>
              {remainder}
            </span>
          );
        })}
      </>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,15,20,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 780,
          maxHeight: '90vh',
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(13,15,20,.25), 0 4px 16px rgba(13,15,20,.1)',
          border: '1px solid rgba(13,15,20,.07)',
          animation: 'modalIn .2s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          className="flex items-start gap-3 px-7 pt-6 pb-4 border-b"
          style={{ borderColor: 'rgba(13,15,20,.07)', flexShrink: 0 }}
        >
          {/* Título editable */}
          <div className="flex-1 min-w-0">
            {columnName && (
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                En · {columnName}
              </p>
            )}
            <textarea
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              rows={1}
              className="w-full resize-none bg-transparent font-extrabold leading-tight outline-none"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.3rem',
                letterSpacing: '-.02em',
                color: 'var(--ink)',
                overflow: 'hidden',
              }}
              placeholder="Título de la tarea..."
            />
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors mt-0.5"
            style={{ color: 'var(--ink-muted)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(13,15,20,.06)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body (scroll) ──────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Columna izquierda: contenido principal ─────────────────── */}
          <div className="flex-1 overflow-y-auto px-7 py-5 space-y-6">

            {/* Descripción */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                <AlignLeft size={13} /> Descripción
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Añade una descripción más detallada..."
                className="w-full resize-none px-4 py-3 rounded-xl border-[1.5px] text-sm outline-none transition-all"
                style={{
                  borderColor: 'rgba(13,15,20,.1)',
                  color: 'var(--ink)',
                  background: 'var(--paper)',
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.6,
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(13,15,20,.1)')}
              />
            </div>

            {/* ── Tabs: Comentarios / Historial ── */}
            <div>
              <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--cream)', width: 'fit-content' }}>
                {([
                  { id: 'comments', label: 'Comentarios', icon: <MessageSquare size={13} /> },
                  { id: 'history',  label: 'Historial',   icon: <Clock size={13} /> },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background:  activeTab === tab.id ? 'white' : 'transparent',
                      color:       activeTab === tab.id ? 'var(--ink)' : 'var(--ink-muted)',
                      boxShadow:   activeTab === tab.id ? '0 1px 4px rgba(13,15,20,.08)' : 'none',
                    }}
                  >
                    {tab.icon} {tab.label}
                    {tab.id === 'comments' && comments.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--amber)', color: 'white', fontSize: 10 }}>
                        {comments.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Comentarios */}
              {activeTab === 'comments' && (
                <div className="space-y-3">
                  {loadingComments ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin" size={20} style={{ color: 'var(--ink-muted)' }} />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare size={28} style={{ color: 'var(--ink-muted)', margin: '0 auto 8px' }} />
                      <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Sé el primero en comentar</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        {/* Avatar */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs"
                          style={{ background: 'var(--teal)' }}
                        >
                          {comment.user?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                              {comment.user?.name ?? 'Usuario'}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                              {format(new Date(comment.created_at), "dd MMM 'a las' HH:mm", { locale: es })}
                            </span>
                          </div>
                          <div
                            className="px-3 py-2 rounded-xl text-sm leading-relaxed"
                            style={{ background: 'var(--paper)', color: 'var(--ink)' }}
                          >
                            {renderCommentContent(comment.content, boardMembers)}
                          </div>
                        </div>
                        {/* Eliminar (solo el propio) */}
                        {comment.user_id === user?.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                            style={{ color: 'var(--ink-muted)', alignSelf: 'flex-start' }}
                            onMouseOver={e => (e.currentTarget.style.color = '#c0392b')}
                            onMouseOut={e  => (e.currentTarget.style.color = 'var(--ink-muted)')}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />

                  {/* Input nuevo comentario con menciones */}
                  <div className="pt-2">
                    {/* Avatar del usuario actual */}
                    <div className="flex gap-3 items-start mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs mt-1"
                        style={{ background: 'var(--amber)' }}
                      >
                        {user?.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1">
                        <MentionInput
                          boardMembers={boardMembers}
                          sending={sendingComment}
                          onSend={async (content) => {
                            setSendingComment(true);
                            try {
                              const created = await tasksApi.createComment(task.id, content);
                              setComments(prev => [...prev, created]);
                            } catch {
                              toast.error('Error al enviar comentario');
                            } finally {
                              setSendingComment(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historial */}
              {activeTab === 'history' && (
                <div className="space-y-2">
                  {loadingComments ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin" size={20} style={{ color: 'var(--ink-muted)' }} />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: 'var(--ink-muted)' }}>Sin historial aún</p>
                  ) : (
                    history.map(h => (
                      <div key={h.id} className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--ink-muted)' }} />
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>{formatHistoryAction(h)}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                            {format(new Date(h.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: metadatos ─────────────────────────────── */}
          <div
            className="w-56 flex-shrink-0 overflow-y-auto py-5 px-4 space-y-5 border-l"
            style={{ borderColor: 'rgba(13,15,20,.06)', background: 'rgba(248,247,244,.5)' }}
          >
            {/* Prioridad */}
            <div ref={priorityRef} className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                <Flag size={11} className="inline mr-1" /> Prioridad
              </p>
              <button
                onClick={() => setShowPriorityDD(p => !p)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-[1.5px] text-sm font-semibold transition-all"
                style={{
                  borderColor: 'rgba(13,15,20,.1)',
                  background:  priorityConfig.bg,
                  color:       priorityConfig.color,
                }}
              >
                <span className="flex items-center gap-1.5">
                  {priorityConfig.icon} {priorityConfig.label}
                </span>
                <ChevronDown size={13} />
              </button>
              {showPriorityDD && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-xl border overflow-hidden"
                  style={{ background: 'white', borderColor: 'rgba(13,15,20,.09)', boxShadow: '0 8px 24px rgba(13,15,20,.12)' }}
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setPriority(opt.value); setShowPriorityDD(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors text-left"
                      style={{ color: opt.color, background: priority === opt.value ? opt.bg : 'transparent' }}
                      onMouseOver={e => (e.currentTarget.style.background = opt.bg)}
                      onMouseOut={e  => (e.currentTarget.style.background = priority === opt.value ? opt.bg : 'transparent')}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Responsable */}
            <div ref={assigneeRef} className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                <UserIcon size={11} className="inline mr-1" /> Responsable
              </p>
              <button
                onClick={() => setShowAssigneeDD(p => !p)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-[1.5px] text-sm transition-all"
                style={{ borderColor: 'rgba(13,15,20,.1)', background: 'white', color: assignee ? 'var(--ink)' : 'var(--ink-muted)' }}
              >
                {assignee ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--teal)' }}>
                      {assignee.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate text-xs font-medium">{assignee.name}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs">
                    <UserIcon size={13} /> Sin asignar
                  </span>
                )}
                <ChevronDown size={13} />
              </button>

              {showAssigneeDD && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-xl border overflow-hidden"
                  style={{ background: 'white', borderColor: 'rgba(13,15,20,.09)', boxShadow: '0 8px 24px rgba(13,15,20,.12)' }}
                >
                  <button
                    onClick={() => { setAssignedTo(null); setShowAssigneeDD(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left"
                    style={{ color: 'var(--ink-muted)', background: !assignedTo ? 'var(--cream)' : 'transparent' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--cream)')}
                    onMouseOut={e  => (e.currentTarget.style.background = !assignedTo ? 'var(--cream)' : 'transparent')}
                  >
                    <UserIcon size={13} /> Sin asignar
                  </button>
                  {boardMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => { setAssignedTo(member.id); setShowAssigneeDD(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left"
                      style={{ color: 'var(--ink)', background: assignedTo === member.id ? 'var(--cream)' : 'transparent' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'var(--cream)')}
                      onMouseOut={e  => (e.currentTarget.style.background = assignedTo === member.id ? 'var(--cream)' : 'transparent')}
                    >
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'var(--teal)', fontSize: 10 }}>
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{member.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fecha límite */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                <Calendar size={11} className="inline mr-1" /> Fecha límite
              </p>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-[1.5px] text-sm outline-none transition-all"
                style={{
                  borderColor: isOverdue ? '#c0392b' : 'rgba(13,15,20,.1)',
                  background:  isOverdue ? 'rgba(192,57,43,.06)' : 'white',
                  color:       isOverdue ? '#c0392b' : 'var(--ink)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e  => (e.target.style.borderColor = isOverdue ? '#c0392b' : 'rgba(13,15,20,.1)')}
              />
              {isOverdue && (
                <p className="text-xs mt-1" style={{ color: '#c0392b' }}>⚠ Fecha vencida</p>
              )}
              {dueDate && (
                <button
                  onClick={() => setDueDate('')}
                  className="mt-1 text-xs transition-colors"
                  style={{ color: 'var(--ink-muted)' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#c0392b')}
                  onMouseOut={e  => (e.currentTarget.style.color = 'var(--ink-muted)')}
                >
                  × Quitar fecha
                </button>
              )}
            </div>

            {/* Creado por */}
            {task.creator && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>Creado por</p>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--amber)' }}>
                    {task.creator.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>{task.creator.name}</span>
                </div>
              </div>
            )}

            {/* Eliminar tarea */}
            <div className="pt-4 border-t" style={{ borderColor: 'rgba(13,15,20,.06)' }}>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-[1.5px]"
                  style={{ borderColor: 'rgba(192,57,43,.25)', color: '#c0392b', background: 'rgba(192,57,43,.04)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(192,57,43,.1)')}
                  onMouseOut={e  => (e.currentTarget.style.background = 'rgba(192,57,43,.04)')}
                >
                  <Trash2 size={13} /> Eliminar tarea
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-center" style={{ color: '#c0392b' }}>¿Seguro?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs border transition-colors"
                      style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink-muted)' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      style={{ background: '#c0392b', color: 'white' }}
                    >
                      {deleting ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Eliminar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer: Guardar ────────────────────────────────────────────── */}
        {isDirty && (
          <div
            className="flex items-center justify-between px-7 py-4 border-t"
            style={{ borderColor: 'rgba(13,15,20,.07)', background: 'var(--surface)', flexShrink: 0 }}
          >
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Tienes cambios sin guardar</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTitle(task.title);
                  setDescription(task.description ?? '');
                  setPriority(task.priority);
                  setDueDate(task.due_date ?? '');
                  setAssignedTo(task.assigned_to ?? null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium border transition-colors"
                style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink-muted)' }}
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                Guardar cambios
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(.96) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};