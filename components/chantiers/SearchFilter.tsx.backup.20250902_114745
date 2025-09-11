// components/chantiers/SearchFilter.tsx
"use client";

import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";

interface SearchFilterProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  searchValue: string;
  statusValue: string;
}

const statusOptions = [
  { value: 'TOUS', label: 'Tous les statuts', count: 0 },
  { value: 'PLANIFIE', label: 'Planifiés', count: 0 },
  { value: 'EN_COURS', label: 'En cours', count: 0 },
  { value: 'EN_ATTENTE', label: 'En attente', count: 0 },
  { value: 'TERMINE', label: 'Terminés', count: 0 },
  { value: 'ANNULE', label: 'Annulés', count: 0 }
];

export default function SearchFilter({ 
  onSearchChange, 
  onStatusChange, 
  searchValue, 
  statusValue 
}: SearchFilterProps) {
  const [searchInput, setSearchInput] = useState(searchValue);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Barre de recherche */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Rechercher un chantier ou client..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              background: 'white',
              color: '#1e293b',
              fontSize: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              fontSize: '1.25rem'
            }}
          >
            🔍
          </div>
        </div>
      </div>

      {/* Filtres par statut */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>
          Filtrer par statut :
        </span>
        
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            style={{
              background: statusValue === option.value 
                ? 'linear-gradient(135deg, #3b82f6, #f97316)'
                : 'white',
              color: statusValue === option.value ? 'white' : '#64748b',
              border: statusValue === option.value 
                ? 'none'
                : '1px solid #e2e8f0',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (statusValue !== option.value) {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (statusValue !== option.value) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }
            }}
          >
            {option.value !== 'TOUS' && (
              <StatusBadge statut={option.value} size="sm" />
            )}
            {option.value === 'TOUS' ? option.label : ''}
          </button>
        ))}
      </div>

      {/* Indicateur de recherche active */}
      {(searchInput || statusValue !== 'TOUS') && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem 1rem',
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ color: '#0ea5e9', fontSize: '1rem' }}>ℹ️</span>
          <span style={{ color: '#0c4a6e', fontSize: '0.875rem' }}>
            Filtres actifs : 
            {searchInput && ` Recherche "${searchInput}"`}
            {searchInput && statusValue !== 'TOUS' && ' • '}
            {statusValue !== 'TOUS' && ` Statut "${statusOptions.find(s => s.value === statusValue)?.label}"`}
          </span>
          <button
            onClick={() => {
              setSearchInput('');
              onSearchChange('');
              onStatusChange('TOUS');
            }}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: '#0ea5e9',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textDecoration: 'underline'
            }}
          >
            Effacer
          </button>
        </div>
      )}
    </div>
  );
}