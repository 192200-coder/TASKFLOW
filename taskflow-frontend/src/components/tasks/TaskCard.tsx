// src/components/tasks/TaskCard.tsx
'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, UpdateTaskDTO } from '@/lib/types/task';
import { User } from '@/lib/types/user';
import { PriorityBadge } from './PriorityBadge';
import { TaskDetailModal } from './TaskDetailModal';
import { Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  boardMembers?: User[];
  onUpdate?: (taskId: number, data: UpdateTaskDTO) => Promise<void>;
  onDelete?: (taskId: number) => Promise<void>;
}

export const TaskCard = ({ task, boardMembers = [], onUpdate, onDelete }: TaskCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setModalOpen(true)}
        className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow ${
          isOverdue ? 'border-l-4 border-red-400' : ''
        }`}
      >
        <div className="mb-2">
          <PriorityBadge priority={task.priority} />
        </div>

        <h4 className="font-medium text-gray-800 mb-2">{task.title}</h4>

        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          {task.due_date && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar size={12} />
              <span>{format(new Date(task.due_date), 'dd MMM', { locale: es })}</span>
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center gap-1">
              {task.assignee.avatar_url ? (
                <img src={task.assignee.avatar_url} alt={task.assignee.name} className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserIcon size={12} />
                </div>
              )}
              <span>{task.assignee.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </div>

      {modalOpen && onUpdate && onDelete && (
        <TaskDetailModal
          task={task}
          boardMembers={boardMembers}
          onClose={() => setModalOpen(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
};