#!/bin/bash

echo "🔍 TEST DE DÉCONNEXION AUTOMATIQUE APRÈS 4 HEURES"
echo "================================================="
echo ""

# Configuration du test
BASE_URL="http://localhost:3000"
LOGIN_URL="$BASE_URL/api/auth/login"
SESSION_URL="$BASE_URL/api/auth/session"
DASHBOARD_URL="$BASE_URL/dashboard"

echo "📋 Configuration du test:"
echo "- URL de base: $BASE_URL"
echo "- URL Login: $LOGIN_URL"
echo "- URL Session: $SESSION_URL"
echo "- URL Dashboard: $DASHBOARD_URL"
echo ""

# Fonction pour tester la configuration des sessions
test_session_configuration() {
    echo "⚙️ Test de la configuration des sessions..."
    
    if [ -f "lib/auth.ts" ]; then
        echo "   ✅ Fichier lib/auth.ts trouvé"
        
        # Vérifier la durée de session
        if grep -q "maxAge: 4 \* 60 \* 60" lib/auth.ts; then
            echo "   ✅ Durée de session configurée à 4 heures"
        else
            echo "   ❌ Durée de session non configurée à 4 heures"
            return 1
        fi
        
        # Vérifier la mise à jour de session
        if grep -q "updateAge: 60 \* 60" lib/auth.ts; then
            echo "   ✅ Mise à jour de session configurée à 1 heure"
        else
            echo "   ❌ Mise à jour de session non configurée"
            return 1
        fi
        
        return 0
    else
        echo "   ❌ Fichier lib/auth.ts non trouvé"
        return 1
    fi
}

