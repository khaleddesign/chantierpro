import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers/Providers";

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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}