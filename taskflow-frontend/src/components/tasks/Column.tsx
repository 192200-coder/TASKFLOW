// src/components/tasks/Column.tsx
'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType } from '@/lib/types/board';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/lib/types/task';
import { User } from '@/lib/types/user';
import { TaskCard } from './TaskCard';
import { Plus, X, Loader2 } from 'lucide-react';

interface ColumnProps {
  column: ColumnType;
  boardMembers?: User[];
  onTaskCreate: (data: CreateTaskDTO) => Promise<Task | null>;
  onTaskUpdate: (taskId: number, data: UpdateTaskDTO) => Promise<void>;
  onTaskDelete: (taskId: number) => Promise<void>;
}

export const Column = ({
  column,
  boardMembers = [],
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
}: ColumnProps) => {
  const [isAdding,  setIsAdding]  = useState(false);
  const [newTitle,  setNewTitle]  = useState('');
  const [saving,    setSaving]    = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}` });

  const taskCount = column.tasks?.length ?? 0;

  const handleAddTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setSaving(true);
    const created = await onTaskCreate({
      title,
      column_id: column.id,
      position:  taskCount,
    });
    setSaving(false);
    if (created) { setNewTitle(''); setIsAdding(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')  handleAddTask();
    if (e.key === 'Escape') { setIsAdding(false); setNewTitle(''); }
  };

  return (
    <div
      className="flex flex-col rounded-2xl transition-all"
      style={{
        minWidth: 296,
        maxWidth: 296,
        background: isOver ? 'rgba(232,145,58,.05)' : 'rgba(13,15,20,.03)',
        border: `1.5px solid ${isOver ? 'rgba(232,145,58,.3)' : 'rgba(13,15,20,.07)'}`,
        transition: 'background .15s ease, border-color .15s ease',
      }}
    >
      {/* Header de columna */}
      <div className="flex justify-between items-center px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <h3
            className="font-bold text-sm"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-.01em', color: 'var(--ink)' }}
          >
            {column.name}
          </h3>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(13,15,20,.07)', color: 'var(--ink-muted)' }}
        >
          {taskCount}
        </span>
      </div>

      {/* Drop zone + tareas */}
      <div
        ref={setNodeRef}
        className="flex-1 px-3 pb-3 space-y-2"
        style={{ minHeight: 120 }}
      >
        <SortableContext
          items={column.tasks?.map(t => `task-${t.id}`) || []}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks?.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              boardMembers={boardMembers}
              columnName={column.name}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
            />
          ))}
        </SortableContext>

        {/* Placeholder cuando está vacía y no se está arrastrando */}
        {taskCount === 0 && !isOver && (
          <div
            className="flex items-center justify-center h-16 rounded-xl border-2 border-dashed text-xs"
            style={{ borderColor: 'rgba(13,15,20,.08)', color: 'var(--ink-muted)' }}
          >
            Sin tareas
          </div>
        )}

        {/* Indicador visual de drop */}
        {isOver && (
          <div
            className="h-12 rounded-xl border-2 border-dashed flex items-center justify-center text-xs font-semibold"
            style={{ borderColor: 'var(--amber)', background: 'rgba(232,145,58,.06)', color: 'var(--amber)' }}
          >
            Soltar aquí
          </div>
        )}
      </div>

      {/* Input de nueva tarea */}
      <div className="px-3 pb-3">
        {isAdding ? (
          <div className="space-y-2">
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nombre de la tarea..."
              className="w-full px-3 py-2 text-sm rounded-xl border-[1.5px] outline-none transition-all"
              style={{
                borderColor: 'var(--amber)',
                background:  'white',
                color:       'var(--ink)',
                boxShadow:   '0 0 0 3px rgba(232,145,58,.1)',
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                disabled={saving || !newTitle.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                style={{ fontFamily: "'Syne', sans-serif", background: 'var(--ink)', color: 'var(--paper)' }}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Añadir
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewTitle(''); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors"
                style={{ color: 'var(--ink-muted)' }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(13,15,20,.06)')}
                onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={12} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: 'var(--ink-muted)' }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(13,15,20,.05)';
              (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)';
            }}
          >
            <Plus size={14} />
            <span>Añadir tarea</span>
          </button>
        )}
      </div>
    </div>
  );
};