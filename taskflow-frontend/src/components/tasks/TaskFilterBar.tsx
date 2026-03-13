// src/components/tasks/TaskFilterBar.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, AlertCircle, Minus, CheckCircle2 } from 'lucide-react';
import { User } from '@/lib/types/user';
import { Column } from '@/lib/types/board';

export interface ActiveFilters {
  q:           string;
  priorities:  string[];   // [] = todos
  assignedTo:  number | 'unassigned' | null;  // null = todos
  columnId:    number | null;
  dueBefore:   string;
  dueAfter:    string;
}

export const EMPTY_FILTERS: ActiveFilters = {
  q:          '',
  priorities: [],
  assignedTo: null,
  columnId:   null,
  dueBefore:  '',
  dueAfter:   '',
};

interface TaskFilterBarProps {
  boardMembers: User[];
  columns:      Column[];
  filters:      ActiveFilters;
  totalTasks:   number;
  visibleTasks: number;
  onChange:     (filters: ActiveFilters) => void;
  onClear:      () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'Alta',  label: 'Alta',  icon: <AlertCircle  size={12} />, color: '#c0392b', bg: 'rgba(192,57,43,.1)'  },
  { value: 'Media', label: 'Media', icon: <Minus        size={12} />, color: '#b7770d', bg: 'rgba(232,145,58,.1)' },
  { value: 'Baja',  label: 'Baja',  icon: <CheckCircle2 size={12} />, color: '#1e7e34', bg: 'rgba(39,174,96,.1)'  },
];

