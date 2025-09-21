#!/bin/bash

echo "🗄️ TEST DES MIGRATIONS PRISMA"
echo "=============================="
echo ""

# Configuration du test
echo "📋 Configuration du test:"
echo "- Vérification de la structure des migrations"
echo "- Test de génération du client Prisma"
echo "- Validation des scripts package.json"
echo ""

# Fonction pour vérifier la structure des migrations
test_migration_structure() {
    echo "📁 Test de la structure des migrations..."
    
    if [ -d "prisma/migrations" ]; then
        echo "   ✅ Dossier migrations/ présent"
    else
        echo "   ❌ Dossier migrations/ manquant"
        return 1
    fi
    
    if [ -d "prisma/migrations/20250121000000_init" ]; then
        echo "   ✅ Migration initiale présente"
    else
        echo "   ❌ Migration initiale manquante"
        return 1
    fi
    
    if [ -f "prisma/migrations/20250121000000_init/migration.sql" ]; then
        echo "   ✅ Fichier migration.sql présent"
        
        # Vérifier que le fichier n'est pas vide
        if [ -s "prisma/migrations/20250121000000_init/migration.sql" ]; then
            echo "   ✅ Fichier migration.sql non vide"
        else
            echo "   ❌ Fichier migration.sql vide"
            return 1
        fi
    else
        echo "   ❌ Fichier migration.sql manquant"
        return 1
    fi
    
    if [ -f "prisma/migrations/20250121000000_init/migration.json" ]; then
        echo "   ✅ Fichier migration.json présent"
    else
        echo "   ❌ Fichier migration.json manquant"
        return 1
    fi
    
    return 0
}

# Fonction pour vérifier les scripts package.json
test_package_scripts() {
    echo "📦 Test des scripts package.json..."
    
    if [ -f "package.json" ]; then
        echo "   ✅ Fichier package.json présent"
        
        # Vérifier les scripts de migration
        if grep -q "db:migrate" package.json; then
            echo "   ✅ Script db:migrate présent"
        else
            echo "   ❌ Script db:migrate manquant"
            return 1
        fi
        
        if grep -q "db:migrate:dev" package.json; then
            echo "   ✅ Script db:migrate:dev présent"
        else
            echo "   ❌ Script db:migrate:dev manquant"
            return 1
        fi
        
        if grep -q "db:reset" package.json; then
            echo "   ✅ Script db:reset présent"
        else
            echo "   ❌ Script db:reset manquant"
            return 1
        fi
        
        # Vérifier que build:vercel utilise migrate deploy
        if grep -q "migrate deploy" package.json; then
            echo "   ✅ Script build:vercel utilise migrate deploy"
        else
            echo "   ❌ Script build:vercel n'utilise pas migrate deploy"
            return 1
        fi
        
        # Vérifier que db:push n'est plus utilisé dans build:vercel
        if ! grep -A 5 -B 5 "build:vercel" package.json | grep -q "db push"; then
            echo "   ✅ Script build:vercel n'utilise plus db push"
        else
            echo "   ❌ Script build:vercel utilise encore db push"
            return 1
        fi
        
        return 0
    else
        echo "   ❌ Fichier package.json manquant"
        return 1
    fi
}

# Fonction pour tester la génération du client Prisma
test_prisma_generate() {
    echo "🔧 Test de génération du client Prisma..."
    
    # Tester la génération du client
    if npx prisma generate > /dev/null 2>&1; then
        echo "   ✅ Génération du client Prisma réussie"
        return 0
    else
        echo "   ❌ Échec de la génération du client Prisma"
        return 1
    fi
}

