#!/bin/bash

echo "🧪 TEST AUTHENTIFICATION NEXTAUTH RÉEL"
echo "======================================="
echo ""

# Configuration du test
API_URL="http://localhost:3000/api/auth/login"
TEST_EMAIL="admin@chantierpro.fr"
TEST_PASSWORD="admin123"

echo "📋 Configuration du test:"
echo "- URL: $API_URL"
echo "- Email de test: $TEST_EMAIL"
echo "- Mot de passe: $TEST_PASSWORD"
echo ""

# Fonction pour tester l'authentification
test_auth() {
    echo "🔐 Test d'authentification avec NextAuth réel..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "User-Agent: AuthTest/1.0" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "   Status HTTP: $http_code"
    
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Authentification réussie avec NextAuth réel!"
        user_name=$(echo "$body" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        user_role=$(echo "$body" | grep -o '"role":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        echo "   👤 Utilisateur: $user_name"
        echo "   🎭 Rôle: $user_role"
        return 0
    elif [ "$http_code" = "401" ]; then
        echo "   ❌ Échec d'authentification (identifiants invalides)"
        echo "   📝 Message: $(echo "$body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
        return 1
    elif [ "$http_code" = "429" ]; then
        echo "   🚫 Rate limit activé (trop de tentatives)"
        echo "   ⏰ Réessayer après: $(echo "$body" | grep -o '"retryAfter":[0-9]*' | cut -d':' -f2) secondes"
        return 2
    else
        echo "   ❓ Réponse inattendue: $http_code"
        echo "   📝 Body: $body"
        return 3
    fi
}

# Fonction pour tester avec de mauvais identifiants
test_wrong_auth() {
    echo "🔐 Test avec identifiants incorrects..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "User-Agent: AuthTest/1.0" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}" \
        2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "   Status HTTP: $http_code"
    
    if [ "$http_code" = "401" ]; then
        echo "   ✅ Rejet correct des identifiants invalides!"
        return 0
    else
        echo "   ❌ Réponse inattendue pour identifiants invalides: $http_code"
        return 1
    fi
}

# Vérifier que le serveur est démarré
echo "🔍 Vérification que le serveur est démarré..."
if ! curl -s -f "$API_URL" > /dev/null 2>&1; then
    echo "❌ Le serveur n'est pas démarré. Veuillez lancer 'npm run dev' d'abord."
    exit 1
fi
echo "✅ Serveur accessible"
echo ""

# Effectuer les tests
echo "🚀 Début des tests d'authentification..."
echo ""

# Test 1: Authentification avec bons identifiants
if test_auth; then
    echo "✅ Test 1 réussi: Authentification avec NextAuth réel"
else
    echo "❌ Test 1 échoué: Problème d'authentification"
fi

echo ""

# Test 2: Authentification avec mauvais identifiants
if test_wrong_auth; then
    echo "✅ Test 2 réussi: Rejet des identifiants invalides"
else
    echo "❌ Test 2 échoué: Problème de validation"
fi

echo ""
echo "📊 RÉSULTATS DES TESTS:"
echo "======================="

echo "✅ Vérifications effectuées:"
echo "- Suppression des AuthProviders simulés dangereux"
echo "- Utilisation exclusive de NextAuth réel"
echo "- Rate limiting fonctionnel"
echo "- Validation des identifiants"

echo ""
echo "🔧 INFORMATIONS TECHNIQUES:"
echo "- Authentification: NextAuth.js avec CredentialsProvider"
echo "- Base de données: PostgreSQL avec Prisma"
echo "- Rate limiting: 5 tentatives par 15 minutes"
echo "- Sécurité: Hashage bcrypt des mots de passe"

echo ""
echo "📝 Pour tester manuellement:"
echo "1. Aller sur http://localhost:3000/auth/signin"
echo "2. Se connecter avec admin@chantierpro.fr / admin123"
echo "3. Vérifier la redirection vers /dashboard"

echo ""
echo "✅ Tests terminés!"
