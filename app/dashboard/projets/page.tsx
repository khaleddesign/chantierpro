'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Clock } from 'lucide-react';

export default function ProjetsPage() {
  const [projets, setProjets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation projets
    setProjets([
      {
        id: '1',
        nom: 'Rénovation Appartement Duplex',
        description: 'Rénovation complète 120m²',
        statut: 'EN_COURS',
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        avancement: 35
      },
      {
        id: '2',
        nom: 'Extension Maison Individuelle',
        description: 'Extension 30m² + suite parentale',
        statut: 'PLANIFICATION',
        dateDebut: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        avancement: 0
      }
    ]);
    setLoading(false);
  }, []);

  const getStatusConfig = (statut: string) => {
    const configs = {
      EN_COURS: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
      PLANIFICATION: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
      TERMINE: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
      ANNULE: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" }
    };
    return configs[statut as keyof typeof configs] || configs.PLANIFICATION;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏗️ Projets
            </h1>
            <p className="text-gray-500">
              Gérez vos projets de construction et rénovation
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus size={18} />
            Nouveau Projet
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projets.map((projet) => (
            <Link
              key={projet.id}
              href={`/dashboard/projets/${projet.id}`}
              className="group"
            >
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {projet.nom}
                    </h3>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {projet.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusConfig(projet.statut).bg} ${getStatusConfig(projet.statut).text} ${getStatusConfig(projet.statut).border}`}>
                    {projet.statut.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock size={14} />
                    {projet.avancement}% complété
                  </div>
                </div>

                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500" 
                    style={{ width: `${projet.avancement}%` }}
                  ></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
