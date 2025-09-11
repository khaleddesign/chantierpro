'use client';

import { useState } from 'react';
import FacturesDashboard from '@/components/factures/FacturesDashboard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

export default function FacturesPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧾 Gestion des Factures
            </h1>
            <p className="text-gray-500">
              Suivi des paiements, relances automatiques et recouvrement
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/devis?type=FACTURE">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText size={18} />
                Toutes les Factures
              </Button>
            </Link>
            <Link href="/dashboard/devis/nouveau?type=FACTURE">
              <Button className="flex items-center gap-2">
                <Plus size={18} />
                Nouvelle Facture
              </Button>
            </Link>
          </div>
        </div>

        <FacturesDashboard />
      </div>
    </div>
  );
}
