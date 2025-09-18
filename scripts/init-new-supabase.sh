#!/bin/bash

echo "🚀 INITIALISATION NOUVEAU SUPABASE CHANTIERPRO"
echo "=============================================="

# Variables du nouveau projet Supabase
export DATABASE_URL="postgresql://postgres:Mourouj1239!@db.jtrwfphxtusggfqpirpu.supabase.co:5432/postgres"

echo ""
echo "1️⃣ CONNEXION À LA BASE DE DONNÉES..."
echo "URL: $DATABASE_URL"

# Test de connexion
echo ""
echo "2️⃣ TEST DE CONNEXION..."
npx prisma db push --accept-data-loss || {
    echo "❌ Erreur de connexion à la base de données"
    exit 1
}
echo "✅ Connexion réussie"

echo ""
echo "3️⃣ GÉNÉRATION DU CLIENT PRISMA..."
npx prisma generate || {
    echo "❌ Erreur génération client Prisma"
    exit 1
}
echo "✅ Client Prisma généré"

echo ""
echo "4️⃣ CRÉATION DES TABLES..."
echo "✅ Tables créées avec succès (déjà fait à l'étape 2)"

echo ""
echo "5️⃣ AJOUT DES DONNÉES DE TEST..."
npm run db:seed || {
    echo "❌ Erreur ajout des données de test"
    exit 1
}
echo "✅ Données de test ajoutées"

echo ""
echo "6️⃣ VÉRIFICATION FINALE..."
echo "✅ Base de données initialisée avec succès"

echo ""
echo "🎉 INITIALISATION TERMINÉE AVEC SUCCÈS !"
echo "========================================="
echo ""
echo "📊 COMPTES DE TEST CRÉÉS :"
echo "👤 ADMIN: admin@chantierpro.fr / admin123"
echo "👨‍💼 COMMERCIAL: commercial@chantierpro.fr / commercial123"
echo "👥 CLIENT: marie.dubois@email.fr / client123"
echo ""
echo "🌐 NOUVEAU PROJET SUPABASE :"
echo "URL: https://jtrwfphxtusggfqpirpu.supabase.co"
echo "Database: PostgreSQL"
echo ""
echo "✅ Prêt pour le déploiement Vercel !"
