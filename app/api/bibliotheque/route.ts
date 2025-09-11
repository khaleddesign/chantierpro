import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer tous les éléments de la bibliothèque de prix
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent accéder à la bibliothèque de prix
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès interdit - Administrateur requis' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const corpsEtat = searchParams.get('corpsEtat') || '';

    const skip = (page - 1) * limit;

    // Construire les filtres
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (corpsEtat) {
      whereClause.corpsEtat = corpsEtat;
    }

    // Récupérer les éléments
    const elements = await prisma.bibliothequePrix.findMany({
      where: whereClause,
      orderBy: {
        code: 'asc'
      },
      skip,
      take: limit
    });

    // Compter le total
    const totalCount = await prisma.bibliothequePrix.count({
      where: whereClause
    });

    // Statistiques par corps d'état
    const statsByCorps = await prisma.bibliothequePrix.groupBy({
      by: ['corpsEtat'],
      _count: true,
      _avg: {
        prixHT: true
      }
    });

    return NextResponse.json({
      elements,
      stats: {
        total: totalCount,
        byCorps: statsByCorps.reduce((acc, item) => {
          acc[item.corpsEtat] = {
            count: item._count,
            avgPrice: item._avg.prixHT || 0
          };
          return acc;
        }, {} as Record<string, { count: number; avgPrice: number }>)
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la bibliothèque:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter un nouvel élément à la bibliothèque
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent modifier la bibliothèque
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès interdit - Administrateur requis' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, designation, unite, prixHT, corpsEtat, region = 'France' } = body;

    // Validation des champs requis
    if (!code || !designation || !unite || prixHT === undefined || !corpsEtat) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis (code, designation, unite, prixHT, corpsEtat)' },
        { status: 400 }
      );
    }

    if (prixHT < 0) {
      return NextResponse.json(
        { error: 'Le prix doit être positif' },
        { status: 400 }
      );
    }

    // Vérifier que le code n'existe pas déjà
    const existingElement = await prisma.bibliothequePrix.findUnique({
      where: { code }
    });

    if (existingElement) {
      return NextResponse.json(
        { error: 'Un élément avec ce code existe déjà' },
        { status: 409 }
      );
    }

    // Créer l'élément
    const newElement = await prisma.bibliothequePrix.create({
      data: {
        code,
        designation,
        unite,
        prixHT: parseFloat(prixHT.toString()),
        corpsEtat,
        region,
        dateMAJ: new Date()
      }
    });

    return NextResponse.json(newElement, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'élément:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer plusieurs éléments
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent modifier la bibliothèque
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès interdit - Administrateur requis' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { elementIds } = body;

    if (!elementIds || !Array.isArray(elementIds) || elementIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs des éléments requis' },
        { status: 400 }
      );
    }

    // Supprimer les éléments
    const deleteResult = await prisma.bibliothequePrix.deleteMany({
      where: {
        id: { in: elementIds }
      }
    });

    return NextResponse.json({ 
      message: `${deleteResult.count} élément(s) supprimé(s)` 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression des éléments:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}