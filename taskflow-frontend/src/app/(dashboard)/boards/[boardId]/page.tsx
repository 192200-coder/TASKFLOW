// src/app/(dashboard)/boards/[boardId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { boardsApi } from '@/lib/api/boards';
import { Board } from '@/lib/types/board';
import { User } from '@/lib/types/user';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { useTasks } from '@/lib/hooks/useTasks';
import toast from 'react-hot-toast';

export default function BoardPage() {
  const params = useParams();
  const boardId = parseInt(params.boardId as string);
  const [board, setBoard] = useState<Board | null>(null);
  const [boardMembers, setBoardMembers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // ✅ Pasar las columnas del board a useTasks
  const {
    columns,
    loading: taskLoading,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
  } = useTasks(board?.columns ?? []);  // ← Aquí la magia

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const data = await boardsApi.getBoard(boardId);
        setBoard(data);
        // ✅ useTasks se sincronizará automáticamente por el useEffect interno
        const members: User[] = [];
        if (data.owner) members.push(data.owner);
        if (data.members) {
          data.members.forEach(m => {
            if (!members.find(u => u.id === m.id)) members.push(m);
          });
        }
        setBoardMembers(members);
      } catch (error) {
        toast.error('Error al cargar el tablero');
      } finally {
        setPageLoading(false);
      }
    };
    loadBoard();
  }, [boardId]);

  if (pageLoading) return <div>Cargando...</div>;
  if (!board) return <div>Tablero no encontrado</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{board.name}</h1>
        {board.description && (
          <p className="text-gray-600 mt-1">{board.description}</p>
        )}
      </div>

      <KanbanBoard
        columns={columns}
        boardMembers={boardMembers}
        onTaskMove={moveTask}
        onTaskCreate={createTask}
        onTaskUpdate={updateTask}
        onTaskDelete={deleteTask}
      />
    </div>
  );
}