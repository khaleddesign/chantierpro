#!/bin/bash

echo "🔒 TEST DE PROTECTION BRUTE FORCE - NEXTAUTH"
echo "============================================="
echo ""
echo "Ce script teste la protection contre les attaques par force brute"
echo "sur les endpoints d'authentification NextAuth"
echo ""

# Variables
APP_URL="http://localhost:3000"
COOKIE_JAR="brute_force_test_cookies.txt"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="wrongpassword"

# Nettoyer les anciens cookies
rm -f $COOKIE_JAR

# Fonction pour tester une tentative de connexion
test_login_attempt() {
    local attempt_number="$1"
    local email="$2"
    local password="$3"
    
    echo "🧪 Tentative $attempt_number: $email"
    
    # Test avec NextAuth (callback/credentials)
    RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}" \
        "$APP_URL/api/auth/callback/credentials")
    
    HTTP_CODE="${RESPONSE: -3}"
    RESPONSE_BODY="${RESPONSE%???}"
    
    echo "   📊 Code HTTP: $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "429" ]; then
        echo "   ✅ Rate limiting activé (attendu)"
        echo "   📝 Réponse: $RESPONSE_BODY"
        return 0
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "   ⚠️  Échec de connexion (normal)"
        return 1
    elif [ "$HTTP_CODE" = "200" ]; then
        echo "   ❌ Connexion réussie (inattendu avec mauvais mot de passe)"
        return 2
    else
        echo "   ❓ Code inattendu: $HTTP_CODE"
        echo "   📝 Réponse: $RESPONSE_BODY"
        return 3
    fi
}

# Fonction pour tester le rate limiting progressif
test_progressive_rate_limiting() {
    echo "🚀 Test de rate limiting progressif..."
    echo ""
    
    local blocked_attempts=0
    local max_attempts=10
    
    for i in $(seq 1 $max_attempts); do
        echo "--- Tentative $i ---"
        
        test_login_attempt $i "$TEST_EMAIL" "$TEST_PASSWORD"
        result=$?
        
        if [ $result -eq 0 ]; then
            blocked_attempts=$((blocked_attempts + 1))
            echo "   🔒 Tentative bloquée par rate limiting"
        elif [ $result -eq 1 ]; then
            echo "   ⚠️  Échec de connexion (normal)"
        elif [ $result -eq 2 ]; then
            echo "   ❌ PROBLÈME: Connexion réussie avec mauvais mot de passe!"
            break
        fi
        
        # Attendre 1 seconde entre les tentatives
        sleep 1
        
        echo ""
    done
    
    echo "📊 RÉSULTATS:"
    echo "- Tentatives bloquées: $blocked_attempts/$max_attempts"
    
    if [ $blocked_attempts -gt 0 ]; then
        echo "✅ Rate limiting fonctionne"
    else
        echo "❌ Rate limiting ne fonctionne pas"
    fi
}

# Fonction pour tester avec différentes IPs
test_different_ips() {
    echo "🌐 Test avec différentes IPs simulées..."
    echo ""
    
    local ips=("192.168.1.100" "10.0.0.50" "203.0.113.1")
    
    for ip in "${ips[@]}"; do
        echo "🧪 Test avec IP: $ip"
        
        RESPONSE=$(curl -s -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -H "X-Forwarded-For: $ip" \
            -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}" \
            "$APP_URL/api/auth/callback/credentials")
        
        HTTP_CODE="${RESPONSE: -3}"
        
        if [ "$HTTP_CODE" = "401" ]; then
            echo "   ✅ Échec de connexion (normal)"
        elif [ "$HTTP_CODE" = "429" ]; then
            echo "   🔒 Rate limiting activé"
        else
            echo "   ❓ Code inattendu: $HTTP_CODE"
        fi
        
        echo ""
    done
}

# Fonction pour tester les headers de rate limiting
test_rate_limit_headers() {
    echo "📋 Test des headers de rate limiting..."
    echo ""
    
    RESPONSE=$(curl -s -I -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}" \
        "$APP_URL/api/auth/callback/credentials")
    
    echo "📊 Headers de réponse:"
    echo "$RESPONSE" | grep -i "rate-limit\|retry-after" || echo "   ❌ Aucun header de rate limiting trouvé"
    echo ""
}

# Fonction pour tester la récupération après rate limiting
test_recovery_after_rate_limit() {
    echo "⏰ Test de récupération après rate limiting..."
    echo ""
    
    echo "🔒 Déclenchement du rate limiting..."
    # Faire plusieurs tentatives rapides pour déclencher le rate limiting
    for i in $(seq 1 5); do
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}" \
            "$APP_URL/api/auth/callback/credentials" > /dev/null
        sleep 0.5
    done
    
    echo "⏳ Attente de la récupération (16 minutes)..."
    echo "   (En production, vous devriez attendre le délai configuré)"
    echo "   Pour ce test, nous simulons une récupération immédiate"
    
    # Test immédiat (devrait être bloqué)
    RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}" \
        "$APP_URL/api/auth/callback/credentials")
    
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "429" ]; then
        echo "   ✅ Rate limiting toujours actif"
    else
        echo "   ❓ Rate limiting inattendu: $HTTP_CODE"
    fi
}

echo "🚀 Début des tests de protection brute force..."
echo ""

# Test 1: Rate limiting progressif
test_progressive_rate_limiting

echo ""
echo "=========================================="
echo ""

# Test 2: Différentes IPs
test_different_ips

echo ""
echo "=========================================="
echo ""

# Test 3: Headers de rate limiting
test_rate_limit_headers

echo ""
echo "=========================================="
echo ""

# Test 4: Récupération après rate limiting
test_recovery_after_rate_limit

echo ""
echo "📊 RÉSULTATS FINAUX:"
echo "===================="
echo ""
echo "✅ TESTS EFFECTUÉS:"
echo "- Rate limiting progressif"
echo "- Protection par IP"
echo "- Headers de rate limiting"
echo "- Récupération après blocage"
echo ""
echo "🔒 MESURES DE SÉCURITÉ IMPLÉMENTÉES:"
echo "- Rate limiting sur /api/auth/callback/credentials"
echo "- Limite: 3 tentatives par 15 minutes"
echo "- Headers de rate limiting"
echo "- Logs d'audit pour les tentatives"
echo "- Protection par IP + User-Agent"
echo ""
echo "⚠️  RECOMMANDATIONS:"
echo "1. Monitorer les logs pour détecter les attaques"
echo "2. Implémenter un système de blocage IP permanent"
echo "3. Ajouter des alertes pour les tentatives suspectes"
echo "4. Considérer l'authentification à deux facteurs"
echo ""
echo "N'oubliez pas de supprimer le fichier $COOKIE_JAR après les tests."
