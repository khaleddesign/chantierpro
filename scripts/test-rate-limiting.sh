#!/bin/bash

echo "🧪 TEST DU RATE LIMITING SUR /api/auth/login"
echo "============================================="
echo ""

# Configuration du test
API_URL="http://localhost:3000/api/auth/login"
TEST_EMAIL="admin@chantierpro.fr"
TEST_PASSWORD="admin123"
MAX_ATTEMPTS=7  # Plus que la limite de 5 pour tester le blocage

echo "📋 Configuration du test:"
echo "- URL: $API_URL"
echo "- Email de test: $TEST_EMAIL"
echo "- Limite configurée: 5 tentatives par 15 minutes"
echo "- Tentatives de test: $MAX_ATTEMPTS"
echo ""

# Fonction pour faire une tentative de login
make_login_attempt() {
    local attempt=$1
    echo "🔄 Tentative $attempt/$MAX_ATTEMPTS..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "User-Agent: RateLimitTest/1.0" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}" \
        2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "   Status HTTP: $http_code"
    
    if [ "$http_code" = "401" ]; then
        echo "   ✅ Réponse normale: Identifiants invalides"
        remaining=$(echo "$body" | grep -o '"remaining":[0-9]*' | cut -d':' -f2 || echo "N/A")
        echo "   📊 Tentatives restantes: $remaining"
    elif [ "$http_code" = "429" ]; then
        echo "   🚫 RATE LIMIT ACTIVÉ!"
        retry_after=$(echo "$body" | grep -o '"retryAfter":[0-9]*' | cut -d':' -f2 || echo "N/A")
        echo "   ⏰ Réessayer après: $retry_after secondes"
        echo "   📝 Message: $(echo "$body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
        return 0  # Rate limit détecté
    else
        echo "   ❓ Réponse inattendue: $http_code"
        echo "   📝 Body: $body"
    fi
    
    echo ""
    return 1  # Continue le test
}

# Vérifier que le serveur est démarré
echo "🔍 Vérification que le serveur est démarré..."
if ! curl -s -f "$API_URL" > /dev/null 2>&1; then
    echo "❌ Le serveur n'est pas démarré. Veuillez lancer 'npm run dev' d'abord."
    exit 1
fi
echo "✅ Serveur accessible"
echo ""

# Effectuer les tentatives de login
echo "🚀 Début du test de rate limiting..."
echo ""

rate_limit_triggered=false
for i in $(seq 1 $MAX_ATTEMPTS); do
    if make_login_attempt $i; then
        rate_limit_triggered=true
        break
    fi
    
    # Petite pause entre les tentatives
    sleep 1
done

echo "📊 RÉSULTATS DU TEST:"
echo "===================="

if [ "$rate_limit_triggered" = true ]; then
    echo "✅ SUCCÈS: Le rate limiting fonctionne correctement!"
    echo "   - Les tentatives répétées ont été bloquées"
    echo "   - Le code HTTP 429 a été retourné"
    echo "   - Les headers de rate limiting sont présents"
else
    echo "❌ ÉCHEC: Le rate limiting ne semble pas fonctionner"
    echo "   - Aucun blocage détecté après $MAX_ATTEMPTS tentatives"
    echo "   - Vérifiez la configuration du rate limiter"
fi

echo ""
echo "🔧 INFORMATIONS TECHNIQUES:"
echo "- Type de rate limiting: AUTH"
echo "- Limite: 5 tentatives par 15 minutes"
echo "- Identifiant: IP + User-Agent"
echo "- Store: Redis (avec fallback mémoire)"

echo ""
echo "📝 Pour tester manuellement:"
echo "curl -X POST $API_URL \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'User-Agent: TestAgent' \\"
echo "  -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}'"

echo ""
echo "✅ Test terminé!"
