// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useBoards } from '@/lib/hooks/useBoards';
import { BoardCard } from '@/components/boards/BoardCard';
import { CreateBoardModal } from '@/components/boards/CreateBoardModal';
import { Button } from '@/components/ui/Button';
import { Plus, LayoutDashboard, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const { boards, loading, createBoard } = useBoards();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalBoards = (boards.owned?.length ?? 0) + (boards.member?.length ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2
            className="animate-spin mx-auto mb-3"
            size={24}
            style={{ color: 'var(--amber)' }}
          />
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Cargando tableros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header de página */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="font-extrabold leading-none mb-1"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
              letterSpacing: '-.03em',
              color: 'var(--ink)',
            }}
          >
            Mis tableros
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            {totalBoards === 0
              ? 'Crea tu primer tablero para empezar'
              : `${totalBoards} ${totalBoards === 1 ? 'tablero' : 'tableros'} en total`}
          </p>
        </div>
        <Button variant="amber" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Nuevo tablero
        </Button>
      </div>

      {/* Tableros propios */}
      {(boards.owned?.length ?? 0) > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: 'var(--ink-muted)' }}
            >
              Creados por mí
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}
            >
              {boards.owned.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.owned.map(board => (
              <BoardCard key={board.id} board={board} isOwner />
            ))}
          </div>
        </section>
      )}

      {/* Tableros compartidos */}
      {(boards.member?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: 'var(--ink-muted)' }}
            >
              Compartidos conmigo
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--teal-dim)', color: 'var(--teal)' }}
            >
              {boards.member.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.member.map(board => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {totalBoards === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed"
          style={{ borderColor: 'rgba(13,15,20,.1)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--amber-dim)' }}
          >
            <LayoutDashboard size={24} style={{ color: 'var(--amber)' }} />
          </div>
          <p
            className="font-bold mb-1"
            style={{ fontFamily: "'Syne', sans-serif", color: 'var(--ink)', letterSpacing: '-.02em' }}
          >
            Sin tableros aún
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            Crea tu primer tablero y empieza a organizar tu equipo
          </p>
          <Button variant="amber" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Crear tablero
          </Button>
        </div>
      )}

      <CreateBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateBoard={createBoard}
      />
    </div>
  );
}