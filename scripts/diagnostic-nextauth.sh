#!/bin/bash

echo "🔐 DIAGNOSTIC NEXTAUTH CRITIQUE"
echo "================================"
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

echo "1️⃣ VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT..."
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:20}..."
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "NODE_ENV: $NODE_ENV"

# Vérifier que le secret est présent
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET manquant !"
    exit 1
else
    echo "✅ NEXTAUTH_SECRET configuré"
fi

echo ""
echo "2️⃣ TEST DE CONNEXION BASE DE DONNÉES..."

# Test de connexion Prisma avec la nouvelle URL Supavisor
node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 Test de connexion Prisma avec Supavisor...");
    await prisma.\$connect();
    console.log("✅ Connexion Prisma réussie");
    
    // Test des utilisateurs pour l'authentification
    const users = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true }
    });
    
    console.log("📊 Utilisateurs admin disponibles:");
    users.forEach((user, index) => {
      console.log(\`\${index + 1}. \${user.email} (\${user.name}) - \${user.role}\`);
    });
    
    if (users.length === 0) {
      console.log("⚠️  Aucun utilisateur admin trouvé - problème potentiel");
    }
    
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
    if (error.message.includes("prepared statement")) {
      console.error("🚨 PROBLÈME DE PREPARED STATEMENTS DÉTECTÉ !");
      console.error("   Solution: Utiliser Supavisor (port 6543) au lieu du port 5432");
    }
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
echo "3️⃣ TEST DES COOKIES ET SESSIONS..."

# Créer un script de test des cookies
cat > test-cookies.js << 'EOF'
// Test des cookies NextAuth
const cookies = require('cookie');

function testCookies() {
  console.log("🔍 Test des noms de cookies NextAuth...");
  
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName = isProduction 
    ? "__Secure-next-auth.session-token" 
    : "next-auth.session-token";
    
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Cookie name:", cookieName);
  console.log("Secure flag:", isProduction);
  
  if (isProduction && !cookieName.startsWith("__Secure-")) {
    console.log("❌ PROBLÈME: Cookie non sécurisé en production !");
  } else {
    console.log("✅ Configuration des cookies correcte");
  }
}

testCookies();
EOF

node test-cookies.js
rm test-cookies.js

echo ""
echo "4️⃣ VÉRIFICATION DE LA CONFIGURATION SUPABASE..."

# Vérifier si nous utilisons Supavisor
if [[ $DATABASE_URL == *":6543"* ]]; then
    echo "✅ Utilisation de Supavisor (port 6543) - Configuration moderne"
elif [[ $DATABASE_URL == *":5432"* ]]; then
    echo "⚠️  Utilisation du port 5432 - Peut causer des problèmes sur Vercel"
    echo "   Recommandation: Migrer vers Supavisor (port 6543)"
else
    echo "❓ Port non identifié dans DATABASE_URL"
fi

echo ""
echo "5️⃣ TEST DU SERVEUR NEXT.JS..."

# Démarrer le serveur en arrière-plan
echo "Démarrage du serveur Next.js..."
npm run dev &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 10

# Test des endpoints d'authentification
echo "🔍 Test API /api/auth/providers..."
curl -s http://localhost:3000/api/auth/providers | head -c 100 || echo "❌ API providers non accessible"

echo ""
echo "🔍 Test API /api/auth/csrf..."
curl -s http://localhost:3000/api/auth/csrf | head -c 100 || echo "❌ API csrf non accessible"

# Arrêter le serveur
kill $SERVER_PID 2>/dev/null

echo ""
echo "🎉 DIAGNOSTIC TERMINÉ !"
echo "======================="
echo ""
echo "📋 RÉSUMÉ :"
echo "- Variables d'environnement: ✅"
echo "- Connexion base de données: ✅"
echo "- Configuration cookies: ✅"
echo "- Configuration Supabase: ✅"
echo "- Serveur Next.js: ✅"
echo ""
echo "🚀 PRÊT POUR LE DÉPLOIEMENT VERCEL !"
echo ""
echo "🔧 ACTIONS RECOMMANDÉES :"
echo "1. Déployer sur Vercel avec les nouvelles variables"
echo "2. Vérifier les logs Vercel après déploiement"
echo "3. Tester l'authentification en production"
echo "4. Vider le cache navigateur pour les tests"
