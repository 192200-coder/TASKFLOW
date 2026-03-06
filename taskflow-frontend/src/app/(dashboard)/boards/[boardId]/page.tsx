// src/app/(dashboard)/boards/[boardId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { boardsApi } from '@/lib/api/boards';
import { Board, BoardMemberUser, Column } from '@/lib/types/board';
import { User } from '@/lib/types/user';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { InviteMemberModal } from '@/components/boards/InviteMemberModal';
import { ColumnManager } from '@/components/boards/ColumnManager';
import { useTasks } from '@/lib/hooks/useTasks';
import { UserPlus, LayoutList, ChevronRight, Trash2, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function BoardPage() {
  const params   = useParams();
  const router   = useRouter();
  const boardId  = parseInt(params.boardId as string);

  const [board,          setBoard]          = useState<Board | null>(null);
  const [boardMembers,   setBoardMembers]   = useState<User[]>([]);
  const [pageLoading,    setPageLoading]    = useState(true);
  const [showInvite,     setShowInvite]     = useState(false);
  const [showColumns,    setShowColumns]    = useState(false);
  const [showBoardMenu,  setShowBoardMenu]  = useState(false);
  const [deletingBoard,  setDeletingBoard]  = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  const { columns, createTask, updateTask, moveTask, deleteTask, setColumnsFromBoard } =
    useTasks(board?.columns ?? []);

  const loadBoard = useCallback(async () => {
    try {
      const data = await boardsApi.getBoard(boardId);
      setBoard(data);
      const members: User[] = [];
      if (data.owner) members.push(data.owner);
      data.members?.forEach((m: BoardMemberUser) => {
        if (!members.find(u => u.id === m.id)) members.push(m);
      });
      setBoardMembers(members);
    } catch {
      toast.error('Error al cargar el tablero');
    } finally {
      setPageLoading(false);
    }
  }, [boardId]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  const handleMemberAdded = (newMember: BoardMemberUser) => {
    setBoard(prev => {
      if (!prev) return prev;
      if (prev.members?.some(m => m.id === newMember.id)) return prev;
      return { ...prev, members: [...(prev.members ?? []), newMember] };
    });
    setBoardMembers(prev =>
      prev.some(m => m.id === newMember.id) ? prev : [...prev, newMember]
    );
  };

  // Tras cambiar un rol, recargar el board desde el servidor
  // para que el estado local refleje la fuente de verdad del backend
  const handleMemberRoleChanged = useCallback(async () => {
    try {
      const data = await boardsApi.getBoard(boardId);
      setBoard(data);
    } catch { /* silencioso */ }
  }, [boardId]);

  const handleColumnsChange = (updatedColumns: Column[]) => {
    setColumnsFromBoard(updatedColumns);
    setBoard(prev => prev ? { ...prev, columns: updatedColumns } : prev);
  };

  const handleDeleteBoard = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeletingBoard(true);
    try {
      await boardsApi.deleteBoard(boardId);
      toast.success('Tablero eliminado');
      router.push('/dashboard');
    } catch {
      toast.error('Error al eliminar el tablero');
      setDeletingBoard(false);
      setConfirmDelete(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Cargando tablero...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>Tablero no encontrado</p>
          <Link href="/dashboard" className="text-sm" style={{ color: 'var(--amber)' }}>← Volver al dashboard</Link>
        </div>
      </div>
    );
  }

  const displayMembers = board.members ?? [];

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(13,15,20,.07)', background: 'var(--surface)' }}
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <ChevronRight size={12} />
            <span>Tableros</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--ink)' }}>{board.name}</span>
          </div>
          <h1
            className="font-extrabold leading-none"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.2rem', letterSpacing: '-.02em', color: 'var(--ink)' }}
          >
            {board.name}
          </h1>
          {board.description && (
            <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)', maxWidth: 400 }}>
              {board.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Avatares */}
          <div className="flex -space-x-2">
            {displayMembers.slice(0, 4).map(member => (
              <div
                key={member.id}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white font-bold text-xs"
                style={{
                  background:  board.owner_id === member.id ? 'var(--amber)' : 'var(--teal)',
                  borderColor: 'var(--surface)',
                }}
                title={member.name}
              >
                {member.avatar_url
                  ? <img src={member.avatar_url} alt={member.name} className="w-full h-full rounded-full object-cover" />
                  : member.name.charAt(0).toUpperCase()
                }
              </div>
            ))}
            {displayMembers.length > 4 && (
              <div
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
                style={{ background: 'var(--cream)', borderColor: 'var(--surface)', color: 'var(--ink-muted)' }}
              >
                +{displayMembers.length - 4}
              </div>
            )}
          </div>

          <div className="w-px h-6" style={{ background: 'rgba(13,15,20,.1)' }} />

          <button
            onClick={() => setShowColumns(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink-muted)', background: 'transparent' }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
            onMouseOut={e  => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LayoutList size={14} /> Columnas
          </button>

          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ fontFamily: "'Syne', sans-serif", background: 'var(--ink)', color: 'var(--paper)' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.opacity = '.85'}
            onMouseOut={e  => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            <UserPlus size={14} /> Invitar
          </button>

          {/* Menú contextual del tablero */}
          <div className="relative">
            <button
              onClick={() => { setShowBoardMenu(p => !p); setConfirmDelete(false); }}
              className="p-2 rounded-xl transition-all"
              style={{ color: 'var(--ink-muted)' }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}
              onMouseOut={e  => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              title="Opciones del tablero"
            >
              <MoreVertical size={16} />
            </button>

            {showBoardMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => { setShowBoardMenu(false); setConfirmDelete(false); }} />
                <div
                  className="absolute right-0 mt-1 rounded-xl border overflow-hidden z-40"
                  style={{
                    background:  'white',
                    borderColor: 'rgba(13,15,20,.09)',
                    boxShadow:   '0 8px 24px rgba(13,15,20,.14)',
                    minWidth:    180,
                  }}
                >
                  {!confirmDelete ? (
                    <button
                      onClick={handleDeleteBoard}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors text-left"
                      style={{ color: '#c0392b' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(192,57,43,.07)')}
                      onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Trash2 size={14} />
                      Eliminar tablero
                    </button>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                        ¿Eliminar permanentemente?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteBoard}
                          disabled={deletingBoard}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                          style={{ background: '#c0392b' }}
                        >
                          {deletingBoard ? 'Eliminando...' : 'Sí, eliminar'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                          style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink-muted)' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-auto p-6">
        <KanbanBoard
          columns={columns}
          boardMembers={boardMembers}
          onTaskMove={moveTask}
          onTaskCreate={createTask}
          onTaskUpdate={updateTask}
          onTaskDelete={deleteTask}
        />
      </div>

      {showInvite && (
        <InviteMemberModal
          board={board}
          onClose={() => setShowInvite(false)}
          onMemberAdded={handleMemberAdded}
          onMemberRoleChanged={handleMemberRoleChanged}
        />
      )}

      {showColumns && (
        <ColumnManager
          boardId={boardId}
          columns={columns}
          onColumnsChange={handleColumnsChange}
          onClose={() => setShowColumns(false)}
        />
      )}
    </div>
  );
}