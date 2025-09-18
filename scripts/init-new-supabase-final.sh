#!/bin/bash

echo "🚀 INITIALISATION NOUVELLE BASE SUPABASE CHANTIERPRO"
echo "===================================================="

# Variables du nouveau projet Supabase
export DATABASE_URL="postgresql://postgres:Mourouj1239!@db.jtrwfphxtusggfqpirpu.supabase.co:5432/postgres"
export SUPABASE_URL="https://jtrwfphxtusggfqpirpu.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cndmcGh4dHVzZ2dmcXBpcnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzEwMTMsImV4cCI6MjA2OTkwNzAxM30.TQ7L-T23aQzhvq-Pm7prHSINZEgtyjafo6_cvkXSlfo"

echo ""
echo "1️⃣ CONNEXION À LA NOUVELLE BASE DE DONNÉES..."
echo "URL: $DATABASE_URL"

# Test de connexion et création des tables
echo ""
echo "2️⃣ CRÉATION DES TABLES..."
npx prisma db push --accept-data-loss || {
    echo "❌ Erreur création des tables"
    exit 1
}
echo "✅ Tables créées avec succès"

echo ""
echo "3️⃣ GÉNÉRATION DU CLIENT PRISMA..."
npx prisma generate || {
    echo "❌ Erreur génération client Prisma"
    exit 1
}
echo "✅ Client Prisma généré"

echo ""
echo "4️⃣ AJOUT DES UTILISATEURS DE TEST..."
npm run db:seed || {
    echo "❌ Erreur ajout des données de test"
    exit 1
}
echo "✅ Utilisateurs de test ajoutés"

echo ""
echo "5️⃣ VÉRIFICATION FINALE..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDB() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    });
    console.log('✅ NOUVELLE BASE DE DONNÉES INITIALISÉE :');
    console.log('👥 Utilisateurs trouvés:', users.length);
    users.forEach(user => {
      console.log(\`- \${user.email} (\${user.name}) - \${user.role}\`);
    });
  } catch (error) {
    console.error('❌ Erreur vérification:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

verifyDB();
"

echo ""
echo "🎉 INITIALISATION TERMINÉE AVEC SUCCÈS !"
echo "========================================="
echo ""
echo "📊 COMPTES DE TEST DISPONIBLES :"
echo "👤 ADMIN: admin@chantierpro.fr / admin123"
echo "👨‍💼 COMMERCIAL: commercial@chantierpro.fr / commercial123"
echo "👥 CLIENT: marie.dubois@email.fr / client123"
echo ""
echo "🌐 NOUVEAU PROJET SUPABASE :"
echo "URL: https://jtrwfphxtusggfqpirpu.supabase.co"
echo "Database: PostgreSQL"
echo ""
echo "✅ Prêt pour le déploiement Vercel !"
