#!/bin/bash

# ========================================
# SCRIPT D'AUDIT COMPLET CHANTIERPRO
# Vérifie la refactorisation et l'état du projet
# ========================================

set -e # Arrêter le script en cas d'erreur

# Couleurs pour les outputs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Variables de contrôle
ERRORS=0
WARNINGS=0
SUCCESS=0

# ========================================
# 1. VÉRIFICATION DE L'ENVIRONNEMENT
# ========================================

print_header "1. VÉRIFICATION DE L'ENVIRONNEMENT"

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installé : $NODE_VERSION"
    ((SUCCESS++))
else
    print_error "Node.js non trouvé"
    ((ERRORS++))
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installé : $NPM_VERSION"
    ((SUCCESS++))
else
    print_error "npm non trouvé"
    ((ERRORS++))
fi

# Vérifier si on est dans le bon répertoire
if [ -f "package.json" ]; then
    print_success "Fichier package.json trouvé"
    ((SUCCESS++))
else
    print_error "Fichier package.json non trouvé - Êtes-vous dans le bon répertoire ?"
    ((ERRORS++))
    exit 1
fi

# ========================================
# 2. VÉRIFICATION DES DÉPENDANCES
# ========================================

print_header "2. VÉRIFICATION DES DÉPENDANCES"

# Vérifier React version
REACT_VERSION=$(node -e "console.log(require('./package.json').dependencies.react)" 2>/dev/null || echo "non trouvé")
if [[ $REACT_VERSION == ^18* ]]; then
    print_success "React version correcte : $REACT_VERSION"
    ((SUCCESS++))
else
    print_error "React version incorrecte : $REACT_VERSION (attendu: ^18.x.x)"
    ((ERRORS++))
fi

# Vérifier Next.js version
NEXT_VERSION=$(node -e "console.log(require('./package.json').dependencies.next)" 2>/dev/null || echo "non trouvé")
if [[ $NEXT_VERSION == ^15* ]]; then
    print_success "Next.js version correcte : $NEXT_VERSION"
    ((SUCCESS++))
else
    print_warning "Next.js version : $NEXT_VERSION"
    ((WARNINGS++))
fi

# Vérifier next-auth
NEXTAUTH_VERSION=$(node -e "console.log(require('./package.json').dependencies['next-auth'])" 2>/dev/null || echo "non trouvé")
if [[ $NEXTAUTH_VERSION != "non trouvé" ]]; then
    print_success "next-auth présent : $NEXTAUTH_VERSION"
    ((SUCCESS++))
else
    print_error "next-auth non trouvé dans les dépendances"
    ((ERRORS++))
fi

# Vérifier node_modules
if [ -d "node_modules" ]; then
    print_success "node_modules présent"
    ((SUCCESS++))
else
    print_warning "node_modules absent - Exécution de npm install..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "npm install réussi"
        ((SUCCESS++))
    else
        print_error "npm install échoué"
        ((ERRORS++))
    fi
fi

# ========================================
# 3. VÉRIFICATION DE LA STRUCTURE
# ========================================

print_header "3. VÉRIFICATION DE LA STRUCTURE"

