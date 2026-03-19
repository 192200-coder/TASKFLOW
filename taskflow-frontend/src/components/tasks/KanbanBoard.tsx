// src/components/tasks/KanbanBoard.tsx
'use client';

import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
  closestCenter, DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType } from '@/lib/types/board';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/lib/types/task';
import { User } from '@/lib/types/user';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { useState, useRef } from 'react';

interface KanbanBoardProps {
  columns:      ColumnType[];
  allColumns?:  ColumnType[];
  boardMembers?: User[];
  onTaskMove:   (taskId: number, newColumnId: number, newPosition: number) => void;
  onTaskCreate: (data: CreateTaskDTO) => Promise<Task | null>;
  onTaskUpdate: (taskId: number, data: UpdateTaskDTO) => Promise<void>;
  onTaskDelete: (taskId: number) => Promise<void>;
}

export const KanbanBoard = ({
  columns,
  allColumns,
  boardMembers = [],
  onTaskMove,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
}: KanbanBoardProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColIdx, setActiveColIdx] = useState(0);

  const allColumnsRef = useRef<ColumnType[]>(allColumns ?? columns);
  allColumnsRef.current = allColumns ?? columns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const findTask = (taskId: number): Task | null => {
    for (const col of allColumnsRef.current) {
      const found = col.tasks?.find(t => t.id === taskId);
      if (found) return found;
    }
    return null;
  };

  const findColumnOfTask = (taskId: number): ColumnType | null =>
    allColumnsRef.current.find(col => col.tasks?.some(t => t.id === taskId)) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    const rawId = event.active.id as string;
    if (rawId.startsWith('task-')) {
      setActiveTask(findTask(parseInt(rawId.replace('task-', ''), 10)));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeRaw = active.id as string;
    const overRaw   = over.id   as string;
    if (!activeRaw.startsWith('task-')) return;

    const taskId        = parseInt(activeRaw.replace('task-', ''), 10);
    const currentColumn = findColumnOfTask(taskId);
    if (!currentColumn) return;

    let targetColumnId: number = currentColumn.id;
    let targetPosition         = 0;

    if (overRaw.startsWith('column-')) {
      targetColumnId = parseInt(overRaw.replace('column-', ''), 10);
      const targetCol = allColumnsRef.current.find(c => c.id === targetColumnId);
      targetPosition  = targetCol?.tasks?.length ?? 0;
    } else if (overRaw.startsWith('task-')) {
      const overTaskId = parseInt(overRaw.replace('task-', ''), 10);
      const overColumn = findColumnOfTask(overTaskId);
      if (!overColumn) return;
      targetColumnId = overColumn.id;
      targetPosition = overColumn.tasks?.findIndex(t => t.id === overTaskId) ?? 0;
    }

    const currentPosition   = currentColumn.tasks?.findIndex(t => t.id === taskId) ?? 0;
    const sameColumnSamePos = currentColumn.id === targetColumnId && currentPosition === targetPosition;
    if (!sameColumnSamePos) onTaskMove(taskId, targetColumnId, targetPosition);
  };

  const sorted = [...columns].sort((a, b) => a.position - b.position);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sorted.map(c => `column-${c.id}`)}
        strategy={horizontalListSortingStrategy}
      >
        {/* ── Indicador de columna activa (solo móvil) ── */}
        {sorted.length > 1 && (
          <div className="flex sm:hidden justify-center gap-1.5 mb-3 flex-shrink-0">
            {sorted.map((col, idx) => (
              <div
                key={col.id}
                className="rounded-full transition-all"
                style={{
                  width:      idx === activeColIdx ? 20 : 6,
                  height:     6,
                  background: idx === activeColIdx ? 'var(--amber)' : 'rgba(13,15,20,.15)',
                }}
              />
            ))}
          </div>
        )}

        <div
          className="flex gap-4 overflow-x-auto pb-4 h-full items-start"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX:     'contain',
            touchAction:             'pan-x',
            // Scroll snap solo en móvil — en desktop scroll libre
            scrollSnapType:          'x mandatory',
            // Padding lateral para que la columna no quede pegada al borde en móvil
            paddingLeft:             'max(16px, env(safe-area-inset-left))',
            paddingRight:            'max(16px, env(safe-area-inset-right))',
          }}
          onScroll={e => {
            // Actualizar indicador de columna activa
            const el = e.currentTarget;
            const scrollLeft = el.scrollLeft;
            const colWidth = el.scrollWidth / sorted.length;
            setActiveColIdx(Math.round(scrollLeft / colWidth));
          }}
        >
          {sorted.map(column => (
            <Column
              key={column.id}
              column={column}
              boardMembers={boardMembers}
              onTaskCreate={onTaskCreate}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(.18,.67,.6,1.22)' }}>
        {activeTask && (
          <div style={{ transform: 'rotate(2deg)', filter: 'drop-shadow(0 20px 40px rgba(13,15,20,.25))' }}>
            <TaskCard task={activeTask} boardMembers={boardMembers} isDragOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};