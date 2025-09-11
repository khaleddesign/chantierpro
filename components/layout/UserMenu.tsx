'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'from-red-500 to-red-600';
      case 'COMMERCIAL': return 'from-green-500 to-green-600';
      case 'CLIENT': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'COMMERCIAL': return 'Commercial';
      case 'CLIENT': return 'Client';
      default: return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
          {getInitials(user.name)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
            {user.name}
          </p>
          <p className="text-xs text-gray-500">
            {getRoleLabel(user.role)}
          </p>
        </div>
        <ChevronDown 
          size={16} 
          className={`hidden md:block text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold shadow-md`}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                  user.role === 'COMMERCIAL' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={16} className="text-gray-500" />
              <span>Mon profil</span>
            </Link>

            {user.role === 'ADMIN' && (
              <Link
                href="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings size={16} className="text-gray-500" />
                <span>Paramètres</span>
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut size={16} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
