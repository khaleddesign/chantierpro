import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier que l'utilisateur est authentifié et admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construire les filtres
    const filters: any = {};
    
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Récupérer les logs d'audit
    const { logs, total } = await getAuditLogs(filters, limit, offset);

    // Calculer les statistiques
    const stats = {
      totalLogs: total,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
      hasNextPage: offset + limit < total,
      hasPrevPage: offset > 0,
    };

    return NextResponse.json({
      logs,
      stats,
      filters: {
        userId,
        action,
        resource,
        startDate,
        endDate,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des logs d\'audit:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier que l'utilisateur est authentifié et admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { action, resource, userId, startDate, endDate } = body;

    // Construire les filtres pour l'export
    const filters: any = {};
    
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Récupérer tous les logs correspondants (sans limite pour l'export)
    const { logs } = await getAuditLogs(filters, 10000, 0);

    // Formater les logs pour l'export CSV
    const csvHeaders = [
      'ID',
      'Utilisateur',
      'Email',
      'Rôle',
      'Action',
      'Ressource',
      'IP',
      'User Agent',
      'Timestamp',
      'Détails',
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.user?.name || 'N/A',
      log.user?.email || 'N/A',
      log.user?.role || 'N/A',
      log.action,
      log.resource,
      log.ip || 'N/A',
      log.userAgent || 'N/A',
      log.timestamp.toISOString(),
      JSON.stringify(log.details),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(',')),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Erreur lors de l\'export des logs d\'audit:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'export des logs' },
      { status: 500 }
    );
  }
}
