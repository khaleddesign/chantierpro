'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Wifi, WifiOff } from 'lucide-react'

interface PWAManagerProps {
  userId?: string
}

export default function PWAManager({ userId }: PWAManagerProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [pendingSync, setPendingSync] = useState(0)

  useEffect(() => {
    // Vérifier le statut initial
    setIsOnline(navigator.onLine)
    checkNotificationPermission()

    // Enregistrer le service worker
    registerServiceWorker()

    // Écouter les changements de connexion
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        // Enregistrer le service worker personnalisé
        const registration = await navigator.serviceWorker.register('/sw-custom.js')
        setSwRegistration(registration)
        console.log('[PWA] Service Worker enregistré')

        // Écouter les messages du SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_COMPLETE') {
            setPendingSync(event.data.remainingCount)
            if (event.data.syncedCount > 0) {
              showSyncNotification(event.data.syncedCount)
            }
          }
        })

        // Vérifier les mises à jour du SW
        registration.addEventListener('updatefound', () => {
          console.log('[PWA] Mise à jour du Service Worker détectée')
          const newWorker = registration.installing
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouvelle version disponible
                showUpdateNotification()
              }
            })
          }
        })

      } catch (error) {
        console.error('[PWA] Erreur enregistrement Service Worker:', error)
      }
    }
  }

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')

      if (permission === 'granted' && swRegistration) {
        // S'abonner aux notifications push
        await subscribeToPush()
      }
    }
  }

  const subscribeToPush = async () => {
    if (!swRegistration) return

    try {
      // Clé publique VAPID (à remplacer par votre vraie clé)
      const vapidPublicKey = 'BK8QQQfU2-JxkP_SJlvA2E1ZQQOPqLvZ_QYQQrLzZhk1QQjQQQQQQ'
      
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      })

      // Envoyer l'abonnement au serveur
      await fetch('/api/mobile/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId
        })
      })

      console.log('[PWA] Abonnement push enregistré')
    } catch (error) {
      console.error('[PWA] Erreur abonnement push:', error)
    }
  }

  const showSyncNotification = (syncedCount: number) => {
    if ('Notification' in window && notificationsEnabled) {
      new Notification(`ChantierPro - Synchronisation`, {
        body: `${syncedCount} action(s) synchronisée(s)`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png'
      })
    }
  }

  const showUpdateNotification = () => {
    if ('Notification' in window && notificationsEnabled) {
      const notification = new Notification('ChantierPro - Mise à jour', {
        body: 'Une nouvelle version est disponible. Cliquez pour mettre à jour.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        requireInteraction: true
      })

      notification.onclick = () => {
        window.location.reload()
      }
    }
  }

  const manualSync = async () => {
    if (swRegistration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await (swRegistration as any).sync.register('background-sync')
        console.log('[PWA] Synchronisation manuelle déclenchée')
      } catch (error) {
        console.error('[PWA] Erreur synchronisation manuelle:', error)
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Indicateur de statut */}
      <div className="flex flex-col space-y-2">
        {/* Statut connexion */}
        <div className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
          ${isOnline 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
        `}>
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>En ligne</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Hors ligne</span>
            </>
          )}
        </div>

        {/* Indicateur de synchronisation en attente */}
        {pendingSync > 0 && (
          <div className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span>{pendingSync} en attente</span>
              <button
                onClick={manualSync}
                disabled={!isOnline}
                className="ml-2 text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded disabled:opacity-50"
              >
                Sync
              </button>
            </div>
          </div>
        )}

        {/* Bouton notifications */}
        {!notificationsEnabled && 'Notification' in window && (
          <button
            onClick={requestNotificationPermission}
            className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-blue-200 transition-colors"
          >
            <BellOff className="w-4 h-4" />
            <span>Activer notifications</span>
          </button>
        )}

        {notificationsEnabled && (
          <div className="bg-green-100 text-green-800 border border-green-200 px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications ON</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Utility function pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}