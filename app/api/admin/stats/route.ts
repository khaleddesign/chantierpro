import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer toutes les statistiques système
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent accéder aux stats système
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès interdit - Administrateur requis' },
        { status: 403 }
      );
    }

    // Statistiques générales
    const [
      totalUsers,
      totalChantiers,
      totalDevis,
      totalDocuments,
      usersByRole,
      chantiersByStatus,
      devisByStatus,
      documentsByType,
      recentActivity
    ] = await Promise.all([
      // Nombre total d'utilisateurs
      prisma.user.count(),

      // Nombre total de chantiers
      prisma.chantier.count(),

      // Nombre total de devis
      prisma.devis.count(),

      // Nombre total de documents
      prisma.document.count(),

      // Répartition des utilisateurs par rôle
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),

      // Répartition des chantiers par statut
      prisma.chantier.groupBy({
        by: ['statut'],
        _count: true
      }),

      // Répartition des devis par statut
      prisma.devis.groupBy({
        by: ['statut'],
        _count: true
      }),

      // Répartition des documents par type
      prisma.document.groupBy({
        by: ['type'],
        _count: true,
        _sum: {
          taille: true
        }
      }),

      // Activité récente (dernières actions)
      prisma.$transaction([
        // Derniers utilisateurs créés
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }),
        
        // Derniers chantiers créés
        prisma.chantier.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            nom: true,
            client: {
              select: {
                name: true
              }
            },
            createdAt: true
          }
        }),

        // Derniers devis créés
        prisma.devis.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            numero: true,
            objet: true,
            montant: true,
            client: {
              select: {
                name: true
              }
            },
            createdAt: true
          }
        })
      ])
    ]);

    const [recentUsers, recentChantiers, recentDevis] = recentActivity;

    // Calculer les statistiques financières
    const financialStats = await prisma.devis.aggregate({
      _sum: {
        totalTTC: true
      },
      _avg: {
        totalTTC: true
      },
      where: {
        statut: {
          in: ['ACCEPTE', 'PAYE']
        }
      }
    });

    // Calcul de l'espace disque utilisé
    const storageStats = await prisma.document.aggregate({
      _sum: {
        taille: true
      }
    });

    // Créer l'activité récente consolidée
    const consolidatedActivity = [
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        action: 'Nouveau compte créé',
        user: user.name,
        timestamp: user.createdAt.toISOString(),
        details: `${user.role} - ${user.email}`
      })),
      ...recentChantiers.map(chantier => ({
        id: `chantier-${chantier.id}`,
        type: 'chantier' as const,
        action: 'Chantier créé',
        user: chantier.client.name,
        timestamp: chantier.createdAt.toISOString(),
        details: chantier.nom
      })),
      ...recentDevis.map(devis => ({
        id: `devis-${devis.id}`,
        type: 'devis' as const,
        action: 'Devis créé',
        user: devis.client.name,
        timestamp: devis.createdAt.toISOString(),
        details: `${devis.numero} - ${devis.montant}€`
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Construire la réponse
    const response = {
      systemStats: {
        totalUsers,
        totalChantiers,
        totalDevis,
        totalDocuments,
        systemHealth: 'good' as const,
        dbSize: '2.4 GB', // Simulation - en prod, calculer la vraie taille
        storageUsed: formatBytes(storageStats._sum.taille || 0),
        memoryUsage: Math.floor(Math.random() * 30) + 60, // Simulation
        cpuUsage: Math.floor(Math.random() * 20) + 10, // Simulation
        uptime: '15j 7h 32m' // Simulation
      },
      
      breakdown: {
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
        
        chantiersByStatus: chantiersByStatus.reduce((acc, item) => {
          acc[item.statut] = item._count;
          return acc;
        }, {} as Record<string, number>),
        
        devisByStatus: devisByStatus.reduce((acc, item) => {
          acc[item.statut] = item._count;
          return acc;
        }, {} as Record<string, number>),
        
        documentsByType: documentsByType.reduce((acc, item) => {
          acc[item.type] = {
            count: item._count,
            totalSize: item._sum.taille || 0
          };
          return acc;
        }, {} as Record<string, { count: number; totalSize: number }>)
      },
      
      financial: {
        totalRevenue: financialStats._sum.totalTTC || 0,
        avgOrderValue: financialStats._avg.totalTTC || 0,
        pendingPayments: 0 // TODO: calculer les paiements en attente
      },
      
      recentActivity: consolidatedActivity
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour formater les tailles de fichier
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}