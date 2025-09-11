"use client";

import React from 'react';
import Link from "next/link";
import { ChantierStatus } from '@prisma/client';
import StatusBadge from "./StatusBadge";
import { Chantier } from '@/types/chantier';
import { CalendarDays, MapPin, User, MessageSquare, MessageCircle } from 'lucide-react';

interface ChantierCardProps {
  chantier: Chantier;
  className?: string;
}

export default function ChantierCard({ chantier, className = '' }: ChantierCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(budget);
  };

  return (
    <Link href={`/dashboard/chantiers/${chantier.id}`} className="block no-underline">
      <div 
        className={`bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${className}`}
      >
        <div 
          className="h-48 bg-cover bg-center relative"
          style={{ 
            backgroundImage: chantier.photo 
              ? `url(${chantier.photo})`
              : 'url(https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=200&fit=crop)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60"></div>
          
          <div className="absolute top-3 right-3">
            <StatusBadge statut={chantier.statut as ChantierStatus} />
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <div className="p-4">
              <div className="w-full bg-white/20 backdrop-blur-sm rounded h-1.5">
                <div 
                  className="h-full rounded bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${chantier.progression}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
              {chantier.nom}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin size={14} className="mr-1" />
              <span className="truncate">{chantier.adresse}</span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {chantier.client.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 m-0">
                  {chantier.client.name}
                </p>
                {chantier.client.company && (
                  <p className="text-xs text-gray-500 m-0">
                    {chantier.client.company}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4 flex-1">
            <p className="text-sm text-gray-600 line-clamp-2">
              {chantier.description}
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center text-xs text-gray-500">
                <CalendarDays size={14} className="mr-1" />
                <span>{formatDate(chantier.dateDebut)} - {formatDate(chantier.dateFin)}</span>
              </div>
              <span className="text-sm font-semibold text-emerald-600">
                {formatBudget(chantier.budget)}
              </span>
            </div>

            {chantier._count && (
              <div className="flex gap-3 mt-2">
                <span className="text-xs text-gray-500 flex items-center">
                  <MessageSquare size={12} className="mr-1" />
                  {chantier._count.messages} messages
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                  <MessageCircle size={12} className="mr-1" />
                  {chantier._count.comments} commentaires
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