# Fichiers critiques
critical_files=(
    "app/layout.tsx"
    "components/providers/Providers.tsx"
    "lib/auth.ts"
    "middleware.ts"
    "next.config.js"
    "tsconfig.json"
    "tailwind.config.ts"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Fichier présent : $file"
        ((SUCCESS++))
    else
        print_error "Fichier manquant : $file"
        ((ERRORS++))
    fi
done

# Vérifier la structure des dossiers
critical_dirs=(
    "app"
    "components"
    "lib"
    "types"
    "public"
)

for dir in "${critical_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_success "Dossier présent : $dir"
        ((SUCCESS++))
    else
        print_error "Dossier manquant : $dir"
        ((ERRORS++))
    fi
done

# ========================================
# 4. ANALYSE DU CODE
# ========================================

print_header "4. ANALYSE DU CODE"

# Vérifier les imports/exports du Provider
if [ -f "components/providers/Providers.tsx" ]; then
    if grep -q "export default" "components/providers/Providers.tsx"; then
        print_info "Providers.tsx utilise export default"
        # Vérifier l'import correspondant
        if [ -f "app/layout.tsx" ] && grep -q "import Providers from" "app/layout.tsx"; then
            print_success "Import/Export Providers cohérents (default)"
            ((SUCCESS++))
        elif [ -f "app/layout.tsx" ] && grep -q "import { Providers }" "app/layout.tsx"; then
            print_error "Import/Export Providers incohérents - Export default mais import named"
            ((ERRORS++))
        fi
    elif grep -q "export function Providers\|export const Providers" "components/providers/Providers.tsx"; then
        print_info "Providers.tsx utilise export named"
        # Vérifier l'import correspondant
        if [ -f "app/layout.tsx" ] && grep -q "import { Providers }" "app/layout.tsx"; then
            print_success "Import/Export Providers cohérents (named)"
            ((SUCCESS++))
        elif [ -f "app/layout.tsx" ] && grep -q "import Providers from" "app/layout.tsx"; then
            print_error "Import/Export Providers incohérents - Export named mais import default"
            ((ERRORS++))
        fi
    fi
fi

# Vérifier la directive "use client" dans Providers
if [ -f "components/providers/Providers.tsx" ]; then
    if grep -q '"use client"' "components/providers/Providers.tsx"; then
        print_success "Providers.tsx contient 'use client'"
        ((SUCCESS++))
    else
        print_error "Providers.tsx manque la directive 'use client'"
        ((ERRORS++))
    fi
fi

# Vérifier next.config.js
if [ -f "next.config.js" ]; then
    if grep -q "ignoreBuildErrors.*false\|ignoreBuildErrors:.*false" "next.config.js"; then
        print_success "Configuration stricte TypeScript activée"
        ((SUCCESS++))
    else
        print_warning "Configuration TypeScript permissive détectée"
        ((WARNINGS++))
    fi
fi

# ========================================
# 5. TESTS DE BUILD
# ========================================

print_header "5. TESTS DE BUILD"

print_info "Lancement du build TypeScript..."

# Test TypeScript
if npx tsc --noEmit 2>/dev/null; then
    print_success "TypeScript compilation réussie"
    ((SUCCESS++))
else
    print_warning "Erreurs TypeScript détectées (voir détails ci-dessous)"
    npx tsc --noEmit
    ((WARNINGS++))
fi

# Test ESLint
print_info "Vérification ESLint..."
if npm run lint 2>/dev/null; then
    print_success "ESLint validation réussie"
    ((SUCCESS++))
else
    print_warning "Warnings ESLint détectés"
    ((WARNINGS++))
fi

# Test Build Next.js
print_info "Lancement du build Next.js..."
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "Build Next.js réussi"
    ((SUCCESS++))
    
    # Extraire les métriques du build
    if echo "$BUILD_OUTPUT" | grep -q "Route.*Size"; then
        print_info "Métriques du build :"
        echo "$BUILD_OUTPUT" | grep -A 20 "Route.*Size" | head -20
    fi
else
    print_error "Build Next.js échoué"
    echo "$BUILD_OUTPUT"
    ((ERRORS++))
fi

# ========================================
# 6. VÉRIFICATIONS DE SÉCURITÉ
# ========================================

print_header "6. VÉRIFICATIONS DE SÉCURITÉ"

# Audit npm
print_info "Audit de sécurité npm..."
AUDIT_OUTPUT=$(npm audit --audit-level=moderate 2>&1)
AUDIT_EXIT_CODE=$?

if [ $AUDIT_EXIT_CODE -eq 0 ]; then
    print_success "Aucune vulnérabilité critique détectée"
    ((SUCCESS++))
else
    print_warning "Vulnérabilités détectées :"
    echo "$AUDIT_OUTPUT" | head -20
    ((WARNINGS++))
fi

# Vérifier les fichiers sensibles
if [ -f ".env" ]; then
    print_warning "Fichier .env présent - Vérifiez qu'il n'est pas dans git"
    ((WARNINGS++))
fi

if [ -f ".env.local" ]; then
    print_warning "Fichier .env.local présent - Vérifiez qu'il n'est pas dans git"
    ((WARNINGS++))
fi

# Vérifier .gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".env" ".gitignore"; then
        print_success "Fichiers .env ignorés par git"
        ((SUCCESS++))
    else
        print_warning "Fichiers .env peuvent être trackés par git"
        ((WARNINGS++))
    fi
fi

# ========================================
# 7. TESTS FONCTIONNELS BASIQUES
# ========================================

print_header "7. TESTS FONCTIONNELS"

# Vérifier si les tests existent et les exécuter
if [ -f "package.json" ] && grep -q '"test"' "package.json"; then
    print_info "Exécution des tests..."
    if npm test 2>/dev/null; then
        print_success "Tests unitaires passés"
        ((SUCCESS++))
    else
        print_warning "Certains tests ont échoué"
        ((WARNINGS++))
    fi
else
    print_info "Pas de tests configurés"
fi

# Test de démarrage du serveur (rapide)
print_info "Test de démarrage du serveur de développement..."
timeout 30s npm run dev > /dev/null 2>&1 &
DEV_PID=$!
sleep 10

if kill -0 $DEV_PID 2>/dev/null; then
    print_success "Serveur de développement démarre correctement"
    kill $DEV_PID 2>/dev/null
    ((SUCCESS++))
else
    print_error "Échec du démarrage du serveur de développement"
    ((ERRORS++))
fi

# ========================================
# 8. RAPPORT FINAL
# ========================================

print_header "8. RAPPORT FINAL"

echo -e "\n${BLUE}📊 RÉSUMÉ DE L'AUDIT :${NC}"
echo -e "================================"
print_success "Succès : $SUCCESS"
print_warning "Avertissements : $WARNINGS"
print_error "Erreurs : $ERRORS"

echo -e "\n${BLUE}🎯 SCORE GLOBAL :${NC}"
TOTAL=$((SUCCESS + WARNINGS + ERRORS))
if [ $TOTAL -gt 0 ]; then
    SCORE=$((SUCCESS * 100 / TOTAL))
    echo -e "Score : $SCORE/100"
    
    if [ $SCORE -ge 80 ]; then
        print_success "EXCELLENT - Projet en excellente santé"
    elif [ $SCORE -ge 60 ]; then
        print_warning "BON - Quelques améliorations possibles"
    elif [ $SCORE -ge 40 ]; then
        print_warning "MOYEN - Corrections nécessaires"
    else
        print_error "CRITIQUE - Intervention urgente requise"
    fi
fi

echo -e "\n${BLUE}🔧 RECOMMANDATIONS :${NC}"
echo -e "================================"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}URGENT :${NC}"
    echo -e "- Corriger les erreurs critiques identifiées"
    echo -e "- Vérifier la cohérence des imports/exports"
    echo -e "- Résoudre les problèmes de build"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}RECOMMANDÉ :${NC}"
    echo -e "- Corriger les warnings ESLint/TypeScript"
    echo -e "- Mettre à jour les dépendances vulnérables"
    echo -e "- Améliorer la configuration de sécurité"
fi

echo -e "${GREEN}MAINTENANCE :${NC}"
echo -e "- Exécuter cet audit régulièrement"
echo -e "- Maintenir les dépendances à jour"
echo -e "- Surveiller les nouvelles vulnérabilités"

echo -e "\n${BLUE}📝 LOGS DÉTAILLÉS :${NC}"
echo -e "================================"
echo -e "Pour plus de détails, consultez :"
echo -e "- Build output ci-dessus"
echo -e "- npm audit pour les vulnérabilités"
echo -e "- npx tsc --noEmit pour TypeScript"

echo -e "\n${GREEN}✅ AUDIT TERMINÉ${NC}\n"

# Retourner le code d'erreur approprié
if [ $ERRORS -gt 0 ]; then
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    exit 2
else
    exit 0
fi
