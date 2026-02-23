// src/components/layout/Navbar.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Search } from 'lucide-react';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { useState } from 'react';

export const Navbar = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar tareas, tableros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications - NUEVO */}
          <NotificationsDropdown />

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <span className="text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};