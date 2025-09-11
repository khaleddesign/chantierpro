'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Vérifier le statut de connexion
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Déclencher une synchronisation
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('background-sync')
        })
      }
    }

    const handleOffline = () => setIsOnline(false)

    // Écouter les événements de synchronisation du SW
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        setPendingSync(event.data.remainingCount)
        setLastSync(new Date())
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
    }
  }, [])

  const handleRetry = () => {
    if (isOnline) {
      window.location.href = '/dashboard'
    } else {
      // Tenter de recharger la page
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Icône de statut */}
        <div className="mb-6">
          {isOnline ? (
            <Wifi className="w-16 h-16 text-green-500 mx-auto" />
          ) : (
            <WifiOff className="w-16 h-16 text-red-500 mx-auto" />
          )}
        </div>

        {/* Titre et message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isOnline ? 'Reconnecté !' : 'Mode Hors Ligne'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isOnline 
            ? "Votre connexion internet a été rétablie. Synchronisation en cours..."
            : "Vous êtes actuellement hors ligne. Certaines fonctionnalités sont limitées mais vous pouvez continuer à travailler."
          }
        </p>

        {/* Informations de synchronisation */}
        {pendingSync > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center text-yellow-700">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              <span>{pendingSync} action(s) en attente de synchronisation</span>
            </div>
          </div>
        )}

        {lastSync && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>
                Dernière sync: {lastSync.toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Fonctionnalités disponibles hors ligne */}
        <div className="text-left mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Fonctionnalités disponibles hors ligne:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Consultation des chantiers
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Lecture des messages
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Saisie de nouvelles données
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Consultation des documents
            </li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isOnline
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {isOnline ? 'Retourner au Dashboard' : 'Réessayer'}
          </button>

          <button
            onClick={() => window.location.href = '/dashboard/chantiers'}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Voir mes chantiers (mode offline)
          </button>
        </div>

        {/* Statut de l'application */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ChantierPro PWA • {isOnline ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>
      </div>
    </div>
  )
}