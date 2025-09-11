import { ActivityItem } from "@/types";

export default function ActivityFeed() {
  const activities: ActivityItem[] = [
    {
      id: "1",
      message: "Nouveau message sur Villa Moderne",
      timestamp: "Il y a 5 min",
      type: "message",
      user: "Pierre Maçon",
      userId: "user-1",
      chantierId: "1",
      icon: "💬",
      href: "/dashboard/messages?conversation=1"
    },
    {
      id: "2",
      message: "Chantier Extension Maison mis à jour",
      timestamp: "Il y a 15 min",
      type: "chantier",
      user: "Marie Dupont",
      userId: "user-3",
      chantierId: "2",
      icon: "🏗️",
      href: "/dashboard/chantiers/2"
    },
    {
      id: "3",
      message: "Julie Électricienne s'est connectée",
      timestamp: "Il y a 30 min",
      type: "user",
      user: "Julie Électricienne",
      userId: "user-2",
      icon: "👤"
    },
    {
      id: "4",
      message: "Nouveau devis créé pour Loft Industriel",
      timestamp: "Il y a 1h",
      type: "system",
      user: "Système",
      chantierId: "3",
      icon: "📄",
      href: "/dashboard/chantiers/3"
    },
    {
      id: "5",
      message: "Photos ajoutées au chantier Villa Moderne",
      timestamp: "Il y a 2h",
      type: "chantier",
      user: "Pierre Maçon",
      userId: "user-1",
      chantierId: "1",
      icon: "📸",
      href: "/dashboard/chantiers/1"
    }
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case "message": return "#3b82f6";
      case "chantier": return "#f97316";
      case "user": return "#10b981";
      case "system": return "#8b5cf6";
      default: return "#64748b";
    }
  };

  const formatTime = (timestamp: string) => {
    return timestamp;
  };

  return (
    <div style={{
      background: "white",
      borderRadius: "1rem",
      padding: "1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1rem" 
      }}>
        <h3 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "600", 
          color: "#1e293b", 
          margin: 0 
        }}>
          Activité Récente
        </h3>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#3b82f6",
            fontSize: "0.875rem",
            cursor: "pointer",
            textDecoration: "underline"
          }}
          onClick={() => console.log("Voir tout")}
        >
          Voir tout
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {activities.map((activity) => (
          <div
            key={activity.id}
            onClick={() => activity.href && (window.location.href = activity.href)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              cursor: activity.href ? "pointer" : "default",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (activity.href) {
                e.currentTarget.style.background = "#f8fafc";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "50%",
              background: getActivityColor(activity.type),
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              flexShrink: 0
            }}>
              {activity.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                margin: 0, 
                fontSize: "0.875rem", 
                color: "#1e293b",
                fontWeight: "500"
              }}>
                {activity.message}
              </p>
              <p style={{ 
                margin: "0.25rem 0 0 0", 
                fontSize: "0.75rem", 
                color: "#64748b" 
              }}>
                {activity.user && `${activity.user} • `}{formatTime(activity.timestamp)}
              </p>
            </div>

            {activity.href && (
              <div style={{
                color: "#94a3b8",
                fontSize: "0.75rem"
              }}>
                →
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: "1rem",
        padding: "0.75rem",
        background: "#f8fafc",
        borderRadius: "0.5rem",
        textAlign: "center"
      }}>
        <p style={{
          margin: 0,
          fontSize: "0.75rem",
          color: "#64748b"
        }}>
          📊 {activities.length} activités aujourd'hui
        </p>
      </div>
    </div>
  );
}
