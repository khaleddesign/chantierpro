'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, GanttChartSquare, MessagesSquare, Users, FileText, Calendar, Folder, X, Settings, LogOut, User
} from 'lucide-react';

const getRoleBasedItems = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Chantiers', href: '/dashboard/chantiers', icon: GanttChartSquare },
        { name: 'Messages', href: '/dashboard/messages', icon: MessagesSquare },
        { name: 'Utilisateurs', href: '/dashboard/users', icon: Users },
        { name: 'Devis', href: '/dashboard/devis', icon: FileText },
        { name: 'Planning', href: '/dashboard/planning', icon: Calendar },
        { name: 'Documents', href: '/dashboard/documents', icon: Folder }
      ];
    
    case 'COMMERCIAL':
      return [
        { name: 'Dashboard Commercial', href: '/dashboard/commercial', icon: LayoutDashboard },
        { name: 'Mes Chantiers', href: '/dashboard/chantiers', icon: GanttChartSquare },
        { name: 'Devis & Factures', href: '/dashboard/devis', icon: FileText },
        { name: 'Messages Clients', href: '/dashboard/messages', icon: MessagesSquare },
        { name: 'Planning', href: '/dashboard/planning', icon: Calendar },
        { name: 'Documents', href: '/dashboard/documents', icon: Folder }
      ];
    
    case 'CLIENT':
      return [
        { name: 'Mes Projets', href: '/dashboard/client', icon: LayoutDashboard },
        { name: 'Mes Chantiers', href: '/dashboard/chantiers', icon: GanttChartSquare },
        { name: 'Messages', href: '/dashboard/messages', icon: MessagesSquare },
        { name: 'Mes Documents', href: '/dashboard/documents', icon: Folder }
      ];
    
    default:
      return [];
  }
};

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function ModernSidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const menuItems = getRoleBasedItems(user.role);

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return '👑';
      case 'COMMERCIAL': return '💼';
      case 'CLIENT': return '🏠';
      default: return '🏗️';
    }
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)}></div>}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 text-gray-900 flex flex-col transition-transform duration-300 ease-in-out shadow-lg",
        "lg:relative lg:translate-x-0",
        open ? "flex translate-x-0" : "hidden lg:flex -translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                {getRoleIcon(user.role)}
              </div>
              <div>
                <span className="font-bold text-xl text-gray-900">ChantierPro</span>
                <p className="text-xs text-gray-500">v2.0 • {getRoleLabel(user.role)}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-500">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group",
                    isActive
                      ? `bg-gradient-to-r ${getRoleColor(user.role)} text-white shadow-md transform scale-[1.02]`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500 hover:transform hover:scale-[1.01]'
                  )}>
                  <item.icon size={20} className={cn("transition-colors", isActive ? "text-white" : "text-gray-600 group-hover:text-blue-500")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-6 border-t border-gray-200 space-y-4">
            <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-500 transition-colors">
              <User size={20} />
              <span>Mon Profil</span>
            </Link>
            
            {user.role === 'ADMIN' && (
              <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-500 transition-colors">
                <Settings size={20} />
                <span>Paramètres</span>
              </Link>
            )}
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-600">{getRoleLabel(user.role)}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-gray-600 rounded-md hover:bg-gray-100 hover:text-red-500 transition-colors"
                title="Se déconnecter"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
