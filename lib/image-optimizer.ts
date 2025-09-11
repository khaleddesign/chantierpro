import sharp from 'sharp';

export interface OptimizedImage {
  original: Buffer;
  optimized: Buffer;
  thumbnail: Buffer;
  metadata: {
    originalSize: number;
    optimizedSize: number;
    thumbnailSize: number;
    format: string;
    width: number;
    height: number;
  };
}

export async function optimizeImage(
  buffer: Buffer, 
  maxWidth = 1920,
  quality = 85
): Promise<Buffer> {
  return await sharp(buffer)
    .resize(maxWidth, null, { 
      withoutEnlargement: true,
      fit: 'inside'
    })
    .webp({ quality })
    .toBuffer();
}

export async function createThumbnail(
  buffer: Buffer, 
  size = 300,
  quality = 80
): Promise<Buffer> {
  return await sharp(buffer)
    .resize(size, size, { 
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality })
    .toBuffer();
}

export async function processImageComplete(
  buffer: Buffer,
  options: {
    maxWidth?: number;
    quality?: number;
    thumbnailSize?: number;
    thumbnailQuality?: number;
  } = {}
): Promise<OptimizedImage> {
  const {
    maxWidth = 1920,
    quality = 85,
    thumbnailSize = 300,
    thumbnailQuality = 80
  } = options;

  // Obtenir les métadonnées de l'image originale
  const metadata = await sharp(buffer).metadata();
  
  // Optimiser l'image principale
  const optimized = await optimizeImage(buffer, maxWidth, quality);
  
  // Créer la miniature
  const thumbnail = await createThumbnail(buffer, thumbnailSize, thumbnailQuality);

  return {
    original: buffer,
    optimized,
    thumbnail,
    metadata: {
      originalSize: buffer.length,
      optimizedSize: optimized.length,
      thumbnailSize: thumbnail.length,
      format: 'webp',
      width: metadata.width || 0,
      height: metadata.height || 0,
    }
  };
}

export function calculateCompressionRatio(originalSize: number, optimizedSize: number): number {
  return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/') && 
         ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType);
}

export function getOptimizedFilename(originalName: string, suffix = ''): string {
  const ext = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${ext}`, '');
  return `${nameWithoutExt}${suffix}.webp`;
}