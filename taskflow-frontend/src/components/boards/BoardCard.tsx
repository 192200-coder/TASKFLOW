// src/components/boards/BoardCard.tsx
'use client';

import { Board, BoardMemberUser } from '@/lib/types/board';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Users } from 'lucide-react';

interface BoardCardProps {
  board: Board;
  isOwner?: boolean;
}

export const BoardCard = ({ board, isOwner }: BoardCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/boards/${board.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
    >
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
        {board.cover_image_url && (
          <img
            src={board.cover_image_url}
            alt={board.name}
            className="w-full h-full object-cover"
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Abrir menú de opciones
          }}
          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1">{board.name}</h3>
        {board.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {board.description}
          </p>
        )}

        {/* Members preview */}
        {/* Sequelize M:M: members es BoardMemberUser[] (campos de User en raíz + BoardMember pivot) */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {board.members?.slice(0, 3).map((member: BoardMemberUser) => (
              <div
                key={member.id}
                className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center overflow-hidden"
                title={member.name}
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
            {(board.members?.length || 0) > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  +{(board.members?.length || 0) - 3}
                </span>
              </div>
            )}
          </div>

          {isOwner && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Users size={12} />
              Dueño
            </span>
          )}
        </div>
      </div>
    </div>
  );
};