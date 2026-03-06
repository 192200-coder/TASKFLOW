// src/components/boards/ColumnManager.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext, DragEndEvent, PointerSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column } from '@/lib/types/board';
import { columnsApi } from '@/lib/api/columns';
import {
  GripVertical, Pencil, Trash2, Check, X,
  Plus, Loader2, LayoutList,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ColumnManagerProps {
  boardId: number;
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  onClose: () => void;
}

/* ── Fila drag-sortable de columna ──────────────────────────────────────────── */
const SortableColumnRow = ({
  column,
  onRename,
  onDelete,
}: {
  column: Column;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) => {
  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(column.name);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm,  setConfirm]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex:  isDragging ? 10 : 'auto',
  };

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre no puede estar vacío'); return; }
    if (name.trim() === column.name) { setEditing(false); return; }
    setSaving(true);
    await onRename(column.id, name.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(column.id);
  };

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
      style={{
        ...(style as React.CSSProperties),
        background:  isDragging ? 'var(--cream)' : 'white',
        borderColor: isDragging ? 'var(--amber)' : 'rgba(13,15,20,.08)',
        boxShadow:   isDragging ? '0 8px 24px rgba(13,15,20,.12)' : 'none',
      }}
    >
      {/* Handle de arrastre */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors"
        style={{ color: 'var(--ink-muted)', touchAction: 'none' }}
        onMouseOver={e => (e.currentTarget.style.color = 'var(--ink)')}
        onMouseOut={e  => (e.currentTarget.style.color = 'var(--ink-muted)')}
      >
        <GripVertical size={16} />
      </button>

      {/* Nombre / input edición */}
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter')  handleSave();
            if (e.key === 'Escape') { setName(column.name); setEditing(false); }
          }}
          className="flex-1 px-3 py-1 text-sm rounded-lg border-[1.5px] outline-none"
          style={{ borderColor: 'var(--amber)', background: 'var(--paper)', color: 'var(--ink)' }}
        />
      ) : (
        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--ink)' }}>
          {column.name}
        </span>
      )}

      {/* Posición */}
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: 'var(--cream)', color: 'var(--ink-muted)' }}
      >
        #{column.position + 1}
      </span>

      {/* Acciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(39,174,96,.12)', color: '#27ae60' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button
              onClick={() => { setName(column.name); setEditing(false); }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--ink-muted)' }}
            >
              <X size={14} />
            </button>
          </>
        ) : confirm ? (
          <>
            <span className="text-xs" style={{ color: '#c0392b' }}>¿Eliminar?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 text-xs font-semibold rounded-lg transition-colors"
              style={{ background: '#c0392b', color: 'white' }}
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Sí'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="px-2 py-1 text-xs rounded-lg border transition-colors"
              style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink-muted)' }}
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--ink-muted)' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseOut={e  => (e.currentTarget.style.color = 'var(--ink-muted)')}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirm(true)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--ink-muted)' }}
              onMouseOver={e => (e.currentTarget.style.color = '#c0392b')}
              onMouseOut={e  => (e.currentTarget.style.color = 'var(--ink-muted)')}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Componente principal ────────────────────────────────────────────────────── */
export const ColumnManager = ({ boardId, columns, onColumnsChange, onClose }: ColumnManagerProps) => {
  const [localColumns, setLocalColumns] = useState([...columns].sort((a, b) => a.position - b.position));
  const [newColName,   setNewColName]   = useState('');
  const [creating,     setCreating]     = useState(false);
  const [showInput,    setShowInput]    = useState(false);
  const newColRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { if (showInput) newColRef.current?.focus(); }, [showInput]);

  // ── Crear columna ─────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newColName.trim()) return;
    setCreating(true);
    try {
      const response = await columnsApi.createColumn({
        name: newColName.trim(),
        board_id: boardId,
        position: localColumns.length,
      });
      const updated = [...localColumns, response.column];
      setLocalColumns(updated);
      onColumnsChange(updated);
      setNewColName('');
      setShowInput(false);
      toast.success('Columna creada');
    } catch {
      toast.error('Error al crear la columna');
    } finally {
      setCreating(false);
    }
  };

  // ── Renombrar columna ─────────────────────────────────────────────────
  const handleRename = async (id: number, name: string) => {
    try {
      await columnsApi.updateColumn(id, { name });
      const updated = localColumns.map(c => c.id === id ? { ...c, name } : c);
      setLocalColumns(updated);
      onColumnsChange(updated);
      toast.success('Columna renombrada');
    } catch {
      toast.error('Error al renombrar la columna');
    }
  };

  // ── Eliminar columna ──────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await columnsApi.deleteColumn(id);
      const updated = localColumns
        .filter(c => c.id !== id)
        .map((c, i) => ({ ...c, position: i }));
      setLocalColumns(updated);
      onColumnsChange(updated);
      toast.success('Columna eliminada');
    } catch {
      toast.error('Error al eliminar la columna');
    }
  };

  // ── Reordenar (drag & drop) ───────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localColumns.findIndex(c => c.id === active.id);
    const newIndex = localColumns.findIndex(c => c.id === over.id);
    const reordered = arrayMove(localColumns, oldIndex, newIndex).map((c, i) => ({ ...c, position: i }));

    setLocalColumns(reordered);
    onColumnsChange(reordered);

    try {
      await columnsApi.reorderColumns(boardId, reordered.map(c => ({ id: c.id, position: c.position })));
    } catch {
      // Revertir
      setLocalColumns([...columns].sort((a, b) => a.position - b.position));
      onColumnsChange(columns);
      toast.error('Error al reordenar columnas');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,15,20,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 480,
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(13,15,20,.25)',
          border: '1px solid rgba(13,15,20,.07)',
          animation: 'modalIn .2s cubic-bezier(.34,1.56,.64,1)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(13,15,20,.07)' }}>
          <div className="flex items-center gap-2">
            <LayoutList size={18} style={{ color: 'var(--amber)' }} />
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--ink)' }}>
              Gestionar columnas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--ink-muted)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(13,15,20,.06)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tip */}
        <div className="px-6 py-3 flex-shrink-0">
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Arrastra para reordenar · Haz clic en ✏ para renombrar · Elimina con 🗑
          </p>
        </div>

        {/* Lista de columnas */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localColumns.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {localColumns.map(col => (
                  <SortableColumnRow
                    key={col.id}
                    column={col}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {localColumns.length === 0 && (
            <div className="text-center py-8">
              <LayoutList size={28} style={{ color: 'var(--ink-muted)', margin: '0 auto 8px' }} />
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Sin columnas. Crea la primera.</p>
            </div>
          )}
        </div>

        {/* Añadir nueva columna */}
        <div className="px-6 pb-6 pt-2 border-t flex-shrink-0" style={{ borderColor: 'rgba(13,15,20,.07)' }}>
          {showInput ? (
            <div className="flex gap-2 mt-3">
              <input
                ref={newColRef}
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleCreate();
                  if (e.key === 'Escape') { setShowInput(false); setNewColName(''); }
                }}
                placeholder="Nombre de la columna..."
                className="flex-1 px-4 py-2.5 rounded-xl border-[1.5px] text-sm outline-none"
                style={{ borderColor: 'var(--amber)', background: 'var(--paper)', color: 'var(--ink)' }}
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newColName.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ fontFamily: "'Syne', sans-serif", background: 'var(--ink)', color: 'var(--paper)' }}
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Crear
              </button>
              <button
                onClick={() => { setShowInput(false); setNewColName(''); }}
                className="p-2.5 rounded-xl border transition-colors"
                style={{ borderColor: 'rgba(13,15,20,.1)', color: 'var(--ink-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="w-full flex items-center justify-center gap-2 mt-3 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all"
              style={{ borderColor: 'rgba(13,15,20,.12)', color: 'var(--ink-muted)' }}
              onMouseOver={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--amber)';
                (e.currentTarget as HTMLElement).style.color = 'var(--amber)';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,15,20,.12)';
                (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)';
              }}
            >
              <Plus size={15} /> Nueva columna
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};