"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSessionExtension, useSessionExpirationWarning } from '@/hooks/useSessionExtension';
import { Clock, RefreshCw, AlertTriangle } from 'lucide-react';

interface SessionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function SessionStatus({ showDetails = false, className = '' }: SessionStatusProps) {
  const { data: session } = useSession();
  const { isUserActive, forceSessionExtension, lastActivity } = useSessionExtension();
  const { warningShown } = useSessionExpirationWarning();
  const [isExtending, setIsExtending] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number>(0);

  // Calculer le temps restant jusqu'à l'expiration
  useEffect(() => {
    if (!session?.expires) return;

    const updateTimeUntilExpiry = () => {
      const now = Date.now();
      const expiry = new Date(session.expires).getTime();
      const remaining = expiry - now;
      setTimeUntilExpiry(Math.max(0, remaining));
    };

    updateTimeUntilExpiry();
    const interval = setInterval(updateTimeUntilExpiry, 1000);

    return () => clearInterval(interval);
  }, [session?.expires]);

  // Fonction pour formater le temps restant
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Fonction pour obtenir la couleur selon le temps restant
  const getStatusColor = () => {
    const minutes = timeUntilExpiry / (1000 * 60);
    
    if (minutes < 15) return 'text-red-600';
    if (minutes < 30) return 'text-orange-600';
    if (minutes < 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Fonction pour étendre manuellement la session
  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await forceSessionExtension();
      // Afficher un message de succès
      console.log('✅ Session étendue avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'extension de session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icône de statut */}
      <div className="flex items-center gap-1">
        {warningShown ? (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        ) : isUserActive ? (
          <Clock className="w-4 h-4 text-green-500" />
        ) : (
          <Clock className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Temps restant */}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {formatTimeRemaining(timeUntilExpiry)}
      </span>

      {/* Bouton d'extension */}
      <button
        onClick={handleExtendSession}
        disabled={isExtending || !isUserActive}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Étendre la session"
      >
        <RefreshCw 
          className={`w-3 h-3 ${isExtending ? 'animate-spin' : ''}`} 
        />
      </button>

      {/* Détails supplémentaires */}
      {showDetails && (
        <div className="text-xs text-gray-500 ml-2">
          <div>Actif: {isUserActive ? 'Oui' : 'Non'}</div>
          <div>Dernière activité: {new Date(lastActivity).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Composant pour afficher une notification d'expiration de session
 */
export function SessionExpirationModal() {
  const { data: session } = useSession();
  const { warningShown } = useSessionExpirationWarning();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (warningShown && session) {
      setIsVisible(true);
    }
  }, [warningShown, session]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleExtendSession = async () => {
    try {
      await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
      setIsVisible(false);
    } catch (error) {
      console.error('Erreur lors de l\'extension de session:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-semibold">Session expire bientôt</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          Votre session expire dans 15 minutes. Veuillez sauvegarder votre travail 
          et étendre votre session si nécessaire.
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Fermer
          </button>
          <button
            onClick={handleExtendSession}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Étendre la session
          </button>
        </div>
      </div>
    </div>
  );
}
