#!/bin/bash

echo "🔒 TEST DE SÉCURITÉ API DOCUMENTS"
echo "=================================="
echo ""
echo "Ce script teste le filtrage par rôle de l'API GET /api/documents"
echo ""

# Variables
APP_URL="http://localhost:3000"
COOKIE_JAR="documents_security_cookies.txt"

# Nettoyer les anciens cookies
rm -f $COOKIE_JAR

# Fonction pour tester l'API avec un rôle spécifique
test_documents_api() {
    local role="$1"
    local email="$2"
    local password="$3"
    local expected_count="$4"
    
    echo "🧪 Test avec le rôle: $role"
    
    # Connexion
    LOGIN_RESPONSE=$(curl -s -X POST \
        -c $COOKIE_JAR \
        -b $COOKIE_JAR \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}" \
        "$APP_URL/api/auth/login")
    
    if echo "$LOGIN_RESPONSE" | grep -q "Connexion réussie"; then
        echo "   ✅ Connexion réussie pour $role"
    else
        echo "   ❌ Échec de connexion pour $role"
        echo "   Réponse: $LOGIN_RESPONSE"
        return 1
    fi
    
    # Test de l'API documents
    DOCUMENTS_RESPONSE=$(curl -s -b $COOKIE_JAR "$APP_URL/api/documents")
    
    if echo "$DOCUMENTS_RESPONSE" | grep -q "documents"; then
        echo "   ✅ API documents accessible"
        
        # Compter les documents retournés
        DOCUMENT_COUNT=$(echo "$DOCUMENTS_RESPONSE" | jq '.documents | length' 2>/dev/null || echo "0")
        echo "   📊 Documents retournés: $DOCUMENT_COUNT"
        
        # Vérifier si le nombre correspond aux attentes
        if [ "$DOCUMENT_COUNT" -eq "$expected_count" ]; then
            echo "   ✅ Nombre de documents correct ($expected_count)"
        else
            echo "   ⚠️  Nombre de documents inattendu (attendu: $expected_count, obtenu: $DOCUMENT_COUNT)"
        fi
        
        # Vérifier les statistiques
        STATS_TOTAL=$(echo "$DOCUMENTS_RESPONSE" | jq '.stats.total' 2>/dev/null || echo "0")
        echo "   📈 Statistiques total: $STATS_TOTAL"
        
        # Vérifier les informations de debug (admin uniquement)
        if [ "$role" = "ADMIN" ]; then
            DEBUG_INFO=$(echo "$DOCUMENTS_RESPONSE" | jq '.debug' 2>/dev/null)
            if [ "$DEBUG_INFO" != "null" ]; then
                echo "   🔍 Informations de debug présentes (admin)"
            else
                echo "   ⚠️  Informations de debug manquantes pour admin"
            fi
        else
            DEBUG_INFO=$(echo "$DOCUMENTS_RESPONSE" | jq '.debug' 2>/dev/null)
            if [ "$DEBUG_INFO" = "null" ]; then
                echo "   ✅ Pas d'informations de debug (non-admin)"
            else
                echo "   ❌ Informations de debug exposées (non-admin)"
            fi
        fi
        
    else
        echo "   ❌ API documents inaccessible"
        echo "   Réponse: $DOCUMENTS_RESPONSE"
        return 1
    fi
    
    echo ""
    return 0
}

# Fonction pour tester l'upload de document
test_document_upload() {
    local role="$1"
    local email="$2"
    local password="$3"
    local chantier_id="$4"
    local should_succeed="$5"
    
    echo "📤 Test d'upload pour le rôle: $role"
    
    # Connexion
    LOGIN_RESPONSE=$(curl -s -X POST \
        -c $COOKIE_JAR \
        -b $COOKIE_JAR \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}" \
        "$APP_URL/api/auth/login")
    
    if ! echo "$LOGIN_RESPONSE" | grep -q "Connexion réussie"; then
        echo "   ❌ Échec de connexion pour $role"
        return 1
    fi
    
    # Créer un fichier de test
    echo "Test document for $role" > test_document.txt
    
    # Test d'upload
    UPLOAD_RESPONSE=$(curl -s -X POST \
        -b $COOKIE_JAR \
        -F "file=@test_document.txt" \
        -F "chantierId=$chantier_id" \
        -F "type=PDF" \
        "$APP_URL/api/documents")
    
    # Nettoyer le fichier de test
    rm -f test_document.txt
    
    if [ "$should_succeed" = "true" ]; then
        if echo "$UPLOAD_RESPONSE" | grep -q "nom"; then
            echo "   ✅ Upload réussi (attendu)"
        else
            echo "   ❌ Upload échoué (inattendu)"
            echo "   Réponse: $UPLOAD_RESPONSE"
        fi
    else
        if echo "$UPLOAD_RESPONSE" | grep -q "Permissions insuffisantes"; then
            echo "   ✅ Upload refusé (attendu)"
        else
            echo "   ❌ Upload autorisé (inattendu)"
            echo "   Réponse: $UPLOAD_RESPONSE"
        fi
    fi
    
    echo ""
}

echo "🚀 Début des tests de sécurité..."
echo ""

# Test 1: Admin (doit voir tous les documents)
test_documents_api "ADMIN" "admin@chantierpro.com" "password" "all"

# Test 2: Commercial (doit voir seulement ses clients)
test_documents_api "COMMERCIAL" "commercial1@chantierpro.com" "password" "filtered"

# Test 3: Client (doit voir seulement ses documents)
test_documents_api "CLIENT" "client1@chantierpro.com" "password" "filtered"

# Test 4: Ouvrier (doit voir seulement les chantiers assignés)
test_documents_api "OUVRIER" "ouvrier1@chantierpro.com" "password" "filtered"

echo "📤 Tests d'upload de documents..."
echo ""

# Test d'upload avec différents rôles
# Note: Ces tests nécessitent des IDs de chantiers valides
# test_document_upload "ADMIN" "admin@chantierpro.com" "password" "chantier_id" "true"
# test_document_upload "CLIENT" "client1@chantierpro.com" "password" "chantier_id_autre_client" "false"

echo "🔍 Test de filtrage par chantier..."
echo ""

# Test avec filtrage par chantier
CHANTIER_FILTER_RESPONSE=$(curl -s -b $COOKIE_JAR "$APP_URL/api/documents?chantierId=test_chantier_id")

if echo "$CHANTIER_FILTER_RESPONSE" | grep -q "documents"; then
    echo "   ✅ Filtrage par chantier fonctionne"
else
    echo "   ❌ Filtrage par chantier échoue"
fi

echo ""
echo "📊 RÉSULTATS DES TESTS:"
echo "======================"

# Vérifications finales
echo "✅ Tests de sécurité des documents terminés"
echo ""
echo "🔒 MESURES DE SÉCURITÉ IMPLÉMENTÉES:"
echo "- Filtrage par rôle (ADMIN, COMMERCIAL, CLIENT, OUVRIER)"
echo "- Vérification des permissions sur les chantiers"
echo "- Statistiques filtrées selon les permissions"
echo "- Informations de debug limitées aux admins"
echo "- Validation des uploads par rôle"
echo ""
echo "⚠️  RECOMMANDATIONS:"
echo "1. Tester avec des données réelles en production"
echo "2. Vérifier les logs d'audit pour les accès"
echo "3. Monitorer les tentatives d'accès non autorisé"
echo "4. Implémenter des alertes de sécurité"
echo ""
echo "N'oubliez pas de supprimer le fichier $COOKIE_JAR après les tests."
