// src/components/tasks/TaskDetailModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, UpdateTaskDTO, Priority, TaskComment, TaskHistory } from '@/lib/types/task';
import { User } from '@/lib/types/user';
import { tasksApi } from '@/lib/api/tasks';
import { useAuth } from '@/contexts/AuthContext';
import {
  X, Calendar, Flag, User as UserIcon, AlignLeft,
  MessageSquare, Clock, Trash2, Loader2, ChevronDown,
  CheckCircle2, AlertCircle, Minus, ChevronUp,
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
  { value: 'Alta',  label: 'Alta',  icon: <AlertCircle  size={13} />, color: '#c0392b', bg: 'rgba(192,57,43,.1)' },
  { value: 'Media', label: 'Media', icon: <Minus        size={13} />, color: '#b7770d', bg: 'rgba(232,145,58,.1)' },
  { value: 'Baja',  label: 'Baja',  icon: <CheckCircle2 size={13}/>, color: '#1e7e34', bg: 'rgba(39,174,96,.1)' },
];

// ── MetaPanel extraído como componente independiente ──────────────────────────
// IMPORTANTE: este componente NO puede vivir dentro de TaskDetailModal porque
// React lo recrearía en cada render, invalidando los refs y rompiendo los
// event-listeners que detectan clicks fuera del dropdown.
interface MetaPanelProps {
  priority:       Priority;
  setPriority:    (p: Priority) => void;
  assignedTo:     number | null;
  setAssignedTo:  (id: number | null) => void;
  dueDate:        string;
  setDueDate:     (d: string) => void;
  boardMembers:   User[];
  task:           Task;
  confirmDelete:  boolean;
  setConfirmDelete: (v: boolean) => void;
  deleting:       boolean;
  onDelete:       () => void;
}

