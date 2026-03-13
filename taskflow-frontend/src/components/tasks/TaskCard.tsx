// src/components/tasks/TaskCard.tsx
'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, UpdateTaskDTO } from '@/lib/types/task';
import { User } from '@/lib/types/user';
import { TaskDetailModal } from './TaskDetailModal';
import { Calendar, AlertCircle, Minus, CheckCircle2, UserIcon } from 'lucide-react';
import { isAfter, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  boardMembers?: User[];
  columnName?: string;
  onUpdate?: (taskId: number, data: UpdateTaskDTO) => Promise<void>;
  onDelete?: (taskId: number) => Promise<void>;
  isDragOverlay?: boolean;
}

const PRIORITY_STYLE = {
  Alta:  { color: '#c0392b', bg: 'rgba(192,57,43,.1)',  icon: <AlertCircle  size={11} />, bar: '#c0392b'       },
  Media: { color: '#b7770d', bg: 'rgba(232,145,58,.1)', icon: <Minus        size={11} />, bar: 'var(--amber)'  },
  Baja:  { color: '#1e7e34', bg: 'rgba(39,174,96,.1)',  icon: <CheckCircle2 size={11} />, bar: '#27ae60'       },
};

export const TaskCard = ({
  task,
  boardMembers = [],
  columnName,
  onUpdate,
  onDelete,
  isDragOverlay = false,
}: TaskCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id: `task-${task.id}`,
    disabled: isDragOverlay,
  });

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
  };

  const priority  = PRIORITY_STYLE[task.priority as keyof typeof PRIORITY_STYLE] ?? PRIORITY_STYLE.Media;
  const isOverdue = task.due_date && isAfter(new Date(), parseISO(task.due_date));
  const assignee  = task.assignee ?? boardMembers.find(m => m.id === task.assigned_to);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging || isDragOverlay) return;
    setModalOpen(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        className="group relative rounded-xl border cursor-grab active:cursor-grabbing select-none"
        style={{
          ...(style as React.CSSProperties),
          background:  isDragging ? 'rgba(255,255,255,.5)' : 'white',
          borderColor: isDragging ? 'rgba(13,15,20,.15)'   : 'rgba(13,15,20,.07)',
          boxShadow:   isDragging
            ? '0 16px 48px rgba(13,15,20,.18), 0 4px 12px rgba(13,15,20,.1)'
            : '0 1px 3px rgba(13,15,20,.05)',
          opacity:    isDragging ? 0.5 : 1,
          transition: (style as React.CSSProperties).transition
            ?? 'box-shadow .15s ease, border-color .15s ease, opacity .15s ease',
          overflow:   'hidden',
          // ─── FIX MÓVIL ───────────────────────────────────────────────────
          // touch-action: none le dice al browser que NO intente hacer scroll
          // mientras el dedo está sobre la tarjeta, cediendo el control del
          // touch event a dnd-kit. Sin esto el browser compite con dnd-kit,
          // la card "tiembla" pero no se mueve entre columnas.
          touchAction: 'none',
        }}
        onMouseOver={e => {
          if (!isDragging && !isDragOverlay) {
            (e.currentTarget as HTMLElement).style.boxShadow   = '0 4px 16px rgba(13,15,20,.1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,15,20,.13)';
          }
        }}
        onMouseOut={e => {
          if (!isDragging && !isDragOverlay) {
            (e.currentTarget as HTMLElement).style.boxShadow   = '0 1px 3px rgba(13,15,20,.05)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,15,20,.07)';
          }
        }}
      >
        {/* Barra de prioridad izquierda */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{ background: priority.bar }}
        />

        <div className="px-3 py-3 pl-4">
          {/* Badge prioridad */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: priority.bg, color: priority.color }}
            >
              {priority.icon}
              {task.priority}
            </span>

            {!assignee && !isDragOverlay && (
              <span
                className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5"
                style={{ background: 'var(--cream)', color: 'var(--ink-muted)' }}
                title="Sin responsable"
              >
                <UserIcon size={10} />
              </span>
            )}
          </div>

          {/* Título */}
          <p
            className="text-sm font-medium leading-snug mb-2.5"
            style={{ color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif" }}
          >
            {task.title}
          </p>

          {/* Fecha + avatar */}
          <div className="flex items-center justify-between">
            {task.due_date ? (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: isOverdue ? '#c0392b' : 'var(--ink-muted)' }}
              >
                <Calendar size={10} />
                {format(parseISO(task.due_date), 'dd MMM', { locale: es })}
                {isOverdue && ' ⚠'}
              </span>
            ) : <span />}

            {assignee && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white"
                style={{ background: 'var(--teal)', boxShadow: '0 1px 4px rgba(13,15,20,.15)' }}
                title={assignee.name}
              >
                {assignee.avatar_url
                  ? <img src={assignee.avatar_url} alt={assignee.name} className="w-full h-full rounded-full object-cover" />
                  : assignee.name.charAt(0).toUpperCase()
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && onUpdate && onDelete && (
        <TaskDetailModal
          task={task}
          boardMembers={boardMembers}
          columnName={columnName}
          onClose={() => setModalOpen(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
};