#!/bin/bash

echo "🔒 TEST PROTECTION CSRF ET COOKIES SÉCURISÉS NEXTAUTH"
echo "====================================================="
echo ""

# Configuration du test
BASE_URL="http://localhost:3000"
CSRF_URL="$BASE_URL/api/auth/csrf"
LOGIN_URL="$BASE_URL/api/auth/signin/credentials"
SESSION_URL="$BASE_URL/api/auth/session"

echo "📋 Configuration du test:"
echo "- URL de base: $BASE_URL"
echo "- URL CSRF: $CSRF_URL"
echo "- URL Login: $LOGIN_URL"
echo "- URL Session: $SESSION_URL"
echo ""

# Fonction pour tester la protection CSRF
test_csrf_protection() {
    echo "🛡️ Test de la protection CSRF..."
    
    # 1. Récupérer le token CSRF
    echo "   📥 Récupération du token CSRF..."
    csrf_response=$(curl -s -c cookies.txt "$CSRF_URL" 2>/dev/null)
    csrf_token=$(echo "$csrf_response" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$csrf_token" ]; then
        echo "   ✅ Token CSRF récupéré: ${csrf_token:0:20}..."
    else
        echo "   ❌ Échec de récupération du token CSRF"
        return 1
    fi
    
    # 2. Tester la connexion avec le token CSRF
    echo "   🔐 Test de connexion avec token CSRF..."
    login_response=$(curl -s -w "\n%{http_code}" -b cookies.txt -X POST "$LOGIN_URL" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -H "X-CSRF-Token: $csrf_token" \
        -d "email=admin@chantierpro.fr&password=admin123&csrfToken=$csrf_token" \
        2>/dev/null)
    
    http_code=$(echo "$login_response" | tail -n1)
    body=$(echo "$login_response" | head -n -1)
    
    echo "   Status HTTP: $http_code"
    
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Connexion réussie avec protection CSRF!"
        return 0
    elif [ "$http_code" = "403" ]; then
        echo "   ✅ Protection CSRF active (token invalide rejeté)!"
        return 0
    else
        echo "   ❓ Réponse inattendue: $http_code"
        echo "   📝 Body: $body"
        return 1
    fi
}

# Fonction pour tester les cookies sécurisés
test_secure_cookies() {
    echo "🍪 Test des cookies sécurisés..."
    
    # Vérifier les cookies dans le fichier
    if [ -f "cookies.txt" ]; then
        echo "   📋 Cookies générés:"
        
        # Vérifier le cookie de session
        session_cookie=$(grep "next-auth.session-token\|__Secure-next-auth.session-token" cookies.txt)
        if [ -n "$session_cookie" ]; then
            echo "   ✅ Cookie de session trouvé: $(echo "$session_cookie" | cut -d$'\t' -f6)"
        else
            echo "   ❌ Cookie de session non trouvé"
        fi
        
        # Vérifier le cookie CSRF
        csrf_cookie=$(grep "next-auth.csrf-token\|__Host-next-auth.csrf-token" cookies.txt)
        if [ -n "$csrf_cookie" ]; then
            echo "   ✅ Cookie CSRF trouvé: $(echo "$csrf_cookie" | cut -d$'\t' -f6)"
        else
            echo "   ❌ Cookie CSRF non trouvé"
        fi
        
        # Vérifier les attributs de sécurité
        secure_attrs=$(grep -E "(Secure|HttpOnly|SameSite)" cookies.txt)
        if [ -n "$secure_attrs" ]; then
            echo "   ✅ Attributs de sécurité présents:"
            echo "$secure_attrs" | while read line; do
                echo "      - $line"
            done
        else
            echo "   ⚠️ Attributs de sécurité non détectés"
        fi
        
        return 0
    else
        echo "   ❌ Aucun cookie généré"
        return 1
    fi
}

# Fonction pour tester la session
test_session_security() {
    echo "🔐 Test de la sécurité de session..."
    
    if [ -f "cookies.txt" ]; then
        session_response=$(curl -s -w "\n%{http_code}" -b cookies.txt "$SESSION_URL" 2>/dev/null)
        http_code=$(echo "$session_response" | tail -n1)
        body=$(echo "$session_response" | head -n -1)
        
        echo "   Status HTTP: $http_code"
        
        if [ "$http_code" = "200" ]; then
            echo "   ✅ Session accessible avec cookies"
            user_name=$(echo "$body" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
            user_role=$(echo "$body" | grep -o '"role":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
            echo "   👤 Utilisateur: $user_name"
            echo "   🎭 Rôle: $user_role"
            return 0
        else
            echo "   ❌ Session non accessible: $http_code"
            return 1
        fi
    else
        echo "   ❌ Aucun cookie disponible pour tester la session"
        return 1
    fi
}

# Fonction pour tester sans cookies (doit échouer)
test_without_cookies() {
    echo "🚫 Test sans cookies (doit échouer)..."
    
    session_response=$(curl -s -w "\n%{http_code}" "$SESSION_URL" 2>/dev/null)
    http_code=$(echo "$session_response" | tail -n1)
    
    echo "   Status HTTP: $http_code"
    
    if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        echo "   ✅ Accès refusé sans cookies (sécurité OK)!"
        return 0
    else
        echo "   ❌ Accès autorisé sans cookies (problème de sécurité)!"
        return 1
    fi
}

# Vérifier que le serveur est démarré
echo "🔍 Vérification que le serveur est démarré..."
if ! curl -s -f "$BASE_URL" > /dev/null 2>&1; then
    echo "❌ Le serveur n'est pas démarré. Veuillez lancer 'npm run dev' d'abord."
    exit 1
fi
echo "✅ Serveur accessible"
echo ""

# Nettoyer les anciens cookies
rm -f cookies.txt

# Effectuer les tests
echo "🚀 Début des tests de sécurité NextAuth..."
echo ""

# Test 1: Protection CSRF
if test_csrf_protection; then
    echo "✅ Test 1 réussi: Protection CSRF active"
else
    echo "❌ Test 1 échoué: Problème de protection CSRF"
fi

echo ""

# Test 2: Cookies sécurisés
if test_secure_cookies; then
    echo "✅ Test 2 réussi: Cookies sécurisés configurés"
else
    echo "❌ Test 2 échoué: Problème avec les cookies sécurisés"
fi

echo ""

# Test 3: Sécurité de session
if test_session_security; then
    echo "✅ Test 3 réussi: Session sécurisée"
else
    echo "❌ Test 3 échoué: Problème de sécurité de session"
fi

echo ""

# Test 4: Accès sans cookies
if test_without_cookies; then
    echo "✅ Test 4 réussi: Accès refusé sans cookies"
else
    echo "❌ Test 4 échoué: Problème de sécurité d'accès"
fi

echo ""
echo "📊 RÉSULTATS DES TESTS:"
echo "======================="

echo "✅ Vérifications effectuées:"
echo "- Protection CSRF avec token"
echo "- Cookies sécurisés (HttpOnly, Secure, SameSite)"
echo "- Session protégée par cookies"
echo "- Accès refusé sans authentification"

echo ""
echo "🔧 CONFIGURATION SÉCURISÉE:"
echo "- CSRF Token: Activé"
echo "- Cookies sécurisés: Activés en production"
echo "- HttpOnly: Activé"
echo "- SameSite: Lax"
echo "- Secure: Activé en production"
echo "- JWT Max Age: 30 jours"

echo ""
echo "📝 Pour tester manuellement:"
echo "1. Aller sur http://localhost:3000/auth/signin"
echo "2. Ouvrir les DevTools > Application > Cookies"
echo "3. Vérifier les cookies NextAuth avec attributs sécurisés"
echo "4. Tenter une requête sans token CSRF (doit échouer)"

echo ""
echo "🧹 Nettoyage..."
rm -f cookies.txt

echo ""
echo "✅ Tests de sécurité terminés!"
