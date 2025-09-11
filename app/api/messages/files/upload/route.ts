import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logUserAction } from '@/lib/api-helpers';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  // SÉCURITÉ CRITIQUE: Authentification requise pour upload de fichiers messages
  const session = await requireAuth(['ADMIN', 'COMMERCIAL', 'OUVRIER', 'CLIENT']);
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userId = formData.get('userId') as string;

    // Vérification de cohérence : l'userId doit correspondre à l'utilisateur authentifié
    if (!userId || userId !== session.user.id) {
      return NextResponse.json({
        error: 'Accès non autorisé - utilisateur non valide',
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({
        error: 'Aucun fichier fourni',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({
        error: 'Maximum 5 fichiers autorisés',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          error: `Fichier ${file.name} trop volumineux (max 10MB)`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({
          error: `Type de fichier ${file.type} non autorisé`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        const uploadedFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: dataUrl,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        };

        uploadedFiles.push(uploadedFile);

        // Log de sécurité pour audit
        logUserAction(
          session.user.id,
          'UPLOAD_MESSAGE_FILE',
          'message_attachment',
          uploadedFile.id,
          { fileName: file.name, fileSize: file.size, fileType: file.type }
        );

      } catch (fileError) {
        console.error(`Erreur traitement fichier ${file.name}:`, fileError);
        return NextResponse.json({
          error: `Erreur traitement fichier ${file.name}`,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      files: uploadedFiles,
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API upload files:', error);
    
    return NextResponse.json({
      error: 'Erreur lors de l\'upload des fichiers',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
