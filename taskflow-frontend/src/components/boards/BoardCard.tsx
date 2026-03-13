// src/components/boards/BoardCard.tsx
'use client';

import { Board, BoardMemberUser } from '@/lib/types/board';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';

interface BoardCardProps {
  board: Board;
  isOwner?: boolean;
}

export const BoardCard = ({ board, isOwner }: BoardCardProps) => {
  const router = useRouter();

  // Paleta de gradientes para portadas sin imagen — rota por id del tablero
  const gradients = [
    'linear-gradient(135deg, #e8913a 0%, #c2642a 100%)',
    'linear-gradient(135deg, #2a7d6e 0%, #1a5248 100%)',
    'linear-gradient(135deg, #0d0f14 0%, #3a3d4a 100%)',
    'linear-gradient(135deg, #c2642a 0%, #e8913a 80%)',
    'linear-gradient(135deg, #1a5248 0%, #2a7d6e 100%)',
  ];
  const gradient = gradients[board.id % gradients.length];

  return (
    <div
      onClick={() => router.push(`/boards/${board.id}`)}
      className="group relative rounded-2xl border cursor-pointer overflow-hidden transition-all"
      style={{
        background:  'var(--surface)',
        borderColor: 'rgba(13,15,20,.08)',
        boxShadow:   '0 1px 4px rgba(13,15,20,.06)',
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(13,15,20,.12)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(13,15,20,.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Portada */}
      <div
        className="h-28 relative overflow-hidden"
        style={{ background: gradient }}
      >
        {board.cover_image_url && (
          <img
            src={board.cover_image_url}
            alt={board.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Badge owner */}
        {isOwner && (
          <span
            className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(13,15,20,.45)', color: 'white', backdropFilter: 'blur(4px)' }}
          >
            <Crown size={10} /> Dueño
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3
          className="font-bold mb-1 truncate"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', letterSpacing: '-.02em', color: 'var(--ink)' }}
        >
          {board.name}
        </h3>

        {board.description && (
          <p
            className="text-xs line-clamp-2 mb-3"
            style={{ color: 'var(--ink-muted)', lineHeight: 1.55 }}
          >
            {board.description}
          </p>
        )}

        {/* Miembros */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex -space-x-2">
            {board.members?.slice(0, 4).map((member: BoardMemberUser) => (
              <div
                key={member.id}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-white font-bold overflow-hidden"
                style={{
                  background:  board.owner_id === member.id ? 'var(--amber)' : 'var(--teal)',
                  borderColor: 'var(--surface)',
                  fontSize: 9,
                }}
                title={member.name}
              >
                {member.avatar_url
                  ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                  : member.name.charAt(0).toUpperCase()
                }
              </div>
            ))}
            {(board.members?.length ?? 0) > 4 && (
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
                style={{ background: 'var(--cream)', borderColor: 'var(--surface)', color: 'var(--ink-muted)' }}
              >
                +{(board.members?.length ?? 0) - 4}
              </div>
            )}
          </div>

          <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            {board.members?.length ?? 0} {board.members?.length === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
      </div>
    </div>
  );
};