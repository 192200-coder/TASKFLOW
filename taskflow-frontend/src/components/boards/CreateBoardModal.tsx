// src/components/boards/CreateBoardModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Board } from '@/lib/types/board';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, LayoutDashboard } from 'lucide-react';

const boardSchema = z.object({
  name:            z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(255, 'El nombre es demasiado largo'),
  description:     z.string().max(5000, 'La descripción es demasiado larga').optional(),
  cover_image_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type BoardForm = z.infer<typeof boardSchema>;

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (data: Partial<Board>) => Promise<Board | null>;
}

export const CreateBoardModal = ({ isOpen, onClose, onCreateBoard }: CreateBoardModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BoardForm>({
    resolver: zodResolver(boardSchema),
    defaultValues: { name: '', description: '', cover_image_url: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (data: BoardForm) => {
    setIsLoading(true);
    try {
      await onCreateBoard(data);
      reset();
      onClose();
    } catch {
      // el hook useBoards ya muestra el toast de error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,15,20,.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 460,
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(13,15,20,.25), 0 4px 16px rgba(13,15,20,.1)',
          border: '1px solid rgba(13,15,20,.07)',
          animation: 'modalIn .2s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-4 border-b"
          style={{ borderColor: 'rgba(13,15,20,.07)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--amber-dim)' }}
            >
              <LayoutDashboard size={15} style={{ color: 'var(--amber)' }} />
            </div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.1rem',
                fontWeight: 800,
                letterSpacing: '-.02em',
                color: 'var(--ink)',
              }}
            >
              Nuevo tablero
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--ink-muted)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(13,15,20,.06)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <Input
            label="Nombre del tablero"
            placeholder="Ej: Proyecto de diseño"
            {...register('name')}
            error={errors.name?.message}
          />

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--ink-soft)', letterSpacing: '.01em' }}
            >
              Descripción <span style={{ color: 'var(--ink-muted)' }}>(opcional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe el propósito de este tablero..."
              className="w-full px-4 py-3 rounded-[10px] border-[1.5px] text-sm outline-none transition-all resize-none"
              style={{
                borderColor: 'rgba(13,15,20,.12)',
                background:  'var(--surface)',
                color:       'var(--ink)',
                fontFamily:  "'DM Sans', sans-serif",
                lineHeight:  1.6,
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(13,15,20,.12)')}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--error)' }}>
                {errors.description.message}
              </p>
            )}
          </div>

          <Input
            label="URL de imagen de portada (opcional)"
            placeholder="https://ejemplo.com/imagen.jpg"
            {...register('cover_image_url')}
            error={errors.cover_image_url?.message}
          />

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="amber"
              isLoading={isLoading}
              className="flex-1"
            >
              Crear tablero
            </Button>
          </div>
        </form>
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