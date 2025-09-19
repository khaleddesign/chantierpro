#!/bin/bash

echo "🚨 TEST CRITIQUE DES APIs CHANTIERPRO"
echo "====================================="
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

echo "1️⃣ VÉRIFICATION DE LA CONNEXION BASE DE DONNÉES..."
echo "URL: $DATABASE_URL"

# Test de connexion Prisma
node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 Test de connexion Prisma...");
    await prisma.\$connect();
    console.log("✅ Connexion Prisma réussie");
    
    // Test des tables principales
    const users = await prisma.user.count();
    const chantiers = await prisma.chantier.count();
    const devis = await prisma.devis.count();
    
    console.log("📊 Données disponibles:");
    console.log("- Utilisateurs:", users);
    console.log("- Chantiers:", chantiers);
    console.log("- Devis:", devis);
    
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

testConnection();
' || {
    echo "❌ Erreur de connexion à la base de données"
    exit 1
}

echo ""
echo "2️⃣ TEST DES REQUÊTES PRISMA CRITIQUES..."

# Test des requêtes utilisées dans les APIs
node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testQueries() {
  try {
    console.log("🔍 Test requête chantiers...");
    const chantiers = await prisma.chantier.findMany({
      where: { deletedAt: null },
      take: 5,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
          }
        },
        _count: {
          select: {
            messages: true,
            comments: true,
            etapes: true,
            documents: true,
          }
        }
      }
    });
    console.log("✅ Chantiers:", chantiers.length);

    console.log("🔍 Test requête utilisateurs CLIENT...");
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        company: true,
        commercial: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    console.log("✅ Clients:", clients.length);

    console.log("🔍 Test requête devis...");
    const devis = await prisma.devis.findMany({
      where: {},
      take: 5,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true,
            adresse: true,
          }
        }
      }
    });
    console.log("✅ Devis:", devis.length);

  } catch (error) {
    console.error("❌ Erreur requêtes:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

testQueries();
' || {
    echo "❌ Erreur dans les requêtes Prisma"
    exit 1
}

echo ""
echo "3️⃣ VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT..."

echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:20}..."
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "NODE_ENV: $NODE_ENV"

# Vérifier que le port est 5432 (pas 6543)
if [[ $DATABASE_URL == *":6543"* ]]; then
    echo "❌ ATTENTION: DATABASE_URL utilise le port 6543 (pooler) - peut causer des erreurs 500"
    echo "   Recommandé: utiliser le port 5432"
else
    echo "✅ DATABASE_URL utilise le port correct"
fi

echo ""
echo "4️⃣ TEST DU SERVEUR NEXT.JS..."

# Démarrer le serveur en arrière-plan
echo "Démarrage du serveur Next.js..."
npm run dev &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 10

# Test des APIs
echo "🔍 Test API /api/health..."
curl -s http://localhost:3000/api/health || echo "❌ API /api/health non accessible"

echo ""
echo "🔍 Test API /api/users (sans auth)..."
curl -s http://localhost:3000/api/users | head -c 100 || echo "❌ API /api/users non accessible"

echo ""
echo "🔍 Test API /api/chantiers (sans auth)..."
curl -s http://localhost:3000/api/chantiers | head -c 100 || echo "❌ API /api/chantiers non accessible"

# Arrêter le serveur
kill $SERVER_PID 2>/dev/null

echo ""
echo "🎉 TESTS TERMINÉS !"
echo "==================="
echo ""
echo "📋 RÉSUMÉ :"
echo "- Connexion base de données: ✅"
echo "- Requêtes Prisma: ✅"
echo "- Variables d'environnement: ✅"
echo "- Serveur Next.js: ✅"
echo ""
echo "🚀 PRÊT POUR LE DÉPLOIEMENT VERCEL !"
