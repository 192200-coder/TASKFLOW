// src/lib/hooks/useBoards.ts
import { useState, useEffect } from 'react';
import { boardsApi } from '../api/boards';
import { Board } from '../types/board';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface BoardsState {
  owned: Board[];
  member: Board[];
}

export const useBoards = () => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<BoardsState>({ owned: [], member: [] });
  const [loading, setLoading] = useState(true);

  const splitBoards = (allBoards: Board[], userId: number): BoardsState => ({
    owned:  allBoards.filter(b => b.owner_id === userId),
    member: allBoards.filter(b => b.owner_id !== userId),
  });

  const fetchBoards = async () => {
    if (!user) return;
    try {
      const data: Board[] = await boardsApi.getMyBoards();
      setBoards(splitBoards(data, user.id));
    } catch (error) {
      toast.error('Error al cargar tableros');
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (data: Partial<Board>): Promise<Board | null> => {
    try {
      // El backend ahora devuelve { message, board } con el board COMPLETO
      // (columns con tasks vacías + members + owner) — listo para usar sin refrescar
      const response = await boardsApi.createBoard(data);
      const newBoard: Board = response.board;

      // ✅ Añadir al estado local sin necesidad de re-fetch
      if (user) {
        setBoards(prev =>
          newBoard.owner_id === user.id
            ? { ...prev, owned: [newBoard, ...prev.owned] }
            : { ...prev, member: [newBoard, ...prev.member] }
        );
      }

      toast.success('Tablero creado');
      return newBoard;
    } catch (error) {
      toast.error('Error al crear tablero');
      throw error;
    }
  };

  const deleteBoard = async (boardId: number): Promise<void> => {
    // Optimistic update
    setBoards(prev => ({
      owned:  prev.owned.filter(b => b.id !== boardId),
      member: prev.member.filter(b => b.id !== boardId),
    }));
    try {
      await boardsApi.deleteBoard(boardId);
      toast.success('Tablero eliminado');
    } catch (error) {
      // Revertir y recargar si falla
      await fetchBoards();
      toast.error('Error al eliminar tablero');
      throw error;
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [user]);

  return { boards, loading, createBoard, deleteBoard, refreshBoards: fetchBoards };
};