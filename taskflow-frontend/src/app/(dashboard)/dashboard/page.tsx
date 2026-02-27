// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useBoards } from '@/lib/hooks/useBoards';
import { BoardCard } from '@/components/boards/BoardCard';
import { CreateBoardModal } from '@/components/boards/CreateBoardModal';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Board } from '@/lib/types/board';

export default function DashboardPage() {
  const { boards, loading, createBoard } = useBoards();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando tableros...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Tableros</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Nuevo Tablero
        </Button>
      </div>

      {/* Tableros que poseo */}
      {boards.owned?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Mis tableros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.owned.map((board) => (
              <BoardCard key={board.id} board={board} isOwner />
            ))}
          </div>
        </div>
      )}

      {/* Tableros donde soy miembro */}
      {boards.member?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Tableros compartidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.member.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        </div>
      )}

      {(!boards.owned?.length && !boards.member?.length) && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tienes tableros aún</p>
          <Button onClick={() => setIsModalOpen(true)}>
            Crear tu primer tablero
          </Button>
        </div>
      )}

      {/* ✅ createBoard viene del mismo useBoards que renderiza la lista */}
      <CreateBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateBoard={createBoard}
      />
    </div>
  );
}