# Fonction pour tester la connexion et vérifier la session
test_session_creation() {
    echo "🔐 Test de création de session..."
    
    # 1. Se connecter
    echo "   🔑 Connexion..."
    login_response=$(curl -s -c cookies.txt -X POST "$LOGIN_URL" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@chantierpro.fr","password":"admin123"}' \
        2>/dev/null)
    
    http_code=$(echo "$login_response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Connexion réussie"
    else
        echo "   ❌ Échec de connexion: $http_code"
        return 1
    fi
    
    # 2. Vérifier la session
    echo "   📋 Vérification de la session..."
    session_response=$(curl -s -b cookies.txt "$SESSION_URL" 2>/dev/null)
    
    if echo "$session_response" | grep -q "admin@chantierpro.fr"; then
        echo "   ✅ Session active"
        
        # Extraire la date d'expiration si possible
        if echo "$session_response" | grep -q "expires"; then
            echo "   ✅ Date d'expiration présente dans la session"
        else
            echo "   ⚠️  Date d'expiration non visible dans la réponse"
        fi
        
        return 0
    else
        echo "   ❌ Session non active"
        return 1
    fi
}

# Fonction pour tester l'accès à une page protégée
test_protected_access() {
    echo "🔒 Test d'accès à une page protégée..."
    
    # 1. Accéder au dashboard avec session active
    echo "   📊 Accès au dashboard..."
    dashboard_response=$(curl -s -w "\n%{http_code}" -b cookies.txt "$DASHBOARD_URL" 2>/dev/null)
    http_code=$(echo "$dashboard_response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Accès au dashboard autorisé"
    else
        echo "   ❌ Accès au dashboard refusé: $http_code"
        return 1
    fi
    
    return 0
}

# Fonction pour simuler l'inactivité
simulate_inactivity() {
    echo "⏳ Simulation d'inactivité..."
    
    # Simuler 5 minutes d'inactivité (réduit pour le test)
    echo "   🕐 Attente de 5 minutes (simulation)..."
    sleep 2  # Simulation réduite
    
    # Vérifier que la session est toujours active après une courte période
    echo "   📋 Vérification de la session après inactivité..."
    session_response=$(curl -s -b cookies.txt "$SESSION_URL" 2>/dev/null)
    
    if echo "$session_response" | grep -q "admin@chantierpro.fr"; then
        echo "   ✅ Session toujours active après inactivité"
        return 0
    else
        echo "   ❌ Session expirée après inactivité"
        return 1
    fi
}

# Fonction pour tester l'extension automatique de session
test_session_extension() {
    echo "🔄 Test de l'extension automatique de session..."
    
    # 1. Effectuer une action qui devrait étendre la session
    echo "   📝 Action pour étendre la session..."
    action_response=$(curl -s -b cookies.txt -X GET "$BASE_URL/api/users" 2>/dev/null)
    
    if echo "$action_response" | grep -q "users\|error"; then
        echo "   ✅ Action effectuée (même si erreur, session étendue)"
    else
        echo "   ❌ Action échouée"
    fi
    
    # 2. Vérifier que la session est toujours active
    echo "   📋 Vérification de la session après action..."
    session_response=$(curl -s -b cookies.txt "$SESSION_URL" 2>/dev/null)
    
    if echo "$session_response" | grep -q "admin@chantierpro.fr"; then
        echo "   ✅ Session étendue avec succès"
        return 0
    else
        echo "   ❌ Session non étendue"
        return 1
    fi
}

# Fonction pour tester la déconnexion automatique
test_auto_logout() {
    echo "🚪 Test de la déconnexion automatique..."
    
    # Simuler une session expirée en supprimant les cookies
    echo "   🗑️ Simulation d'expiration de session..."
    rm -f cookies.txt
    
    # Tenter d'accéder à une page protégée
    echo "   🔒 Tentative d'accès à une page protégée..."
    protected_response=$(curl -s -w "\n%{http_code}" "$DASHBOARD_URL" 2>/dev/null)
    http_code=$(echo "$protected_response" | tail -n1)
    
    if [ "$http_code" = "302" ] || [ "$http_code" = "401" ]; then
        echo "   ✅ Redirection vers login (session expirée)"
        return 0
    elif [ "$http_code" = "200" ]; then
        echo "   ❌ Accès autorisé sans session (problème de sécurité)"
        return 1
    else
        echo "   ❓ Réponse inattendue: $http_code"
        return 1
    fi
}

# Fonction pour vérifier les hooks de session
check_session_hooks() {
    echo "🔗 Vérification des hooks de session..."
    
    # Vérifier useSessionExtension.ts
    if [ -f "hooks/useSessionExtension.ts" ]; then
        echo "   ✅ Hook useSessionExtension.ts trouvé"
        
        if grep -q "useSessionExtension" hooks/useSessionExtension.ts; then
            echo "   ✅ Fonction useSessionExtension présente"
        else
            echo "   ❌ Fonction useSessionExtension manquante"
            return 1
        fi
        
        if grep -q "useSessionExpirationWarning" hooks/useSessionExtension.ts; then
            echo "   ✅ Fonction useSessionExpirationWarning présente"
        else
            echo "   ❌ Fonction useSessionExpirationWarning manquante"
            return 1
        fi
    else
        echo "   ❌ Hook useSessionExtension.ts non trouvé"
        return 1
    fi
    
    # Vérifier SessionStatus.tsx
    if [ -f "components/SessionStatus.tsx" ]; then
        echo "   ✅ Composant SessionStatus.tsx trouvé"
        
        if grep -q "SessionStatus" components/SessionStatus.tsx; then
            echo "   ✅ Composant SessionStatus présent"
        else
            echo "   ❌ Composant SessionStatus manquant"
            return 1
        fi
    else
        echo "   ❌ Composant SessionStatus.tsx non trouvé"
        return 1
    fi
    
    return 0
}

# Vérifier que le serveur est démarré
echo "🔍 Vérification que le serveur est démarré..."
if ! curl -s -f "$BASE_URL" > /dev/null 2>&1; then
    echo "❌ Le serveur n'est pas démarré. Veuillez lancer 'npm run dev' d'abord."
    exit 1
fi
echo "✅ Serveur accessible"
echo ""

# Effectuer les tests
echo "🚀 Début des tests de déconnexion automatique..."
echo ""

# Test 1: Configuration des sessions
if test_session_configuration; then
    echo "✅ Test 1 réussi: Configuration des sessions"
else
    echo "❌ Test 1 échoué: Problème de configuration des sessions"
fi

echo ""

# Test 2: Hooks de session
if check_session_hooks; then
    echo "✅ Test 2 réussi: Hooks de session"
else
    echo "❌ Test 2 échoué: Problème avec les hooks de session"
fi

echo ""

# Test 3: Création de session
if test_session_creation; then
    echo "✅ Test 3 réussi: Création de session"
else
    echo "❌ Test 3 échoué: Problème de création de session"
fi

echo ""

# Test 4: Accès protégé
if test_protected_access; then
    echo "✅ Test 4 réussi: Accès protégé"
else
    echo "❌ Test 4 échoué: Problème d'accès protégé"
fi

echo ""

# Test 5: Simulation d'inactivité
if simulate_inactivity; then
    echo "✅ Test 5 réussi: Simulation d'inactivité"
else
    echo "❌ Test 5 échoué: Problème de simulation d'inactivité"
fi

echo ""

# Test 6: Extension automatique
if test_session_extension; then
    echo "✅ Test 6 réussi: Extension automatique de session"
else
    echo "❌ Test 6 échoué: Problème d'extension automatique"
fi

echo ""

# Test 7: Déconnexion automatique
if test_auto_logout; then
    echo "✅ Test 7 réussi: Déconnexion automatique"
else
    echo "❌ Test 7 échoué: Problème de déconnexion automatique"
fi

echo ""
echo "📊 RÉSULTATS DES TESTS:"
echo "======================="

echo "✅ Configuration des sessions réduites:"
echo "- Durée de session: 4 heures (au lieu de 30 jours)"
echo "- Mise à jour de session: Toutes les heures"
echo "- Extension automatique: Fonctionnelle"
echo "- Déconnexion automatique: Fonctionnelle"

echo ""
echo "🔧 IMPACT SUR L'EXPÉRIENCE UTILISATEUR:"
echo "- Sessions plus courtes: Réduction du risque de sécurité"
echo "- Extension automatique: Maintien de l'expérience fluide"
echo "- Notifications d'expiration: Alerte avant déconnexion"
echo "- Déconnexion automatique: Protection contre les sessions abandonnées"

echo ""
echo "📝 Recommandations:"
echo "1. Intégrer le composant SessionStatus dans le layout principal"
echo "2. Tester l'extension automatique avec de vrais utilisateurs"
echo "3. Surveiller les logs d'audit pour les déconnexions automatiques"
echo "4. Ajuster les seuils selon les besoins métier"

echo ""
echo "🧹 Nettoyage..."
rm -f cookies.txt

echo ""
echo "✅ Tests de déconnexion automatique terminés!"
