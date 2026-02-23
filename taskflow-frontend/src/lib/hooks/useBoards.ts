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

  const splitBoards = (allBoards: Board[], userId: number): BoardsState => {
    return {
      owned:  allBoards.filter(b => b.owner_id === userId),
      member: allBoards.filter(b => b.owner_id !== userId),
    };
  };

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

  const createBoard = async (data: Partial<Board>) => {
    try {
      // Backend devuelve { message, board }
      const response = await boardsApi.createBoard(data);
      const newBoard: Board = response.board;
      setBoards(prev => ({
        ...prev,
        owned: [newBoard, ...prev.owned],
      }));
      toast.success('Tablero creado');
      return response;
    } catch (error) {
      toast.error('Error al crear tablero');
      throw error;
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [user]);

  return { boards, loading, createBoard, refreshBoards: fetchBoards };
};