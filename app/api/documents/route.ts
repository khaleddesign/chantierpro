import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// GET - Récupérer tous les documents avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const chantierId = searchParams.get('chantierId') || '';

    const skip = (page - 1) * limit;

    // Construire les filtres
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { nomOriginal: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      whereClause.type = type;
    }

    if (chantierId) {
      whereClause.chantierId = chantierId;
    }

    // Récupérer les documents
    const documents = await prisma.document.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Compter le total
    const totalCount = await prisma.document.count({
      where: whereClause
    });

    // Statistiques
    const stats = {
      total: await prisma.document.count(),
      byType: await prisma.document.groupBy({
        by: ['type'],
        _count: true
      }),
      totalSize: await prisma.document.aggregate({
        _sum: {
          taille: true
        }
      })
    };

    return NextResponse.json({
      documents,
      stats: {
        total: stats.total,
        totalSize: stats.totalSize._sum.taille || 0,
        byType: stats.byType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>)
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Upload d'un nouveau document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chantierId = formData.get('chantierId') as string;
    const type = formData.get('type') as string;
    const tags = formData.get('tags') as string;
    const dossier = formData.get('dossier') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400 }
      );
    }

    // Limitation de taille (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 50MB)' },
        { status: 400 }
      );
    }

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${extension}`;

    // Sauvegarder le fichier sur le disque
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Créer le répertoire s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    const fileUrl = `/uploads/${fileName}`;

    // Déterminer le type de document automatiquement si non spécifié
    let documentType = type;
    if (!documentType) {
      if (file.type.startsWith('image/')) {
        documentType = 'PHOTO';
      } else if (file.type === 'application/pdf') {
        documentType = 'PDF';
      } else {
        documentType = 'AUTRE';
      }
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 400 }
      );
    }

    // Vérifier que le chantier existe (si spécifié)
    if (chantierId) {
      const chantier = await prisma.chantier.findUnique({
        where: { id: chantierId },
        select: { id: true }
      });

      if (!chantier) {
        return NextResponse.json(
          { error: 'Chantier non trouvé' },
          { status: 400 }
        );
      }
    }

    // Créer le document en base
    const document = await prisma.document.create({
      data: {
        nom: fileName,
        nomOriginal: file.name,
        type: documentType as any,
        taille: file.size,
        url: fileUrl,
        uploaderId: session.user.id,
        chantierId: chantierId || null,
        tags: tags || null,
        dossier: dossier || null,
        public: false,
        metadonnees: JSON.stringify({
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          originalSize: file.size
        })
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

    return NextResponse.json(document, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'upload du document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer plusieurs documents
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs des documents requis' },
        { status: 400 }
      );
    }

    // Vérifier les permissions (seuls les uploaders ou admins peuvent supprimer)
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds }
      },
      select: {
        id: true,
        uploaderId: true
      }
    });

    const isAdmin = session.user.role === 'ADMIN';
    const unauthorizedDocs = documents.filter(doc => 
      doc.uploaderId !== session.user.id && !isAdmin
    );

    if (unauthorizedDocs.length > 0) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes pour certains documents' },
        { status: 403 }
      );
    }

    // Supprimer les documents
    await prisma.document.deleteMany({
      where: {
        id: { in: documentIds }
      }
    });

    return NextResponse.json({ 
      message: `${documentIds.length} document(s) supprimé(s)` 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression des documents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}