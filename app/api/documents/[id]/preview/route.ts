import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Vérifier les permissions d'accès
    if (session.user.role !== 'ADMIN') {
      // Pour l'instant, permettre l'accès à tous les documents
      // Dans une implémentation complète, on vérifierait les permissions chantier
      // TODO: Implémenter la vérification des permissions de chantier
    }

    // Pour la simulation, on retourne le contenu du document
    // Dans une vraie implémentation, on récupérerait le fichier depuis le stockage
    let content;
    let contentType;

    if (document.type === 'PHOTO') {
      // Pour les images, on simule avec un SVG simple
      content = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14">${document.nom}</text>
      </svg>`;
      contentType = 'image/svg+xml';
    } else if (document.type === 'PDF') {
      // Pour les PDFs, on retourne du HTML simple
      content = `<!DOCTYPE html>
      <html>
      <head>
          <title>Aperçu - ${document.nom}</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .preview { border: 1px solid #ccc; padding: 20px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <h1>Aperçu du document</h1>
          <div class="preview">
              <h2>${document.nom}</h2>
              <p><strong>Type:</strong> ${document.type}</p>
              <p><strong>Taille:</strong> ${document.taille} octets</p>
              <p><strong>Créé le:</strong> ${document.createdAt.toLocaleDateString('fr-FR')}</p>
              ${document.chantier ? `<p><strong>Chantier:</strong> ${document.chantier.nom}</p>` : ''}
              <p><em>Contenu du document affiché ici...</em></p>
          </div>
      </body>
      </html>`;
      contentType = 'text/html';
    } else {
      // Pour les autres types, on retourne du texte
      content = `Aperçu du document: ${document.nom}\nType: ${document.type}\nTaille: ${document.taille} octets`;
      contentType = 'text/plain';
    }

    const response = new NextResponse(content);
    response.headers.set('Content-Type', contentType);

    return response;

  } catch (error) {
    console.error('Erreur lors de l\'aperçu du document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}