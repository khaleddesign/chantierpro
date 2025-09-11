import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer un élément spécifique
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès interdit - Administrateur requis' },
        { status: 403 }
      );
    }

    const element = await prisma.bibliothequePrix.findUnique({
      where: { id: id }
    });

    if (!element) {
      return NextResponse.json(
        { error: 'Élément non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(element);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'élément:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un élément
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès interdit - Administrateur requis' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, designation, unite, prixHT, corpsEtat, region } = body;

    // Vérifier que l'élément existe
    const existingElement = await prisma.bibliothequePrix.findUnique({
      where: { id: id }
    });

    if (!existingElement) {
      return NextResponse.json(
        { error: 'Élément non trouvé' },
        { status: 404 }
      );
    }

    // Si le code change, vérifier qu'il n'existe pas déjà
    if (code && code !== existingElement.code) {
      const duplicateCode = await prisma.bibliothequePrix.findUnique({
        where: { code }
      });

      if (duplicateCode) {
        return NextResponse.json(
          { error: 'Un élément avec ce code existe déjà' },
          { status: 409 }
        );
      }
    }

    // Validation du prix
    if (prixHT !== undefined && prixHT < 0) {
      return NextResponse.json(
        { error: 'Le prix doit être positif' },
        { status: 400 }
      );
    }

    // Mettre à jour l'élément
    const updatedElement = await prisma.bibliothequePrix.update({
      where: { id: id },
      data: {
        ...(code && { code }),
        ...(designation && { designation }),
        ...(unite && { unite }),
        ...(prixHT !== undefined && { prixHT: parseFloat(prixHT.toString()) }),
        ...(corpsEtat && { corpsEtat }),
        ...(region && { region }),
        dateMAJ: new Date()
      }
    });

    return NextResponse.json(updatedElement);

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'élément:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un élément
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès interdit - Administrateur requis' },
        { status: 403 }
      );
    }

    // Vérifier que l'élément existe
    const existingElement = await prisma.bibliothequePrix.findUnique({
      where: { id: id }
    });

    if (!existingElement) {
      return NextResponse.json(
        { error: 'Élément non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer l'élément
    await prisma.bibliothequePrix.delete({
      where: { id: id }
    });

    return NextResponse.json({ 
      message: 'Élément supprimé avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'élément:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}