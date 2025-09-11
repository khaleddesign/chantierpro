"use client";

import Link from "next/link";
import NotificationBadge from "@/components/layout/NotificationBadge";
import { useMessages } from "@/hooks/useMessages";

export default function QuickActions() {
  const { totalUnreadCount, loading } = useMessages({
    pollingInterval: 30000,
    enableNotifications: true
  });

  const actions = [
    {
      title: "Nouveau Chantier",
      description: "Créer un nouveau projet",
      icon: "🏗️",
      href: "/dashboard/chantiers/nouveau",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Messages",
      description: "Chat temps réel",
      icon: "💬",
      href: "/dashboard/messages",
      color: "from-orange-500 to-orange-600",
      notificationCount: totalUnreadCount
    },
    {
      title: "Plannings",
      description: "Gérer les plannings",
      icon: "📅",
      href: "/dashboard/plannings",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Équipes",
      description: "Gérer les équipes",
      icon: "👥",
      href: "/dashboard/equipes",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
          Actions Rapides
        </h3>
        {loading && (
          <div style={{ 
            width: '1rem', 
            height: '1rem', 
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {actions.map((action, index) => (
          <Link key={index} href={action.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                position: 'relative',
                border: action.notificationCount && action.notificationCount > 0 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6, #f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: action.notificationCount && action.notificationCount > 0 ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'
              }}>
                {action.icon}
              </div>
              {action.notificationCount && action.notificationCount > 0 && (
                <NotificationBadge 
                  count={action.notificationCount}
                  size="sm"
                  animate={true}
                  backgroundColor="#ef4444"
                />
              )}
              
              <div style={{ flex: 1 }}>
                <p style={{ 
                  margin: 0, 
                  fontWeight: '500', 
                  color: '#1e293b', 
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {action.title}
                  {action.notificationCount && action.notificationCount > 0 && (
                    <span style={{
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      ({action.notificationCount} nouveaux)
                    </span>
                  )}
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
                  {action.description}
                </p>
              </div>

              {action.notificationCount && action.notificationCount > 0 && (
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
