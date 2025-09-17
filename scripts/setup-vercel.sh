#!/bin/bash

# Script de configuration pour déploiement Vercel
echo "🔧 Configuration ChantierPro pour Vercel..."

# Créer le répertoire tmp pour SQLite
mkdir -p tmp

# Générer le client Prisma
echo "📦 Génération du client Prisma..."
npx prisma generate

# Créer la base de données SQLite temporaire
echo "🗄️ Création de la base de données SQLite..."
npx prisma db push

# Seed avec des données de test
echo "🌱 Ajout de données de test..."
npx prisma db seed

echo "✅ Configuration terminée !"
echo "📋 Variables d'environnement requises pour Vercel :"
echo "NEXTAUTH_SECRET=chantierpro-production-secret-key-2025-very-long-and-secure"
echo "NEXTAUTH_URL=https://chantierpro-g39ldrxhs-khaleddesigns-projects.vercel.app"
echo "DATABASE_URL=file:./tmp/dev.db"
echo "REDIS_DISABLED=true"