const MetaPanel = ({
  priority, setPriority,
  assignedTo, setAssignedTo,
  dueDate, setDueDate,
  boardMembers,
  task,
  confirmDelete, setConfirmDelete,
  deleting, onDelete,
}: MetaPanelProps) => {
  // Los refs y estados de los dropdowns viven AQUÍ, dentro del componente
  // estable, de manera que nunca se pierden entre renders del padre.
  const [showPriorityDD, setShowPriorityDD] = useState(false);
  const [showAssigneeDD, setShowAssigneeDD] = useState(false);
  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);

  const priorityConfig = PRIORITY_OPTIONS.find(o => o.value === priority) ?? PRIORITY_OPTIONS[1];
  const assignee = assignedTo ? boardMembers.find(m => m.id === assignedTo) : null;
  const isOverdue = dueDate && isAfter(new Date(), parseISO(dueDate));

  // Cerrar dropdowns al hacer clic fuera — los refs ahora siempre son válidos
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node))
        setShowPriorityDD(false);
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node))
        setShowAssigneeDD(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []); // deps vacías: el effect se monta/desmonta con el componente, no con el padre

  return (
    <div className="space-y-5">
      {/* Prioridad */}
      <div ref={priorityRef} className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
          <Flag size={11} className="inline mr-1" /> Prioridad
        </p>
        <button
          onClick={() => setShowPriorityDD(p => !p)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-[1.5px] text-sm font-semibold transition-all"
          style={{ borderColor: 'rgba(13,15,20,.1)', background: priorityConfig.bg, color: priorityConfig.color }}
        >
          <span className="flex items-center gap-1.5">{priorityConfig.icon} {priorityConfig.label}</span>
          <ChevronDown size={13} style={{ transform: showPriorityDD ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
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
            <span className="flex items-center gap-1.5 text-xs"><UserIcon size={13} /> Sin asignar</span>
          )}
          <ChevronDown size={13} style={{ transform: showAssigneeDD ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
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
        {isOverdue && <p className="text-xs mt-1" style={{ color: '#c0392b' }}>⚠ Fecha vencida</p>}
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

      {/* Eliminar */}
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
                onClick={onDelete}
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
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
export const TaskDetailModal = ({
  task,
  boardMembers = [],
  columnName,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) => {
  const { user } = useAuth();

  const [title,       setTitle]       = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority,    setPriority]    = useState<Priority>(task.priority);
  const [dueDate,     setDueDate]     = useState(task.due_date ?? '');
  const [assignedTo,  setAssignedTo]  = useState<number | null>(task.assigned_to ?? null);

  const [saving,          setSaving]          = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [activeTab,       setActiveTab]       = useState<'comments' | 'history'>('comments');
  const [comments,        setComments]        = useState<TaskComment[]>([]);
  const [history,         setHistory]         = useState<TaskHistory[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [sendingComment,  setSendingComment]  = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState(false);
  const [metaOpen,        setMetaOpen]        = useState(false);

  const titleRef       = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    priority    !== task.priority ||
    dueDate     !== (task.due_date ?? '') ||
    assignedTo  !== (task.assigned_to ?? null);

  const isOverdue = dueDate && isAfter(new Date(), parseISO(dueDate));

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

  useEffect(() => {
    if (activeTab === 'comments') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

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
    const knownNames = new Set(members.map(m => m.name.trim().toLowerCase()));
    const tokens = content.split(/(@\S+(?:\s\S+)?)/);
    return (
      <>
        {tokens.map((token, i) => {
          if (!token.startsWith('@')) return <span key={i}>{token}</span>;
          const twoWordMatch = token.match(/^@([\w\u00C0-\u024F]+\s[\w\u00C0-\u024F]+)/);
          const oneWordMatch = token.match(/^@([\w\u00C0-\u024F]+)/);
          let matchedHandle: string | null = null;
          let remainder = '';
          if (twoWordMatch) {
            const candidate = twoWordMatch[1].toLowerCase();
            if (knownNames.has(candidate)) { matchedHandle = twoWordMatch[1]; remainder = token.slice(twoWordMatch[0].length); }
          }
          if (!matchedHandle && oneWordMatch) {
            const candidate = oneWordMatch[1].toLowerCase();
            const isKnown = knownNames.size > 0
              ? [...knownNames].some(n => n === candidate || n.startsWith(candidate + ' '))
              : true;
            if (isKnown) { matchedHandle = oneWordMatch[1]; remainder = token.slice(oneWordMatch[0].length); }
          }
          if (!matchedHandle) return <span key={i}>{token}</span>;
          return (
            <span key={i}>
              <span style={{ color: 'var(--amber)', fontWeight: 700, background: 'rgba(232,145,58,.1)', borderRadius: 4, padding: '0 3px' }}>
                @{matchedHandle}
              </span>
              {remainder}
            </span>
          );
        })}
      </>
    );
  };

  // Props compartidas para MetaPanel — se pasan explícitamente en ambas instancias
  const metaPanelProps: MetaPanelProps = {
    priority,    setPriority,
    assignedTo,  setAssignedTo,
    dueDate,     setDueDate,
    boardMembers,
    task,
    confirmDelete, setConfirmDelete,
    deleting,    onDelete: handleDelete,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(13,15,20,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full flex flex-col overflow-hidden"
        style={{
          maxWidth:     780,
          height:       'calc(100dvh - 48px)',
          maxHeight:    '100dvh',
          background:   'var(--surface)',
          borderRadius: '20px 20px 0 0',
          boxShadow:    '0 -8px 40px rgba(13,15,20,.2)',
          border:       '1px solid rgba(13,15,20,.07)',
          animation:    'slideUp .25s cubic-bezier(.34,1.2,.64,1)',
        }}
        data-modal="task-detail"
      >
        {/* Handle móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(13,15,20,.15)' }} />
        </div>

        {/* ── Header ── */}
        <div
          className="flex items-start gap-3 px-5 sm:px-7 pt-3 sm:pt-6 pb-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(13,15,20,.07)' }}
        >
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
              style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.15rem', letterSpacing: '-.02em', color: 'var(--ink)', overflow: 'hidden' }}
              placeholder="Título de la tarea..."
            />
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors mt-0.5 flex-shrink-0"
            style={{ color: 'var(--ink-muted)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(13,15,20,.06)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Columna principal ── */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">

            {/* Metadatos colapsables — SOLO MÓVIL */}
            <div className="sm:hidden rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(13,15,20,.08)' }}>
              <button
                onClick={() => setMetaOpen(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold"
                style={{ background: 'var(--cream)', color: 'var(--ink-muted)' }}
              >
                <span className="flex items-center gap-2">
                  {(() => {
                    const cfg = PRIORITY_OPTIONS.find(o => o.value === priority) ?? PRIORITY_OPTIONS[1];
                    const assignee = assignedTo ? boardMembers.find(m => m.id === assignedTo) : null;
                    return (
                      <>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {assignee && (
                          <span className="flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--teal)', fontSize: 8 }}>
                              {assignee.name.charAt(0).toUpperCase()}
                            </span>
                            {assignee.name}
                          </span>
                        )}
                        {dueDate && (
                          <span style={{ color: isOverdue ? '#c0392b' : 'var(--ink-muted)' }}>
                            {format(parseISO(dueDate), 'dd MMM', { locale: es })}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </span>
                {metaOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {metaOpen && (
                <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(13,15,20,.06)' }}>
                  <MetaPanel {...metaPanelProps} />
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                <AlignLeft size={13} /> Descripción
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Añade una descripción más detallada..."
                className="w-full resize-none px-4 py-3 rounded-xl border-[1.5px] text-sm outline-none transition-all"
                style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink)', background: 'var(--paper)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(13,15,20,.1)')}
              />
            </div>

            {/* Tabs */}
            <div>
              <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--cream)', width: 'fit-content' }}>
                {([
                  { id: 'comments', label: 'Comentarios', icon: <MessageSquare size={13} /> },
                  { id: 'history',  label: 'Historial',   icon: <Clock size={13} /> },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: activeTab === tab.id ? 'white' : 'transparent',
                      color:      activeTab === tab.id ? 'var(--ink)' : 'var(--ink-muted)',
                      boxShadow:  activeTab === tab.id ? '0 1px 4px rgba(13,15,20,.08)' : 'none',
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
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={20} style={{ color: 'var(--ink-muted)' }} /></div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare size={28} style={{ color: 'var(--ink-muted)', margin: '0 auto 8px' }} />
                      <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Sé el primero en comentar</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-3 group">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs" style={{ background: 'var(--teal)' }}>
                          {comment.user?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{comment.user?.name ?? 'Usuario'}</span>
                            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                              {format(new Date(comment.created_at), "dd MMM 'a las' HH:mm", { locale: es })}
                            </span>
                          </div>
                          <div className="px-3 py-2 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
                            {renderCommentContent(comment.content, boardMembers)}
                          </div>
                        </div>
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
                  <div className="pt-2">
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs mt-1" style={{ background: 'var(--amber)' }}>
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
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={20} style={{ color: 'var(--ink-muted)' }} /></div>
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

          {/* ── Sidebar metadatos — SOLO DESKTOP ── */}
          <div
            className="hidden sm:block w-56 flex-shrink-0 overflow-y-auto py-5 px-4 border-l"
            style={{ borderColor: 'rgba(13,15,20,.06)', background: 'rgba(248,247,244,.5)' }}
          >
            <MetaPanel {...metaPanelProps} />
          </div>
        </div>

        {/* ── Footer: Guardar ── */}
        {isDirty && (
          <div
            className="flex items-center justify-between px-5 sm:px-7 py-3 sm:py-4 border-t flex-shrink-0"
            style={{ borderColor: 'rgba(13,15,20,.07)', background: 'var(--surface)' }}
          >
            <p className="text-xs hidden sm:block" style={{ color: 'var(--ink-muted)' }}>Tienes cambios sin guardar</p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setTitle(task.title);
                  setDescription(task.description ?? '');
                  setPriority(task.priority);
                  setDueDate(task.due_date ?? '');
                  setAssignedTo(task.assigned_to ?? null);
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium border transition-colors"
                style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink-muted)' }}
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ fontFamily: "'Syne', sans-serif", background: 'var(--ink)', color: 'var(--paper)', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 640px) {
          [data-modal="task-detail"] {
            height: auto !important;
            max-height: 90vh !important;
            border-radius: 20px !important;
            animation-name: modalIn !important;
          }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};