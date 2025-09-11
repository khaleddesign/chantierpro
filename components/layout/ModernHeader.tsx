'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from './UserMenu';
import { Menu, Search, Bell, MessageCircle } from 'lucide-react';

interface ModernHeaderProps {
  onSidebarToggle: () => void;
}

export default function ModernHeader({ onSidebarToggle }: ModernHeaderProps) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 z-30 shadow-sm lg:pl-72">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
              🏗️
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                ChantierPro
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Search size={20} className="text-gray-600" />
            </button>
            
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <MessageCircle size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 hidden md:block"></div>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
