import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { documentIds, recipientEmail } = await request.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'IDs de documents requis' }, { status: 400 });
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json({ error: 'Email de destinataire valide requis' }, { status: 400 });
    }

    // Récupérer les documents
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds }
      },
      include: {
        chantier: true
      }
    });

    if (documents.length === 0) {
      return NextResponse.json({ error: 'Aucun document trouvé' }, { status: 404 });
    }

    // Vérifier les permissions d'accès pour tous les documents
    if (session.user.role !== 'ADMIN') {
      // Pour l'instant, permettre l'accès à tous les documents
      // Dans une implémentation complète, on vérifierait les permissions chantier
      // TODO: Implémenter la vérification des permissions de chantier
    }

    // Dans une vraie implémentation, on enverrait un email avec les liens
    // Pour la simulation, on crée juste une notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        titre: 'Documents partagés',
        message: `${documents.length} document(s) partagé(s) avec ${recipientEmail}`,
        type: 'SUCCESS',
        lien: '/dashboard/documents'
      }
    });

    // Log de l'activité de partage (simulation)
    console.log(`Documents partagés par ${session.user.email}:`, {
      documentIds,
      recipientEmail,
      documentNames: documents.map(d => d.nom)
    });

    return NextResponse.json({
      success: true,
      message: `${documents.length} document(s) partagé(s) avec succès`,
      sharedDocuments: documents.map(d => ({ id: d.id, nom: d.nom }))
    });

  } catch (error) {
    console.error('Erreur lors du partage des documents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}