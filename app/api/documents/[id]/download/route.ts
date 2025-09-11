import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logUserAction } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        chantier: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // SÉCURITÉ CRITIQUE: Vérification des permissions d'accès aux documents
    if (session.user.role !== 'ADMIN') {
      let hasAccess = false;

      if (document.chantierId) {
        // Vérifier si l'utilisateur a accès au chantier
        const chantier = await prisma.chantier.findFirst({
          where: {
            id: document.chantierId,
            OR: [
              { clientId: session.user.id }, // Propriétaire du chantier
              { assignees: { some: { id: session.user.id } } } // Assigné au chantier
            ]
          }
        });
        hasAccess = !!chantier;
      } else {
        // Document sans chantier - vérifier si l'uploader est l'utilisateur
        hasAccess = document.uploaderId === session.user.id;
      }

      // Vérification supplémentaire pour les commerciaux
      if (!hasAccess && session.user.role === 'COMMERCIAL') {
        if (document.chantierId) {
          const chantier = await prisma.chantier.findFirst({
            where: {
              id: document.chantierId,
              client: {
                commercialId: session.user.id // Commercial assigné au client
              }
            }
          });
          hasAccess = !!chantier;
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Accès refusé - permissions insuffisantes pour ce document' }, 
          { status: 403 }
        );
      }
    }

    // Pour la simulation, on retourne le nom du fichier en tant que blob de texte
    // Dans une vraie implémentation, on récupérerait le fichier depuis le stockage
    const blob = new Blob([`Contenu du document: ${document.nom}`], { 
      type: document.type || 'application/octet-stream' 
    });

    const response = new NextResponse(blob);
    response.headers.set('Content-Disposition', `attachment; filename="${document.nom}"`);
    response.headers.set('Content-Type', document.type || 'application/octet-stream');

    // Log de sécurité pour audit des téléchargements
    logUserAction(
      session.user.id,
      'DOWNLOAD_DOCUMENT',
      'document',
      document.id,
      { 
        fileName: document.nom, 
        fileType: document.type,
        chantierId: document.chantierId 
      }
    );

    return response;

  } catch (error) {
    console.error('Erreur lors du téléchargement du document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}