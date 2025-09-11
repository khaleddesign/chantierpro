'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (!online) {
        setShowIndicator(true)
      } else {
        // Masquer après 3 secondes quand on revient en ligne
        setTimeout(() => setShowIndicator(false), 3000)
      }
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      <div className="flex items-center space-x-2 text-sm">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connexion rétablie</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Mode hors ligne</span>
          </>
        )}
      </div>
    </div>
  )
}

// Hook pour détecter l'état de connexion
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return isOnline
}