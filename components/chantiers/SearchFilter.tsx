"use client";

import React, { useState, useEffect } from "react";
import { ChantierStatus } from '@prisma/client';
import StatusBadge from "./StatusBadge";
import { Search, XCircle, Filter } from 'lucide-react';
import { STATUS_LABELS } from '@/types/chantier';

interface SearchFilterProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: ChantierStatus | 'TOUS') => void;
  searchValue: string;
  statusValue: ChantierStatus | 'TOUS';
}

export default function SearchFilter({ 
  onSearchChange, 
  onStatusChange, 
  searchValue, 
  statusValue 
}: SearchFilterProps) {
  const [searchInput, setSearchInput] = useState(searchValue);
  const [isActive, setIsActive] = useState(false);

  const statusOptions = [
    { value: 'TOUS', label: 'Tous les statuts' },
    ...Object.entries(STATUS_LABELS).map(([key, label]) => ({
      value: key as ChantierStatus,
      label
    }))
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  return (
    <div className="mb-8 space-y-5">
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un chantier ou client..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
            isActive 
              ? 'border-blue-500 ring-2 ring-blue-100' 
              : 'border-gray-200 hover:border-gray-300'
          } text-gray-900 placeholder-gray-500 transition-all duration-200 bg-white`}
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle size={18} />
          </button>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrer par statut</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value as ChantierStatus | 'TOUS')}
              className={`rounded-lg text-sm font-medium px-3 py-1.5 transition-all ${
                statusValue === option.value 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {option.value !== 'TOUS' ? (
                <div className="flex items-center gap-1.5">
                  <StatusBadge statut={option.value as ChantierStatus} size="sm" />
                </div>
              ) : (
                option.label
              )}
            </button>
          ))}
        </div>
      </div>

      {(searchInput || statusValue !== 'TOUS') && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="text-blue-600">
            <Filter size={16} />
          </div>
          <span className="text-blue-800 flex-1">
            Filtres actifs : 
            {searchInput && <span className="font-medium ml-1">"{searchInput}"</span>}
            {searchInput && statusValue !== 'TOUS' && ' • '}
            {statusValue !== 'TOUS' && <span className="font-medium">Statut: {STATUS_LABELS[statusValue as ChantierStatus]}</span>}
          </span>
          <button
            onClick={() => {
              setSearchInput('');
              onSearchChange('');
              onStatusChange('TOUS');
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Effacer
          </button>
        </div>
      )}
    </div>
  );
}
