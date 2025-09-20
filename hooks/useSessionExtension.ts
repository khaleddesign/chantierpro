"use client";

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

/**
 * Hook pour gérer l'extension automatique de session pour les utilisateurs actifs
 * Surveille l'activité utilisateur et étend automatiquement la session si nécessaire
 */
export function useSessionExtension() {
  const { data: session, update } = useSession();
  const lastActivityRef = useRef<number>(Date.now());
  const extensionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour détecter l'activité utilisateur
  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // Fonction pour vérifier si l'utilisateur est actif
  const isUserActive = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    
    return timeSinceLastActivity < INACTIVITY_THRESHOLD;
  };

  // Fonction pour étendre la session
  const extendSession = async () => {
    if (!session || !isUserActive()) {
      return;
    }

    try {
      // Effectuer une requête pour étendre la session
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        // Mettre à jour la session côté client
        await update();
        console.log('🔄 Session étendue automatiquement');
      }
    } catch (error) {
      console.error('Erreur lors de l\'extension de session:', error);
    }
  };

  // Fonction pour vérifier périodiquement l'activité et étendre la session
  const startSessionMonitoring = () => {
    if (extensionIntervalRef.current) {
      clearInterval(extensionIntervalRef.current);
    }

    extensionIntervalRef.current = setInterval(() => {
      if (session && isUserActive()) {
        extendSession();
      }
    }, 30 * 60 * 1000); // Vérifier toutes les 30 minutes
  };

  // Fonction pour arrêter la surveillance
  const stopSessionMonitoring = () => {
    if (extensionIntervalRef.current) {
      clearInterval(extensionIntervalRef.current);
      extensionIntervalRef.current = null;
    }
  };

  // Effet pour démarrer/arrêter la surveillance selon l'état de la session
  useEffect(() => {
    if (session) {
      startSessionMonitoring();
    } else {
      stopSessionMonitoring();
    }

    return () => {
      stopSessionMonitoring();
    };
  }, [session]);

  // Effet pour surveiller l'activité utilisateur
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Ajouter les écouteurs d'événements
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      // Nettoyer les écouteurs d'événements
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Fonction pour forcer l'extension de session (utile pour les actions importantes)
  const forceSessionExtension = async () => {
    if (session) {
      await extendSession();
    }
  };

  return {
    isUserActive: isUserActive(),
    forceSessionExtension,
    lastActivity: lastActivityRef.current,
  };
}

/**
 * Hook pour afficher des notifications avant expiration de session
 */
export function useSessionExpirationWarning() {
  const { data: session } = useSession();
  const { isUserActive } = useSessionExtension();
  const warningShownRef = useRef<boolean>(false);

  useEffect(() => {
    if (!session || !isUserActive) {
      return;
    }

    // Vérifier si la session expire bientôt (dans les 15 minutes)
    const checkExpiration = () => {
      const now = Date.now();
      const sessionExpiry = session.expires ? new Date(session.expires).getTime() : now + 4 * 60 * 60 * 1000;
      const timeUntilExpiry = sessionExpiry - now;
      const WARNING_THRESHOLD = 15 * 60 * 1000; // 15 minutes

      if (timeUntilExpiry < WARNING_THRESHOLD && !warningShownRef.current) {
        warningShownRef.current = true;
        
        // Afficher une notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Session ChantierPro', {
            body: 'Votre session expire dans 15 minutes. Veuillez sauvegarder votre travail.',
            icon: '/favicon.ico',
          });
        }

        // Afficher une alerte dans la console
        console.warn('⚠️ Session expire dans 15 minutes');
      }
    };

    // Vérifier toutes les minutes
    const interval = setInterval(checkExpiration, 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [session, isUserActive]);

  return {
    warningShown: warningShownRef.current,
  };
}
