import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer un document spécifique
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

    const document = await prisma.document.findUnique({
      where: { id: id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);

  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { nom, tags, dossier, public: isPublic } = body;

    // Vérifier que le document existe et les permissions
    const existingDocument = await prisma.document.findUnique({
      where: { id: id },
      select: {
        id: true,
        uploaderId: true
      }
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // Seul l'uploader ou un admin peut modifier
    const isAdmin = session.user.role === 'ADMIN';
    if (existingDocument.uploaderId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Mettre à jour le document
    const updatedDocument = await prisma.document.update({
      where: { id: id },
      data: {
        ...(nom && { nom }),
        ...(tags !== undefined && { tags }),
        ...(dossier !== undefined && { dossier }),
        ...(isPublic !== undefined && { public: isPublic })
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    return NextResponse.json(updatedDocument);

  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour partielle d'un document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { nom, tags, dossier, public: isPublic } = body;

    // Vérifier que le document existe et les permissions
    const existingDocument = await prisma.document.findUnique({
      where: { id: id },
      select: {
        id: true,
        uploaderId: true
      }
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // Seul l'uploader ou un admin peut modifier
    const isAdmin = session.user.role === 'ADMIN';
    if (existingDocument.uploaderId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Mettre à jour le document
    const updatedDocument = await prisma.document.update({
      where: { id: id },
      data: {
        ...(nom && { nom }),
        ...(tags !== undefined && { tags }),
        ...(dossier !== undefined && { dossier }),
        ...(isPublic !== undefined && { public: isPublic })
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    return NextResponse.json(updatedDocument);

  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que le document existe et les permissions
    const existingDocument = await prisma.document.findUnique({
      where: { id: id },
      select: {
        id: true,
        uploaderId: true,
        url: true,
        nom: true
      }
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // Seul l'uploader ou un admin peut supprimer
    const isAdmin = session.user.role === 'ADMIN';
    if (existingDocument.uploaderId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Supprimer le document de la base de données
    await prisma.document.delete({
      where: { id: id }
    });

    // TODO: Supprimer le fichier physique du système de stockage
    // En production, supprimer aussi de S3/Cloudinary/etc.

    return NextResponse.json({ 
      message: 'Document supprimé avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}