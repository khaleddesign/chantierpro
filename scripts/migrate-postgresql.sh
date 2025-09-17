#!/bin/bash

# Script de migration PostgreSQL pour Supabase
echo "🚀 Migration ChantierPro vers PostgreSQL..."

# Vérifier que DATABASE_URL est définie
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERREUR: DATABASE_URL n'est pas définie"
    echo "📋 Veuillez définir votre URL Supabase :"
    echo "export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.oikxkloiqxhwwtkfpbkb.supabase.co:5432/postgres'"
    exit 1
fi

echo "✅ DATABASE_URL configurée"

# Générer le client Prisma
echo "📦 Génération du client Prisma..."
npx prisma generate

# Créer la migration initiale
echo "🗄️ Création de la migration initiale..."
npx prisma migrate dev --name init

# Appliquer les migrations
echo "🔄 Application des migrations..."
npx prisma migrate deploy

# Seed avec des données de test
echo "🌱 Ajout de données de test..."
npx prisma db seed

echo "✅ Migration PostgreSQL terminée !"
echo "📋 Votre base de données Supabase est maintenant configurée"
echo "🔗 URL: $DATABASE_URL"
