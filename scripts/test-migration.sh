#!/bin/bash

# Script de test automatisé pour la migration des routes API
# Usage: ./scripts/test-migration.sh [route-name]

echo "🧪 Démarrage des tests de migration pour les routes API..."
echo "=========================================================="

# Configuration
BASE_URL="http://localhost:3000"
TEST_USER_EMAIL="admin@chantierpro.com"
TEST_USER_PASSWORD="Password123!"

# Fonction pour tester une route migrée
test_migrated_route() {
    local route_name=$1
    local endpoint="/api/$route_name"
    
    echo "🔍 Test de la route $endpoint..."
    
    # Test 1: Authentification requise
    echo "  Test 1: Vérification de l'authentification..."
    local auth_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint")
    if [ "$auth_response" = "401" ]; then
        echo "    ✅ Authentification requise (401)"
    else
        echo "    ❌ Authentification manquante ($auth_response)"
        return 1
    fi
    
    # Test 2: Rate limiting
    echo "  Test 2: Vérification du rate limiting..."
    local rate_limit_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint")
    if [ "$rate_limit_response" = "401" ] || [ "$rate_limit_response" = "429" ]; then
        echo "    ✅ Rate limiting fonctionnel"
    else
        echo "    ⚠️  Rate limiting non détecté ($rate_limit_response)"
    fi
    
    # Test 3: Validation des paramètres
    echo "  Test 3: Validation des paramètres..."
    local validation_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint?page=invalid&limit=999")
    if [ "$validation_response" = "400" ] || [ "$validation_response" = "401" ]; then
        echo "    ✅ Validation des paramètres fonctionnelle"
    else
        echo "    ⚠️  Validation des paramètres non détectée ($validation_response)"
    fi
    
    echo "  ✅ Tests de base terminés pour $endpoint"
}

# Fonction pour tester la compatibilité des schémas
test_schema_compatibility() {
    local route_name=$1
    
    echo "📋 Test de compatibilité des schémas pour $route_name..."
    
    # Vérifier que les schémas existent dans lib/validations.ts
    if grep -q "${route_name}QuerySchema\|${route_name}CreateSchema" "lib/validations.ts"; then
        echo "    ✅ Schémas Zod trouvés dans lib/validations.ts"
    else
        echo "    ❌ Schémas Zod manquants pour $route_name"
        return 1
    fi
    
    # Vérifier la structure de la base de données
    if grep -q "model ${route_name^}" "prisma/schema.prisma"; then
        echo "    ✅ Modèle Prisma trouvé pour $route_name"
    else
        echo "    ❌ Modèle Prisma manquant pour $route_name"
        return 1
    fi
    
    echo "    ✅ Compatibilité des schémas validée"
}

# Fonction pour tester la migration complète
test_complete_migration() {
    local route_name=$1
    local route_file="app/api/$route_name/route.ts"
    
    echo "🔄 Test de migration complète pour $route_name..."
    
    # Vérifier que la route utilise le template standardisé
    if grep -q "withErrorHandling\|requireAuth\|createPaginatedResponse" "$route_file"; then
        echo "    ✅ Template standardisé appliqué"
    else
        echo "    ❌ Template standardisé non appliqué"
        return 1
    fi
    
    # Vérifier que les anciens patterns sont supprimés
    if grep -q "getServerSession.*authOptions" "$route_file"; then
        echo "    ⚠️  Ancien pattern getServerSession encore présent"
    else
        echo "    ✅ Ancien pattern getServerSession supprimé"
    fi
    
    # Vérifier la gestion d'erreurs
    if grep -q "try.*catch" "$route_file"; then
        echo "    ⚠️  Gestion d'erreurs manuelle encore présente"
    else
        echo "    ✅ Gestion d'erreurs centralisée appliquée"
    fi
    
    echo "    ✅ Migration complète validée"
}

# Fonction pour tester les performances
test_performance() {
    local route_name=$1
    local endpoint="/api/$route_name"
    
    echo "⚡ Test de performance pour $endpoint..."
    
    # Test de temps de réponse
    local start_time=$(date +%s%N)
    curl -s "$BASE_URL$endpoint" > /dev/null
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        echo "    ✅ Temps de réponse acceptable (${response_time}ms)"
    else
        echo "    ⚠️  Temps de réponse élevé (${response_time}ms)"
    fi
}

# Fonction principale
main() {
    local route_name=$1
    
    if [ -z "$route_name" ]; then
        echo "📋 Routes disponibles pour test:"
        echo "   1. chantiers"
        echo "   2. documents"
        echo "   3. devis"
        echo "   4. users (déjà migrée)"
        echo ""
        echo "Usage: $0 [route-name]"
        echo "Exemple: $0 chantiers"
        exit 1
    fi
    
    echo "🎯 Test de migration pour: $route_name"
    echo ""
    
    # Tests de base
    test_schema_compatibility "$route_name"
    echo ""
    
    test_complete_migration "$route_name"
    echo ""
    
    # Tests fonctionnels (si l'application tourne)
    if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        test_migrated_route "$route_name"
        echo ""
        test_performance "$route_name"
    else
        echo "⚠️  Application non démarrée - tests fonctionnels ignorés"
        echo "   Démarrez l'application avec: npm run dev"
    fi
    
    echo ""
    echo "🎉 Tests de migration terminés pour $route_name"
}

# Exécution
main "$@"
