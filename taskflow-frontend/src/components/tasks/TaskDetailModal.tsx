// src/components/tasks/TaskDetailModal.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { tasksApi } from '@/lib/api/tasks';
import { Task, UpdateTaskDTO, TaskComment, TaskHistory, Priority } from '@/lib/types/task';
import { User } from '@/lib/types/user';
import {
  X, Calendar, Flag, User as UserIcon, MessageSquare,
  Clock, Trash2, Send, Loader2, Edit2, Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
  task: Task;
  boardMembers?: User[];
  onClose: () => void;
  onUpdate: (taskId: number, data: UpdateTaskDTO) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
}

const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];

const priorityColor: Record<Priority, string> = {
  Alta:  'bg-red-100 text-red-700 border-red-200',
  Media: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Baja:  'bg-green-100 text-green-700 border-green-200',
};

export const TaskDetailModal = ({
  task,
  boardMembers = [],
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) => {
  const { user } = useAuth();

  // ── Estado del formulario ─────────────────────────────────────────────
  const [title, setTitle]             = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority]       = useState<Priority>(task.priority);
  const [dueDate, setDueDate]         = useState(
    task.due_date ? task.due_date.slice(0, 10) : ''
  );
  const [assignedTo, setAssignedTo]   = useState<number | null>(task.assigned_to ?? null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  // ── Comentarios ───────────────────────────────────────────────────────
  const [comments, setComments]       = useState<TaskComment[]>([]);
  const [newComment, setNewComment]   = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [sendingComment, setSendingComment]   = useState(false);

  // ── Historial ─────────────────────────────────────────────────────────
  const [history, setHistory]         = useState<TaskHistory[]>([]);
  const [loadingHistory, setLoadingHistory]   = useState(true);
  const [activeTab, setActiveTab]     = useState<'comments' | 'history'>('comments');

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Cargar comentarios e historial
  useEffect(() => {
    tasksApi.getComments(task.id)
      .then(setComments)
      .catch(() => toast.error('Error al cargar comentarios'))
      .finally(() => setLoadingComments(false));

    tasksApi.getTaskHistory(task.id)
      .then(setHistory)
      .catch(() => toast.error('Error al cargar historial'))
      .finally(() => setLoadingHistory(false));
  }, [task.id]);

  // ── Guardar campo individual ──────────────────────────────────────────
  const saveField = async (field: string, data: UpdateTaskDTO) => {
    setSavingField(field);
    await onUpdate(task.id, data);
    setSavingField(null);
  };

  const handleTitleSave = async () => {
    if (title.trim() && title !== task.title) {
      await saveField('title', { title: title.trim() });
    }
    setEditingTitle(false);
  };

  // ── Comentarios ───────────────────────────────────────────────────────
  const handleSendComment = async () => {
    const content = newComment.trim();
    if (!content) return;
    setSendingComment(true);
    try {
      const created = await tasksApi.createComment(task.id, content);
      setComments(prev => [...prev, created]);
      setNewComment('');
    } catch {
      toast.error('Error al enviar comentario');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await tasksApi.deleteComment(task.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      toast.error('Error al eliminar comentario');
    }
  };

  // ── Eliminar tarea ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    await onDelete(task.id);
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1 mr-4">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') { setTitle(task.title); setEditingTitle(false); }
                  }}
                  className="flex-1 text-xl font-semibold border-b-2 border-blue-500 outline-none py-1"
                />
                <button onClick={handleTitleSave} className="text-green-600 hover:text-green-700">
                  {savingField === 'title'
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Check size={18} />}
                </button>
              </div>
            ) : (
              <h2
                className="text-xl font-semibold text-gray-800 cursor-pointer hover:text-blue-600 flex items-center gap-2 group"
                onClick={() => setEditingTitle(true)}
              >
                {title}
                <Edit2 size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="text-red-400 hover:text-red-600 p-1 transition-colors">
              <Trash2 size={18} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Cuerpo scrollable ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Campos: Prioridad / Fecha / Asignado ─────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Prioridad */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                <Flag size={12} className="inline mr-1" />Prioridad
              </label>
              <select
                value={priority}
                onChange={async e => {
                  const val = e.target.value as Priority;
                  setPriority(val);
                  await saveField('priority', { priority: val });
                }}
                className={`w-full text-sm px-3 py-2 rounded-lg border font-medium ${priorityColor[priority]} focus:outline-none`}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                <Calendar size={12} className="inline mr-1" />Fecha límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                onBlur={async () => {
                  await saveField('due_date', { due_date: dueDate || null });
                }}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Asignado a */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                <UserIcon size={12} className="inline mr-1" />Asignado a
              </label>
              <select
                value={assignedTo ?? ''}
                onChange={async e => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  setAssignedTo(val);
                  await saveField('assigned_to', { assigned_to: val });
                }}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {boardMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Descripción ──────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={async () => {
                if (description !== (task.description ?? '')) {
                  await saveField('description', { description });
                }
              }}
              placeholder="Añade una descripción..."
              rows={4}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* ── Tabs: Comentarios / Historial ─────────────────────────── */}
          <div>
            <div className="flex gap-4 border-b mb-4">
              {(['comments', 'history'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'comments'
                    ? <><MessageSquare size={14} className="inline mr-1" />Comentarios ({comments.length})</>
                    : <><Clock size={14} className="inline mr-1" />Historial</>}
                </button>
              ))}
            </div>

            {/* Comentarios */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Aún no hay comentarios. ¡Sé el primero!
                  </p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        {c.user?.avatar_url
                          ? <img src={c.user.avatar_url} alt={c.user.name} className="w-8 h-8 rounded-full" />
                          : <UserIcon size={14} className="text-gray-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {c.user?.name ?? 'Usuario'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {format(new Date(c.created_at), 'dd MMM HH:mm', { locale: es })}
                            </span>
                            {user?.id === c.user_id && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {/* Input nuevo comentario */}
                <div className="flex gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <UserIcon size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                      placeholder="Escribe un comentario..."
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={sendingComment || !newComment.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingComment
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Send size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Historial */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {loadingHistory ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Sin historial de cambios aún.
                  </p>
                ) : (
                  history.map(h => (
                    <div key={h.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">
                          {h.user?.name ?? 'Alguien'}
                        </span>{' '}
                        <span className="text-gray-500">{h.action}</span>
                        {h.old_value && h.new_value && (
                          <span className="text-gray-400">
                            {' '}· <s>{h.old_value}</s> → {h.new_value}
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(h.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};