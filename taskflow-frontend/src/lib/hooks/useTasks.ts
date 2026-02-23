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

  // ✅ Solo actualizar cuando el contenido REAL cambie
  useEffect(() => {
    const newStr = JSON.stringify(boardColumns);
    if (columnsStrRef.current !== newStr) {
      setColumns(boardColumns);
      columnsStrRef.current = newStr;
    }
  }, [boardColumns]);

  // ─── Helpers internos ────────────────────────────────────────────────────
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

  // ─── createTask ──────────────────────────────────────────────────────────
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
    } catch (error) {
      toast.error('Error al crear tarea');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ─── updateTask ──────────────────────────────────────────────────────────
  const updateTask = async (taskId: number, data: UpdateTaskDTO): Promise<void> => {
    setLoading(true);
    try {
      const updated: Task = await tasksApi.updateTask(taskId, data);
      setColumns(updateTaskInColumns(taskId, () => updated));
      toast.success('Tarea actualizada');
    } catch (error) {
      toast.error('Error al actualizar tarea');
    } finally {
      setLoading(false);
    }
  };

  // ─── moveTask ────────────────────────────────────────────────────────────
  const moveTask = async (taskId: number, newColumnId: number, newPosition: number): Promise<void> => {
    const previousColumns = columns;
    let movedTask: Task | null = null;
    
    for (const col of columns) {
      const found = col.tasks?.find(t => t.id === taskId);
      if (found) { movedTask = found; break; }
    }
    if (!movedTask) return;

    const optimisticTask: Task = { ...movedTask, column_id: newColumnId, position: newPosition };

    setColumns(prev => {
      const withoutTask = prev.map(col => ({
        ...col,
        tasks: col.tasks?.filter(t => t.id !== taskId),
      }));
      return withoutTask.map(col => {
        if (col.id !== newColumnId) return col;
        const tasks = [...(col.tasks ?? [])];
        tasks.splice(newPosition, 0, optimisticTask);
        return { ...col, tasks };
      });
    });

    try {
      await tasksApi.moveTask(taskId, newColumnId, newPosition);
    } catch (error) {
      setColumns(previousColumns);
      toast.error('Error al mover tarea');
    }
  };

  // ─── deleteTask ──────────────────────────────────────────────────────────
  const deleteTask = async (taskId: number): Promise<void> => {
    const previousColumns = columns;
    setColumns(removeTaskFromColumns(taskId));
    try {
      await tasksApi.deleteTask(taskId);
      toast.success('Tarea eliminada');
    } catch (error) {
      setColumns(previousColumns);
      toast.error('Error al eliminar tarea');
    }
  };

  // ─── setColumnsFromBoard (útil para recargas manuales) ───────────────────
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