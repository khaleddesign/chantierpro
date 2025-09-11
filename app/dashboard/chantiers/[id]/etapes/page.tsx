'use client';

import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import EtapesList from '@/components/etapes/EtapesList';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EtapesPage() {
  const params = useParams();
  const chantierId = params.id as string;
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/chantiers/${chantierId}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour au chantier</span>
        </Link>
      </div>

      <EtapesList chantierId={chantierId} />
    </div>
  );
}
