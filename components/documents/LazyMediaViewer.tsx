'use client';

import { lazy, Suspense } from 'react';
import { FileImage, FileText, Eye } from 'lucide-react';

const MediaViewer = lazy(() => import('./MediaViewer'));

interface LazyMediaViewerProps {
  document: {
    id: string;
    nom: string;
    type: string;
    url: string;
    urlThumbnail?: string;
  };
}

function MediaViewerLoadingSpinner({ document }: { document: LazyMediaViewerProps['document'] }) {
  const isImage = document.type === 'PHOTO';
  const isPdf = document.type === 'PDF';
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          {isImage ? 'Aperçu' : isPdf ? 'Aperçu PDF' : 'Document'}
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-white/20 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-white/20 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-white/20 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="bg-black/20 rounded-lg p-4 min-h-96 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {isImage && <FileImage className="w-16 h-16 text-blue-400 animate-pulse" />}
            {isPdf && <FileText className="w-16 h-16 text-red-400 animate-pulse" />}
            {!isImage && !isPdf && <Eye className="w-16 h-16 text-gray-400 animate-pulse" />}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full animate-ping"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-white">Chargement du viewer</p>
            <p className="text-sm text-blue-200">Préparation de {document.nom}...</p>
          </div>
          <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-blue-400 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LazyMediaViewer(props: LazyMediaViewerProps) {
  return (
    <Suspense fallback={<MediaViewerLoadingSpinner document={props.document} />}>
      <MediaViewer {...props} />
    </Suspense>
  );
}