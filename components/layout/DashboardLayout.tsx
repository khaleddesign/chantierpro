"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Settings,
  LogOut,
  User,
  FolderOpen,
  BarChart3,
  Home,
  PlusCircle,
  Target,
  CreditCard,
  UserCog,
  FolderKanban,
  PersonStanding
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    company?: string;
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const { logout } = useAuth();
  const pathname = usePathname();

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard", icon: Home },
    { name: "Chantiers", href: "/dashboard/chantiers", icon: Building2 },
    { name: "Projets", href: "/dashboard/projets", icon: FolderKanban },
    { name: "Devis", href: "/dashboard/devis", icon: FileText },
    { name: "Factures", href: "/dashboard/factures", icon: CreditCard },
    { name: "Planning", href: "/dashboard/planning", icon: Calendar },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Documents", href: "/dashboard/documents", icon: FolderOpen },
    { name: "CRM", href: "/dashboard/crm", icon: Target },
    { name: "Utilisateurs", href: "/dashboard/users", icon: Users },
    { name: "Rapports", href: "/dashboard/reports", icon: BarChart3 },
  ];

  // Navigation adaptée selon le rôle
  const getNavigationForRole = () => {
    switch (user.role) {
      case "CLIENT":
        return [
          { name: "Mon espace", href: "/dashboard/client", icon: Home },
          { name: "Mes devis", href: "/dashboard/devis", icon: FileText },
          { name: "Planning", href: "/dashboard/planning", icon: Calendar },
          { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
          { name: "Documents", href: "/dashboard/documents", icon: FolderOpen },
          { name: "Mon profil", href: "/dashboard/profile", icon: Settings },
        ];
      case "COMMERCIAL":
        return [
          { name: "Tableau de bord", href: "/dashboard", icon: Home },
          { name: "Chantiers", href: "/dashboard/chantiers", icon: Building2 },
          { name: "Devis", href: "/dashboard/devis", icon: FileText },
          { name: "Factures", href: "/dashboard/factures", icon: CreditCard },
          { name: "Planning", href: "/dashboard/planning", icon: Calendar },
          { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
          { name: "Documents", href: "/dashboard/documents", icon: FolderOpen },
          { name: "CRM", href: "/dashboard/crm", icon: Target },
          { name: "Rapports", href: "/dashboard/reports", icon: BarChart3 },
        ];
      case "ADMIN":
        return navigation; // Navigation complète pour les admins
      default:
        return navigation;
    }
  };

  const roleNavigation = getNavigationForRole();

  const adminNavigation = [
    { name: "Administration", href: "/dashboard/admin", icon: Settings },
    { name: "Bibliothèque Prix", href: "/dashboard/admin/bibliotheque", icon: PlusCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          {/* Header */}
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className={`w-10 h-10 bg-gradient-to-r ${
                user.role === "CLIENT" ? "from-green-600 to-blue-600" : 
                user.role === "COMMERCIAL" ? "from-purple-600 to-indigo-600" :
                "from-blue-600 to-indigo-600"
              } rounded-xl flex items-center justify-center`}>
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                {user.role === "CLIENT" ? "Espace Client" : "ChantierPro"}
              </h1>
            </div>

            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {roleNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? user.role === "CLIENT" 
                        ? "bg-green-50 text-green-700 border-r-2 border-green-700"
                        : user.role === "COMMERCIAL"
                        ? "bg-purple-50 text-purple-700 border-r-2 border-purple-700"
                        : "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive(item.href) 
                        ? user.role === "CLIENT" 
                          ? "text-green-500" 
                          : user.role === "COMMERCIAL"
                          ? "text-purple-500"
                          : "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              ))}

              {/* Admin Navigation */}
              {user.role === "ADMIN" && (
                <>
                  <div className="border-t border-gray-200 mt-6 pt-6">
                    <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Administration
                    </h3>
                    {adminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive(item.href)
                            ? "bg-purple-50 text-purple-700 border-r-2 border-purple-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <item.icon
                          className={`mr-3 flex-shrink-0 h-5 w-5 ${
                            isActive(item.href) ? "text-purple-500" : "text-gray-400 group-hover:text-gray-500"
                          }`}
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </nav>
          </div>

          {/* User section */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role === "ADMIN" ? "Administrateur" : 
                   user.role === "COMMERCIAL" ? "Commercial" : 
                   "Utilisateur"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex-shrink-0 ml-2"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-gray-200">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
        
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}