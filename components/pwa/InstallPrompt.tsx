'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Se souvenir que l'utilisateur a refusé (pour ne pas redemander immédiatement)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Ne pas afficher si installé ou si récemment refusé
  if (isInstalled || !showPrompt || !deferredPrompt) return null

  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
    return null // Refusé il y a moins de 7 jours
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Installer ChantierPro</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Installez l'application pour un accès plus rapide et une meilleure expérience mobile.
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded hover:bg-blue-700 transition-colors"
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded hover:bg-gray-200 transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook pour détecter si l'app est installée
export function useIsInstalled() {
  const [isInstalled, setIsInstalled] = useState(false)
  
  useEffect(() => {
    const checkInstalled = () => {
      if (typeof window !== 'undefined') {
        setIsInstalled(
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true
        )
      }
    }
    
    checkInstalled()
    window.addEventListener('resize', checkInstalled)
    
    return () => window.removeEventListener('resize', checkInstalled)
  }, [])
  
  return isInstalled
}