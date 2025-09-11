import type { Metadata, Viewport } from "next";
// import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// const inter = Inter({ 
//   subsets: ['latin'],
//   display: 'swap',
//   fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
// })

// Polices définies dans globals.css pour éviter les problèmes de connectivité avec Google Fonts

export const metadata: Metadata = {
  title: 'ChantierPro - Gestion de chantiers BTP',
  description: 'Plateforme de gestion complète pour les professionnels du BTP',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ChantierPro',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}