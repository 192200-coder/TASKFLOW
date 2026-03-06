// src/lib/hooks/useTasks.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { tasksApi } from '../api/tasks';
import { Column } from '../types/board';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../types/task';
import toast from 'react-hot-toast';

export const useTasks = (boardColumns: Column[] = []) => {
  const [columns, setColumns] = useState<Column[]>(boardColumns);
  const [loading, setLoading] = useState(false);

  // ── Sincronizar cuando llegan nuevas columnas desde el board ──────────
  // Comparación por ID+length, no stringify completo — evita re-renders costosos
  const prevBoardIdRef = useRef<string>('');
  useEffect(() => {
    const signature = boardColumns.map(c => c.id).join(',') + ':' + boardColumns.length;
    if (prevBoardIdRef.current !== signature) {
      prevBoardIdRef.current = signature;
      setColumns(boardColumns);
    }
  }, [boardColumns]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const removeTaskFromColumns = (taskId: number, cols: Column[]): Column[] =>
    cols.map(col => ({ ...col, tasks: col.tasks?.filter(t => t.id !== taskId) }));

  // ── createTask ────────────────────────────────────────────────────────
  const createTask = async (data: CreateTaskDTO): Promise<Task | null> => {
    setLoading(true);
    try {
      const newTask: Task = await tasksApi.createTask(data);
      setColumns(prev => prev.map(col =>
        col.id === newTask.column_id
          ? { ...col, tasks: [...(col.tasks ?? []), newTask] }
          : col
      ));
      toast.success('Tarea creada');
      return newTask;
    } catch {
      toast.error('Error al crear tarea');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── updateTask ────────────────────────────────────────────────────────
  const updateTask = async (taskId: number, data: UpdateTaskDTO): Promise<void> => {
    setLoading(true);
    try {
      const updated: Task = await tasksApi.updateTask(taskId, data);
      setColumns(prev => prev.map(col => ({
        ...col,
        tasks: col.tasks?.map(t => t.id === taskId ? updated : t),
      })));
      toast.success('Tarea actualizada');
    } catch {
      toast.error('Error al actualizar tarea');
    } finally {
      setLoading(false);
    }
  };

  // ── moveTask ──────────────────────────────────────────────────────────
  const moveTask = async (
    taskId: number,
    newColumnId: number,
    newPosition: number,
  ): Promise<void> => {
    const previousColumns = columns;

    let movedTask: Task | null = null;
    let sourceColumnId: number | null = null;
    for (const col of columns) {
      const found = col.tasks?.find(t => t.id === taskId);
      if (found) { movedTask = found; sourceColumnId = col.id; break; }
    }
    if (!movedTask || sourceColumnId === null) return;

    const optimisticTask: Task = { ...movedTask, column_id: newColumnId, position: newPosition };

    setColumns(prev => prev.map(col => {
      if (col.id === sourceColumnId && col.id !== newColumnId) {
        return { ...col, tasks: col.tasks?.filter(t => t.id !== taskId) };
      }
      if (col.id === newColumnId) {
        let tasks = (col.tasks ?? []).filter(t => t.id !== taskId);
        tasks = [...tasks.slice(0, newPosition), optimisticTask, ...tasks.slice(newPosition)];
        return { ...col, tasks: tasks.map((t, i) => ({ ...t, position: i })) };
      }
      return col;
    }));

    try {
      await tasksApi.moveTask(taskId, newColumnId, newPosition);
    } catch {
      setColumns(previousColumns);
      toast.error('Error al mover tarea');
    }
  };

  // ── deleteTask ────────────────────────────────────────────────────────
  const deleteTask = async (taskId: number): Promise<void> => {
    const previousColumns = columns;
    setColumns(prev => removeTaskFromColumns(taskId, prev));
    try {
      await tasksApi.deleteTask(taskId);
      toast.success('Tarea eliminada');
    } catch {
      setColumns(previousColumns);
      toast.error('Error al eliminar tarea');
    }
  };

  const setColumnsFromBoard = useCallback((newColumns: Column[]) => {
    prevBoardIdRef.current = newColumns.map(c => c.id).join(',') + ':' + newColumns.length;
    setColumns(newColumns);
  }, []);

  return { columns, loading, setColumnsFromBoard, createTask, updateTask, moveTask, deleteTask };
};