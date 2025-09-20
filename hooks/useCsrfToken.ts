"use client";

import React, { useEffect, useState } from 'react';
import { getCsrfToken } from 'next-auth/react';

/**
 * Hook pour récupérer automatiquement le token CSRF
 * Utilisé dans tous les formulaires POST pour la protection CSRF
 */
export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = await getCsrfToken();
        if (token) {
          setCsrfToken(token);
        } else {
          setError('Impossible de récupérer le token CSRF');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du token CSRF:', err);
        setError('Erreur lors de la récupération du token CSRF');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCsrfToken();
  }, []);

  return { csrfToken, isLoading, error };
}

/**
 * Composant pour inclure automatiquement le token CSRF dans un formulaire
 * Utilisez ce composant dans tous vos formulaires POST
 */
export function CsrfTokenField() {
  const { csrfToken, isLoading, error } = useCsrfToken();

  if (isLoading) {
    return React.createElement('input', {
      type: 'hidden',
      name: 'csrfToken',
      value: '',
      disabled: true
    });
  }

  if (error) {
    console.error('Erreur CSRF:', error);
    return null;
  }

  return React.createElement('input', {
    type: 'hidden',
    name: 'csrfToken',
    value: csrfToken
  });
}

/**
 * Fonction utilitaire pour inclure le token CSRF dans les requêtes fetch
 * Utilisez cette fonction pour toutes vos requêtes POST/PUT/DELETE
 */
export async function fetchWithCsrf(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Récupérer le token CSRF
    const csrfToken = await getCsrfToken();
    
    if (!csrfToken) {
      throw new Error('Token CSRF non disponible');
    }

    // Préparer les headers
    const headers = new Headers(options.headers);
    headers.set('X-CSRF-Token', csrfToken);
    
    // Si c'est une requête avec body (POST/PUT/DELETE)
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
      // Si c'est du JSON, ajouter le token dans le body
      if (headers.get('Content-Type')?.includes('application/json')) {
        const body = options.body ? JSON.parse(options.body as string) : {};
        body.csrfToken = csrfToken;
        options.body = JSON.stringify(body);
      }
      // Si c'est du form-data, ajouter le token dans les headers
      else {
        headers.set('X-CSRF-Token', csrfToken);
      }
    }

    // Effectuer la requête avec les headers CSRF
    return fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error('Erreur lors de la requête avec CSRF:', error);
    throw error;
  }
}

/**
 * Hook pour les formulaires avec gestion automatique du CSRF
 * Utilisez ce hook dans vos composants de formulaire
 */
export function useFormWithCsrf() {
  const { csrfToken, isLoading, error } = useCsrfToken();

  const submitForm = async (
    url: string, 
    data: Record<string, any>, 
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!csrfToken) {
      throw new Error('Token CSRF non disponible');
    }

    // Ajouter le token CSRF aux données
    const formData = {
      ...data,
      csrfToken,
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(formData),
      ...options,
    });
  };

  return {
    csrfToken,
    isLoading,
    error,
    submitForm,
  };
}