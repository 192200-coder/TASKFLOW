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

export const Column = ({ column, boardMembers = [], onTaskCreate, onTaskUpdate, onTaskDelete }: ColumnProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const { setNodeRef } = useDroppable({ id: `column-${column.id}` });

  const handleAddTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setSaving(true);
    const created = await onTaskCreate({
      title,
      column_id: column.id,
      position: column.tasks?.length ?? 0,
    });
    setSaving(false);
    if (created) { setNewTitle(''); setIsAdding(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddTask();
    if (e.key === 'Escape') { setIsAdding(false); setNewTitle(''); }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4 min-w-[300px] max-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">{column.name}</h3>
        <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-xs">
          {column.tasks?.length || 0}
        </span>
      </div>

      <div ref={setNodeRef} className="min-h-[200px] transition-colors">
        <SortableContext
          items={column.tasks?.map(t => `task-${t.id}`) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {column.tasks?.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                boardMembers={boardMembers}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      {isAdding ? (
        <div className="mt-4 space-y-2">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre de la tarea..."
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTask}
              disabled={saving || !newTitle.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Añadir
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewTitle(''); }}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-500 text-sm rounded-md hover:bg-gray-200 transition-colors"
            >
              <X size={14} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 w-full flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Plus size={16} />
          <span className="text-sm">Añadir tarea</span>
        </button>
      )}
    </div>
  );
};