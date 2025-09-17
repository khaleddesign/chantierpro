import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAuth, logUserAction } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/rate-limiter';
import { processImageComplete, isImageFile, getOptimizedFilename, calculateCompressionRatio } from '@/lib/image-optimizer';
import { fileTypeFromBuffer } from 'file-type';

async function uploadHandler(request: NextRequest) {
  try {
    // SÉCURITÉ CRITIQUE: Authentification requise pour upload de fichiers
    const session = await requireAuth(['ADMIN', 'COMMERCIAL', 'OUVRIER']);
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // --- DÉBUT DE LA ZONE DE CORRECTION ---

    // 1. Validation de la taille côté serveur (ex: 10MB)
    const MAX_SIZE_IN_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE_IN_BYTES) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_SIZE_IN_BYTES / 1024 / 1024}MB)` },
        { status: 413 } // 413 Payload Too Large
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Validation du type MIME réel basé sur le contenu (magic numbers)
    const detectedType = await fileTypeFromBuffer(buffer);
    const allowedTypes = [
        'image/jpeg', 
        'image/png', 
        'image/webp', 
        'application/pdf'
    ];

    if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
        return NextResponse.json(
            { error: 'Type de fichier non autorisé. Types acceptés : JPEG, PNG, WEBP, PDF.' },
            { status: 415 } // 415 Unsupported Media Type
        );
    }

    // --- FIN DE LA ZONE DE CORRECTION ---

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'chantiers');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    let finalFileName: string;
    let compressionInfo: { ratio?: number; originalSize: number; finalSize: number } = {
      originalSize: buffer.length,
      finalSize: buffer.length
    };

    // Optimiser l'image si c'est un fichier image
    if (isImageFile(detectedType.mime)) {
      try {
        const optimized = await processImageComplete(buffer, {
          maxWidth: 1920,
          quality: 85,
          thumbnailSize: 300
        });

        finalBuffer = Buffer.from(optimized.optimized);
        compressionInfo.finalSize = optimized.metadata.optimizedSize;
        compressionInfo.ratio = calculateCompressionRatio(
          optimized.metadata.originalSize,
          optimized.metadata.optimizedSize
        );

        // Générer les noms de fichiers optimisés
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        finalFileName = `${timestamp}-${randomString}.webp`;

        // Sauvegarder aussi la miniature
        const thumbnailFileName = `${timestamp}-${randomString}-thumb.webp`;
        const thumbnailPath = join(uploadDir, thumbnailFileName);
        await writeFile(thumbnailPath, optimized.thumbnail);

      } catch (optimizationError) {
        console.warn('Image optimization failed, using original:', optimizationError);
        // Fallback vers le fichier original
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        const extension = file.name.split('.').pop();
        finalFileName = `${timestamp}-${randomString}.${extension}`;
      }
    } else {
      // Pour les fichiers non-image, utiliser le nom original
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const extension = file.name.split('.').pop();
      finalFileName = `${timestamp}-${randomString}.${extension}`;
    }

    // Écrire le fichier final
    const filePath = join(uploadDir, finalFileName);
    await writeFile(filePath, finalBuffer);

    // Retourner l'URL du fichier
    const fileUrl = `/uploads/chantiers/${finalFileName}`;

    // Log de sécurité pour audit
    await logUserAction(
      session.user.id,
      'UPLOAD_FILE',
      'chantier_image',
      finalFileName,
      { 
        originalSize: file.size, 
        finalSize: compressionInfo.finalSize,
        compressionRatio: compressionInfo.ratio,
        fileType: detectedType.mime,
        optimized: isImageFile(detectedType.mime)
      }
    );

    return NextResponse.json({
      url: fileUrl,
      filename: finalFileName,
      originalSize: file.size,
      finalSize: compressionInfo.finalSize,
      compressionRatio: compressionInfo.ratio || 0,
      type: isImageFile(detectedType.mime) ? 'image/webp' : detectedType.mime,
      optimized: isImageFile(detectedType.mime),
      thumbnailUrl: isImageFile(detectedType.mime) ? `/uploads/chantiers/${finalFileName.replace('.webp', '-thumb.webp')}` : null
    });

  } catch (error: any) {
    // Gestion spécifique pour les erreurs d'authentification
    if (error.name === 'APIError' && error.statusCode === 401) {
      return NextResponse.json(
        { error: 'Authentification requise pour l\'upload de fichiers' },
        { status: 401 }
      );
    }
    if (error.name === 'APIError' && error.statusCode === 403) {
      return NextResponse.json(
        { error: 'Accès refusé - permissions insuffisantes' },
        { status: 403 }
      );
    }
    
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload' },
      { status: 500 }
    );
  }
}

async function deleteHandler(request: NextRequest) {
  // SÉCURITÉ CRITIQUE: Authentification requise pour suppression de fichiers
  const session = await requireAuth(['ADMIN', 'COMMERCIAL', 'OUVRIER']);
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Nom de fichier manquant' },
        { status: 400 }
      );
    }

    // Sécurité : vérifier que le fichier est bien dans le dossier uploads
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Nom de fichier invalide' },
        { status: 400 }
      );
    }

    const filePath = join(process.cwd(), 'public', 'uploads', 'chantiers', filename);
    
    // Vérifier si le fichier existe
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le fichier
    const { unlink } = await import('fs/promises');
    await unlink(filePath);

    return NextResponse.json({
      message: 'Fichier supprimé avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    );
  }
}

// Appliquer le rate limiting pour les uploads
export const POST = withRateLimit(uploadHandler, 'UPLOAD');
export const DELETE = withRateLimit(deleteHandler, 'API_WRITE');