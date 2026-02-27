// src/lib/hooks/useTasks.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { tasksApi } from '../api/tasks';
import { Column } from '../types/board';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../types/task';
import toast from 'react-hot-toast';

export const useTasks = (boardColumns: Column[] = []) => {
  const [columns, setColumns] = useState<Column[]>(boardColumns);
  const [loading, setLoading] = useState(false);
  const columnsStrRef = useRef(JSON.stringify(boardColumns));

  useEffect(() => {
    const newStr = JSON.stringify(boardColumns);
    if (columnsStrRef.current !== newStr) {
      setColumns(boardColumns);
      columnsStrRef.current = newStr;
    }
  }, [boardColumns]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const updateTaskInColumns = (taskId: number, updater: (t: Task) => Task): Column[] =>
    columns.map(col => ({
      ...col,
      tasks: col.tasks?.map(t => t.id === taskId ? updater(t) : t),
    }));

  const removeTaskFromColumns = (taskId: number): Column[] =>
    columns.map(col => ({
      ...col,
      tasks: col.tasks?.filter(t => t.id !== taskId),
    }));

  // ─── createTask ───────────────────────────────────────────────────────────────
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

  // ─── updateTask ───────────────────────────────────────────────────────────────
  const updateTask = async (taskId: number, data: UpdateTaskDTO): Promise<void> => {
    setLoading(true);
    try {
      const updated: Task = await tasksApi.updateTask(taskId, data);
      setColumns(updateTaskInColumns(taskId, () => updated));
      toast.success('Tarea actualizada');
    } catch {
      toast.error('Error al actualizar tarea');
    } finally {
      setLoading(false);
    }
  };

  // ─── moveTask ─────────────────────────────────────────────────────────────────
  const moveTask = async (
    taskId: number,
    newColumnId: number,
    newPosition: number
  ): Promise<void> => {
    const previousColumns = columns;

    // Encontrar la tarea y su columna actual
    let movedTask: Task | null = null;
    let sourceColumnId: number | null = null;

    for (const col of columns) {
      const found = col.tasks?.find(t => t.id === taskId);
      if (found) {
        movedTask = found;
        sourceColumnId = col.id;
        break;
      }
    }
    if (!movedTask || sourceColumnId === null) return;

    const optimisticTask: Task = { ...movedTask, column_id: newColumnId, position: newPosition };

    // ✅ Optimistic update — funciona para mismo columna y entre columnas
    setColumns(prev => {
      return prev.map(col => {
        if (col.id === sourceColumnId && col.id !== newColumnId) {
          // Quitar de columna origen (solo si cambia de columna)
          return { ...col, tasks: col.tasks?.filter(t => t.id !== taskId) };
        }

        if (col.id === newColumnId) {
          // Construir nueva lista para la columna destino
          let tasks = (col.tasks ?? []).filter(t => t.id !== taskId); // quitar si ya estaba
          tasks = [
            ...tasks.slice(0, newPosition),
            optimisticTask,
            ...tasks.slice(newPosition),
          ];
          // Recalcular posiciones para que sean consistentes
          tasks = tasks.map((t, i) => ({ ...t, position: i }));
          return { ...col, tasks };
        }

        return col;
      });
    });

    try {
      await tasksApi.moveTask(taskId, newColumnId, newPosition);
    } catch {
      // Revertir si falla
      setColumns(previousColumns);
      toast.error('Error al mover tarea');
    }
  };

  // ─── deleteTask ───────────────────────────────────────────────────────────────
  const deleteTask = async (taskId: number): Promise<void> => {
    const previousColumns = columns;
    setColumns(removeTaskFromColumns(taskId));
    try {
      await tasksApi.deleteTask(taskId);
      toast.success('Tarea eliminada');
    } catch {
      setColumns(previousColumns);
      toast.error('Error al eliminar tarea');
    }
  };

  const setColumnsFromBoard = useCallback((newColumns: Column[]) => {
    setColumns(newColumns);
    columnsStrRef.current = JSON.stringify(newColumns);
  }, []);

  return {
    columns,
    loading,
    setColumnsFromBoard,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
  };
};