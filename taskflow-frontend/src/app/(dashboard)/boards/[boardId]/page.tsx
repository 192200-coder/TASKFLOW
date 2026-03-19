// src/app/(dashboard)/boards/[boardId]/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { boardsApi } from '@/lib/api/boards';
import { Board, BoardMemberUser, Column } from '@/lib/types/board';
import { User } from '@/lib/types/user';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { InviteMemberModal } from '@/components/boards/InviteMemberModal';
import { ColumnManager } from '@/components/boards/ColumnManager';
import { TaskFilterBar, ActiveFilters, EMPTY_FILTERS } from '@/components/tasks/TaskFilterBar';
import { useTasks } from '@/lib/hooks/useTasks';
import { UserPlus, LayoutList, ChevronRight, Trash2, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { isAfter, isBefore, parseISO } from 'date-fns';

export default function BoardPage() {
  const params  = useParams();
  const router  = useRouter();
  const boardId = parseInt(params.boardId as string);

  const [board,         setBoard]         = useState<Board | null>(null);
  const [boardMembers,  setBoardMembers]  = useState<User[]>([]);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [showInvite,    setShowInvite]    = useState(false);
  const [showColumns,   setShowColumns]   = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

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

  // ── Filtrado client-side ────────────────────────────────────────────────────
  const filteredColumns = useMemo(() => {
    const { q, priorities, assignedTo, columnId, dueBefore, dueAfter } = filters;

    const hasFilters = q || priorities.length > 0 || assignedTo !== null ||
                       columnId !== null || dueBefore || dueAfter;

    if (!hasFilters) return columns;

    return columns
      .filter(col => columnId === null || col.id === columnId)
      .map(col => ({
        ...col,
        tasks: (col.tasks ?? []).filter(task => {
          if (q && !task.title.toLowerCase().includes(q.toLowerCase())) return false;
          if (priorities.length > 0 && !priorities.includes(task.priority)) return false;
          if (assignedTo === 'unassigned' && task.assigned_to !== null) return false;
          if (typeof assignedTo === 'number' && task.assigned_to !== assignedTo) return false;
          if (dueAfter  && task.due_date && isBefore(parseISO(task.due_date), parseISO(dueAfter)))  return false;
          if (dueBefore && task.due_date && isAfter(parseISO(task.due_date),  parseISO(dueBefore))) return false;
          if ((dueAfter || dueBefore) && !task.due_date) return false;
          return true;
        }),
      }));
  }, [columns, filters]);

  // ── FIX: cuando hay filtro de columna activo, el drag-and-drop solo puede
  // soltar tareas en columnas que están visualmente presentes. Le pasamos
  // filteredColumns como allColumns para que dnd-kit no registre drop zones
  // de columnas ocultas. Cuando no hay filtro de columna, allColumns = columns
  // completo para que el drag entre columnas funcione normalmente.
  const dndAllColumns = useMemo(() => {
    return filters.columnId !== null ? filteredColumns : columns;
  }, [filters.columnId, filteredColumns, columns]);

  const totalTasks   = useMemo(() => columns.reduce((acc, c) => acc + (c.tasks?.length ?? 0), 0), [columns]);
  const visibleTasks = useMemo(() => filteredColumns.reduce((acc, c) => acc + (c.tasks?.length ?? 0), 0), [filteredColumns]);

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

      {/* ── Header ── */}
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
          <div className="hidden sm:flex -space-x-2">
            {displayMembers.slice(0, 4).map(member => (
              <div
                key={member.id}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white font-bold text-xs"
                style={{ background: board.owner_id === member.id ? 'var(--amber)' : 'var(--teal)', borderColor: 'var(--surface)' }}
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

          <div className="hidden sm:block w-px h-6" style={{ background: 'rgba(13,15,20,.1)' }} />

          <button
            onClick={() => setShowColumns(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink-muted)', background: 'transparent' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}
            onMouseOut={e  => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <LayoutList size={14} />
            <span className="hidden sm:inline">Columnas</span>
          </button>

          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ fontFamily: "'Syne', sans-serif", background: 'var(--ink)', color: 'var(--paper)' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.opacity = '.85'}
            onMouseOut={e  => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Invitar</span>
          </button>

          <div className="relative">
            <button
              onClick={() => { setShowBoardMenu(p => !p); setConfirmDelete(false); }}
              className="p-2 rounded-xl transition-all"
              style={{ color: 'var(--ink-muted)' }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}
              onMouseOut={e  => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <MoreVertical size={16} />
            </button>
            {showBoardMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => { setShowBoardMenu(false); setConfirmDelete(false); }} />
                <div
                  className="absolute right-0 mt-1 rounded-xl border overflow-hidden z-40"
                  style={{ background: 'white', borderColor: 'rgba(13,15,20,.09)', boxShadow: '0 8px 24px rgba(13,15,20,.14)', minWidth: 180 }}
                >
                  {!confirmDelete ? (
                    <button
                      onClick={handleDeleteBoard}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors text-left"
                      style={{ color: '#c0392b' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(192,57,43,.07)')}
                      onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Trash2 size={14} /> Eliminar tablero
                    </button>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink)' }}>¿Eliminar permanentemente?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteBoard}
                          disabled={deletingBoard}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                          style={{ background: '#c0392b' }}
                        >
                          {deletingBoard ? 'Eliminando...' : 'Sí, eliminar'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold border"
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

      {/* ── Barra de filtros ── */}
      <TaskFilterBar
        boardMembers={boardMembers}
        columns={columns}
        filters={filters}
        totalTasks={totalTasks}
        visibleTasks={visibleTasks}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      {/* ── Kanban ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto sm:p-6 pt-4 sm:pt-6 px-0 sm:px-6">
          <KanbanBoard
            columns={filteredColumns}
            allColumns={dndAllColumns}
            boardMembers={boardMembers}
            onTaskMove={moveTask}
            onTaskCreate={createTask}
            onTaskUpdate={updateTask}
            onTaskDelete={deleteTask}
          />
        </div>
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