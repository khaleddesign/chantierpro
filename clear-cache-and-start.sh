#!/bin/bash

# Script anti-cache ChantierPro
echo "🧹 Nettoyage complet du cache..."

# Tuer tous les serveurs dev existants
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Supprimer tous les caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

# Nettoyer le cache npm
npm cache clean --force

echo "✅ Cache nettoyé"

# Démarrer sur port 3001 pour éviter le cache navigateur
echo "🚀 Démarrage sur port 3001..."
PORT=3001 npm run dev