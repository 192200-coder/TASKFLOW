// src/components/boards/CreateBoardModal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBoards } from '@/lib/hooks/useBoards';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';

const boardSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(255, 'El nombre es demasiado largo'),
  description: z.string().max(5000, 'La descripción es demasiado larga').optional(),
  cover_image_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type BoardForm = z.infer<typeof boardSchema>;

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBoardModal = ({ isOpen, onClose }: CreateBoardModalProps) => {
  const { createBoard } = useBoards();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BoardForm>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: '',
      description: '',
      cover_image_url: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: BoardForm) => {
    setIsLoading(true);
    try {
      await createBoard(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error al crear tablero:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Crear nuevo tablero</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre del tablero"
            placeholder="Ej: Proyecto de diseño"
            {...register('name')}
            error={errors.name?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe el propósito de este tablero..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <Input
            label="URL de imagen de portada (opcional)"
            placeholder="https://ejemplo.com/imagen.jpg"
            {...register('cover_image_url')}
            error={errors.cover_image_url?.message}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="flex-1"
            >
              Crear
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};