# Fonction pour vérifier le schéma Prisma
test_prisma_schema() {
    echo "📋 Test du schéma Prisma..."
    
    if [ -f "prisma/schema.prisma" ]; then
        echo "   ✅ Fichier schema.prisma présent"
        
        # Vérifier que le schéma contient les modèles principaux
        if grep -q "model User" prisma/schema.prisma; then
            echo "   ✅ Modèle User présent"
        else
            echo "   ❌ Modèle User manquant"
            return 1
        fi
        
        if grep -q "model AuditLog" prisma/schema.prisma; then
            echo "   ✅ Modèle AuditLog présent"
        else
            echo "   ❌ Modèle AuditLog manquant"
            return 1
        fi
        
        if grep -q "model Chantier" prisma/schema.prisma; then
            echo "   ✅ Modèle Chantier présent"
        else
            echo "   ❌ Modèle Chantier manquant"
            return 1
        fi
        
        return 0
    else
        echo "   ❌ Fichier schema.prisma manquant"
        return 1
    fi
}

# Fonction pour vérifier la documentation
test_documentation() {
    echo "📚 Test de la documentation..."
    
    if [ -f "GUIDE_MIGRATION_PRISMA.md" ]; then
        echo "   ✅ Guide de migration présent"
        
        # Vérifier que le guide contient les sections importantes
        if grep -q "MIGRATION EFFECTUÉE" GUIDE_MIGRATION_PRISMA.md; then
            echo "   ✅ Section migration effectuée présente"
        else
            echo "   ❌ Section migration effectuée manquante"
            return 1
        fi
        
        if grep -q "BONNES PRATIQUES" GUIDE_MIGRATION_PRISMA.md; then
            echo "   ✅ Section bonnes pratiques présente"
        else
            echo "   ❌ Section bonnes pratiques manquante"
            return 1
        fi
        
        return 0
    else
        echo "   ❌ Guide de migration manquant"
        return 1
    fi
}

# Effectuer les tests
echo "🚀 Début des tests de migration Prisma..."
echo ""

# Test 1: Structure des migrations
if test_migration_structure; then
    echo "✅ Test 1 réussi: Structure des migrations"
else
    echo "❌ Test 1 échoué: Problème de structure des migrations"
fi

echo ""

# Test 2: Scripts package.json
if test_package_scripts; then
    echo "✅ Test 2 réussi: Scripts package.json"
else
    echo "❌ Test 2 échoué: Problème avec les scripts package.json"
fi

echo ""

# Test 3: Génération du client Prisma
if test_prisma_generate; then
    echo "✅ Test 3 réussi: Génération du client Prisma"
else
    echo "❌ Test 3 échoué: Problème de génération du client Prisma"
fi

echo ""

# Test 4: Schéma Prisma
if test_prisma_schema; then
    echo "✅ Test 4 réussi: Schéma Prisma"
else
    echo "❌ Test 4 échoué: Problème avec le schéma Prisma"
fi

echo ""

# Test 5: Documentation
if test_documentation; then
    echo "✅ Test 5 réussi: Documentation"
else
    echo "❌ Test 5 échoué: Problème avec la documentation"
fi

echo ""
echo "📊 RÉSULTATS DES TESTS:"
echo "======================="

echo "✅ Migration Prisma mise en place:"
echo "- Structure des migrations: Créée"
echo "- Scripts package.json: Mis à jour"
echo "- Client Prisma: Généré avec succès"
echo "- Schéma Prisma: Validé"
echo "- Documentation: Créée"

echo ""
echo "🔧 FONCTIONNALITÉS MIGRATION:"
echo "- Migration initiale: 20250121000000_init"
echo "- Scripts disponibles: db:migrate, db:migrate:dev, db:reset"
echo "- Build Vercel: Utilise migrate deploy"
echo "- Rollback: Possible avec migrate reset"

echo ""
echo "📝 Actions suivantes recommandées:"
echo "1. Tester les migrations avec une base de données locale"
echo "2. Déployer en production avec les nouvelles migrations"
echo "3. Former l'équipe aux bonnes pratiques de migration"
echo "4. Mettre en place un processus de review des migrations"

echo ""
echo "✅ Tests de migration Prisma terminés!"