export const TaskFilterBar = ({
  boardMembers,
  columns,
  filters,
  totalTasks,
  visibleTasks,
  onChange,
  onClear,
}: TaskFilterBarProps) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    filters.q !== '' ||
    filters.priorities.length > 0 ||
    filters.assignedTo !== null ||
    filters.columnId   !== null ||
    filters.dueBefore  !== '' ||
    filters.dueAfter   !== '';

  const activeFilterCount = [
    filters.q !== '',
    filters.priorities.length > 0,
    filters.assignedTo !== null,
    filters.columnId   !== null,
    filters.dueBefore  !== '' || filters.dueAfter !== '',
  ].filter(Boolean).length;

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const set = useCallback(
    (partial: Partial<ActiveFilters>) => onChange({ ...filters, ...partial }),
    [filters, onChange]
  );

  const togglePriority = (p: string) => {
    const current = filters.priorities;
    set({
      priorities: current.includes(p)
        ? current.filter(x => x !== p)
        : [...current, p],
    });
  };

  return (
    <div
      className="flex flex-col gap-2 px-6 py-3 border-b flex-shrink-0"
      style={{ borderColor: 'rgba(13,15,20,.07)', background: 'var(--surface)' }}
    >
      <div className="flex items-center gap-3">

        {/* ── Búsqueda por título ── */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--ink-muted)' }}
          />
          <input
            type="text"
            value={filters.q}
            onChange={e => set({ q: e.target.value })}
            placeholder="Buscar tareas..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border-[1.5px] text-sm outline-none transition-all"
            style={{
              borderColor: filters.q ? 'var(--amber)' : 'rgba(13,15,20,.1)',
              background:  'var(--paper)',
              color:       'var(--ink)',
              boxShadow:   filters.q ? '0 0 0 3px rgba(232,145,58,.1)' : 'none',
            }}
            onFocus={e  => (e.target.style.borderColor = 'var(--amber)')}
            onBlur={e   => (e.target.style.borderColor = filters.q ? 'var(--amber)' : 'rgba(13,15,20,.1)')}
          />
          {filters.q && (
            <button
              onClick={() => set({ q: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-muted)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* ── Botón filtros avanzados ── */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelOpen(p => !p)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border-[1.5px] text-sm font-medium transition-all"
            style={{
              borderColor: panelOpen || activeFilterCount > 0 ? 'var(--amber)' : 'rgba(13,15,20,.1)',
              background:  panelOpen || activeFilterCount > 0 ? 'rgba(232,145,58,.08)' : 'transparent',
              color:       panelOpen || activeFilterCount > 0 ? 'var(--amber)' : 'var(--ink-muted)',
            }}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--amber)', color: 'white' }}
              >
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={13}
              style={{ transform: panelOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }}
            />
          </button>

          {/* ── Panel de filtros avanzados ── */}
          {panelOpen && (
            <div
              className="absolute left-0 mt-2 rounded-2xl border z-30"
              style={{
                background:  'white',
                borderColor: 'rgba(13,15,20,.09)',
                boxShadow:   '0 12px 40px rgba(13,15,20,.14)',
                minWidth:    320,
                padding:     20,
              }}
            >
              <div className="space-y-5">

                {/* Prioridad */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                    Prioridad
                  </p>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map(opt => {
                      const active = filters.priorities.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => togglePriority(opt.value)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-[1.5px] transition-all"
                          style={{
                            borderColor: active ? opt.color : 'rgba(13,15,20,.1)',
                            background:  active ? opt.bg   : 'transparent',
                            color:       active ? opt.color : 'var(--ink-muted)',
                          }}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Responsable */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                    Responsable
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* Sin asignar */}
                    <button
                      onClick={() => set({ assignedTo: filters.assignedTo === 'unassigned' ? null : 'unassigned' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-[1.5px] transition-all"
                      style={{
                        borderColor: filters.assignedTo === 'unassigned' ? 'var(--amber)' : 'rgba(13,15,20,.1)',
                        background:  filters.assignedTo === 'unassigned' ? 'var(--amber-dim)' : 'transparent',
                        color:       filters.assignedTo === 'unassigned' ? 'var(--amber)' : 'var(--ink-muted)',
                      }}
                    >
                      Sin asignar
                    </button>
                    {boardMembers.map(member => {
                      const active = filters.assignedTo === member.id;
                      return (
                        <button
                          key={member.id}
                          onClick={() => set({ assignedTo: active ? null : member.id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-[1.5px] transition-all"
                          style={{
                            borderColor: active ? 'var(--teal)' : 'rgba(13,15,20,.1)',
                            background:  active ? 'var(--teal-dim)' : 'transparent',
                            color:       active ? 'var(--teal)' : 'var(--ink-muted)',
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{ background: 'var(--teal)', fontSize: 8 }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                          {member.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Columna */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                    Columna
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {columns.map(col => {
                      const active = filters.columnId === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => set({ columnId: active ? null : col.id })}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border-[1.5px] transition-all"
                          style={{
                            borderColor: active ? 'var(--amber)' : 'rgba(13,15,20,.1)',
                            background:  active ? 'var(--amber-dim)' : 'transparent',
                            color:       active ? 'var(--amber)' : 'var(--ink-muted)',
                          }}
                        >
                          {col.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fecha límite */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--ink-muted)' }}>
                    Fecha límite
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: 'var(--ink-muted)' }}>Desde</label>
                      <input
                        type="date"
                        value={filters.dueAfter}
                        onChange={e => set({ dueAfter: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border-[1.5px] text-sm outline-none"
                        style={{ borderColor: 'rgba(13,15,20,.1)', background: 'var(--paper)', color: 'var(--ink)' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(13,15,20,.1)')}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: 'var(--ink-muted)' }}>Hasta</label>
                      <input
                        type="date"
                        value={filters.dueBefore}
                        onChange={e => set({ dueBefore: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border-[1.5px] text-sm outline-none"
                        style={{ borderColor: 'rgba(13,15,20,.1)', background: 'var(--paper)', color: 'var(--ink)' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(13,15,20,.1)')}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer del panel */}
              {hasActiveFilters && (
                <div className="flex justify-end mt-5 pt-4 border-t" style={{ borderColor: 'rgba(13,15,20,.07)' }}>
                  <button
                    onClick={() => { onClear(); setPanelOpen(false); }}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: 'var(--ink-muted)' }}
                    onMouseOver={e => (e.currentTarget.style.color = '#c0392b')}
                    onMouseOut={e  => (e.currentTarget.style.color = 'var(--ink-muted)')}
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Chips de filtros activos ── */}
        {filters.priorities.map(p => {
          const opt = PRIORITY_OPTIONS.find(o => o.value === p)!;
          return (
            <span
              key={p}
              className="hidden sm:flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: opt.bg, color: opt.color }}
            >
              {opt.icon} {opt.label}
              <button onClick={() => togglePriority(p)} className="ml-1 opacity-60 hover:opacity-100">
                <X size={10} />
              </button>
            </span>
          );
        })}

        {/* Spacer + contador */}
        <div className="flex-1" />
        {hasActiveFilters && (
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--ink-muted)' }}>
            Mostrando{' '}
            <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{visibleTasks}</span>
            {' '}de{' '}
            <span style={{ fontWeight: 600 }}>{totalTasks}</span>
            {' '}tareas
          </span>
        )}

        {/* Botón limpiar rápido */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
            style={{ background: 'rgba(192,57,43,.08)', color: '#c0392b' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(192,57,43,.15)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'rgba(192,57,43,.08)')}
          >
            <X size={12} /> Limpiar
          </button>
        )}

      </div>
    </div>
  );
};