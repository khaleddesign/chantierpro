#!/bin/bash

# Script d'audit universel pour ChantierPro
# Usage: 
#   ./audit.sh                    (analyse le projet courant)
#   ./audit.sh [projet1]          (analyse un projet spécifique)  
#   ./audit.sh [projet1] [projet2] (compare deux projets)

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_section() {
    echo ""
    echo "========================================="
    echo "$1"
    echo "========================================="
}

# Fonction d'analyse complète d'un projet
analyze_single_project() {
    local project_path=${1:-.}
    local project_name=${2:-"PROJET COURANT"}
    
    echo "=================================================================="
    echo "           AUDIT COMPLET - $project_name"
    echo "=================================================================="
    echo "Chemin: $project_path"
    echo "Date: $(date)"
    echo "=================================================================="
    
    cd "$project_path" || {
        echo "Erreur: Impossible d'accéder au projet $project_path"
        exit 1
    }
    
    # Variables de score
    local total_score=0
    local max_score=0
    local errors=0
    local warnings=0
    
    print_section "1. ENVIRONNEMENT ET DÉPENDANCES"
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js installé : $NODE_VERSION" 0
    else
        print_status "Node.js non installé" 1
        errors=$((errors + 1))
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm installé : $NPM_VERSION" 0
    else
        print_status "npm non installé" 1
        errors=$((errors + 1))
    fi
    
    # package.json
    if [ -f "package.json" ]; then
        print_status "package.json trouvé" 0
        total_score=$((total_score + 5))
        
        # Analyse des dépendances critiques
        print_info "Dépendances critiques:"
        CRITICAL_DEPS=("react" "next" "@prisma/client" "prisma" "next-auth" "typescript")
        for dep in "${CRITICAL_DEPS[@]}"; do
            if grep -q "\"$dep\"" package.json; then
                VERSION=$(grep "\"$dep\"" package.json | sed 's/.*: *"\([^"]*\)".*/\1/')
                echo "  ✅ $dep: $VERSION"
                total_score=$((total_score + 2))
            else
                echo "  ❌ $dep manquant"
                warnings=$((warnings + 1))
            fi
        done
    else
        print_status "package.json manquant" 1
        errors=$((errors + 1))
    fi
    max_score=$((max_score + 17))
    
    # node_modules
    if [ -d "node_modules" ]; then
        NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
        print_status "node_modules présent ($NODE_MODULES_SIZE)" 0
        total_score=$((total_score + 3))
    else
        print_status "node_modules manquant - Exécuter npm install" 1
        warnings=$((warnings + 1))
    fi
    max_score=$((max_score + 3))
    
    print_section "2. STRUCTURE DU PROJET"
    
    # Fichiers de configuration essentiels
    CONFIG_FILES=(
        "next.config.js:5"
        "tsconfig.json:4" 
        "tailwind.config.ts:3"
        "prisma/schema.prisma:5"
        ".env.example:2"
        "middleware.ts:3"
        "lib/auth.ts:2"
    )
    
    local config_score=0
    for config in "${CONFIG_FILES[@]}"; do
        file=$(echo $config | cut -d':' -f1)
        points=$(echo $config | cut -d':' -f2)
        
        if [ -f "$file" ]; then
            print_status "$file" 0
            config_score=$((config_score + points))
        else
            print_status "$file manquant" 1
            warnings=$((warnings + 1))
        fi
        max_score=$((max_score + points))
    done
    total_score=$((total_score + config_score))
    
    # Dossiers essentiels
    ESSENTIAL_DIRS=("app:5" "components:4" "lib:3" "types:2" "public:2")
    for dir_info in "${ESSENTIAL_DIRS[@]}"; do
        dir=$(echo $dir_info | cut -d':' -f1)
        points=$(echo $dir_info | cut -d':' -f2)
        
        if [ -d "$dir" ]; then
            FILE_COUNT=$(find "$dir" -type f | wc -l)
            print_status "$dir ($FILE_COUNT fichiers)" 0
            total_score=$((total_score + points))
        else
            print_status "$dir manquant" 1
            warnings=$((warnings + 1))
        fi
        max_score=$((max_score + points))
    done
    
    print_section "3. ANALYSE DU CODE"
    
    # Comptage des fichiers
    if [ -d "app" ] || [ -d "pages" ]; then
        TSX_COUNT=$(find . -name "*.tsx" -not -path "./node_modules/*" | wc -l)
        TS_COUNT=$(find . -name "*.ts" -not -path "./node_modules/*" -not -name "*.tsx" | wc -l)
        JS_COUNT=$(find . -name "*.js" -not -path "./node_modules/*" | wc -l)
        TOTAL_FILES=$((TSX_COUNT + TS_COUNT + JS_COUNT))
        
        echo "Fichiers TypeScript (.ts): $TS_COUNT"
        echo "Fichiers React (.tsx): $TSX_COUNT"  
        echo "Fichiers JavaScript (.js): $JS_COUNT"
        echo "Total: $TOTAL_FILES fichiers"
        
        # Score basé sur le ratio TypeScript
        if [ $TOTAL_FILES -gt 0 ]; then
            TS_RATIO=$(( ((TS_COUNT + TSX_COUNT) * 100) / TOTAL_FILES ))
            if [ $TS_RATIO -gt 90 ]; then
                print_status "Excellent ratio TypeScript ($TS_RATIO%)" 0
                total_score=$((total_score + 10))
            elif [ $TS_RATIO -gt 70 ]; then
                print_status "Bon ratio TypeScript ($TS_RATIO%)" 0  
                total_score=$((total_score + 7))
            else
                print_warning "Ratio TypeScript faible ($TS_RATIO%)"
                total_score=$((total_score + 3))
            fi
        fi
        max_score=$((max_score + 10))
    fi
    
    # Test TypeScript
    if [ -f "tsconfig.json" ] && command -v npx &> /dev/null; then
        print_info "Test de compilation TypeScript..."
        TS_ERRORS=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS" || echo 0)
        
        if [ $TS_ERRORS -eq 0 ]; then
            print_status "Compilation TypeScript OK" 0
            total_score=$((total_score + 15))
        elif [ $TS_ERRORS -lt 10 ]; then
            print_warning "Quelques erreurs TypeScript ($TS_ERRORS)"
            total_score=$((total_score + 10))
        elif [ $TS_ERRORS -lt 50 ]; then
            print_warning "Erreurs TypeScript modérées ($TS_ERRORS)"
            total_score=$((total_score + 5))
        else
            print_status "Nombreuses erreurs TypeScript ($TS_ERRORS)" 1
            errors=$((errors + 1))
        fi
        max_score=$((max_score + 15))
    fi
    
    print_section "4. BASE DE DONNÉES ET PRISMA"
    
    if [ -f "prisma/schema.prisma" ]; then
        print_status "Schéma Prisma trouvé" 0
        total_score=$((total_score + 5))
        
        # Modèles Prisma
        MODELS=$(grep -c "^model " prisma/schema.prisma 2>/dev/null || echo 0)
        echo "Modèles Prisma définis: $MODELS"
        
        if [ $MODELS -gt 15 ]; then
            total_score=$((total_score + 10))
        elif [ $MODELS -gt 10 ]; then
            total_score=$((total_score + 7))
        elif [ $MODELS -gt 5 ]; then
            total_score=$((total_score + 5))
        fi
        max_score=$((max_score + 10))
        
        # Client Prisma généré
        if [ -d "node_modules/.prisma" ]; then
            print_status "Client Prisma généré" 0
            total_score=$((total_score + 5))
        else
            print_status "Client Prisma non généré" 1
            warnings=$((warnings + 1))
        fi
        max_score=$((max_score + 5))
        
        # Relations
        RELATIONS=$(grep -c "@relation" prisma/schema.prisma 2>/dev/null || echo 0)
        echo "Relations définies: $RELATIONS"
        if [ $RELATIONS -gt 10 ]; then
            total_score=$((total_score + 5))
        elif [ $RELATIONS -gt 5 ]; then
            total_score=$((total_score + 3))
        fi
        max_score=$((max_score + 5))
        
    else
        print_status "Schéma Prisma manquant" 1
        errors=$((errors + 1))
        max_score=$((max_score + 25))
    fi
    
    print_section "5. FONCTIONNALITÉS ET API"
    
    # Routes API
    if [ -d "app/api" ]; then
        API_ROUTES=$(find app/api -name "route.ts" | wc -l)
        echo "Routes API: $API_ROUTES"
        
        if [ $API_ROUTES -gt 15 ]; then
            total_score=$((total_score + 10))
        elif [ $API_ROUTES -gt 10 ]; then
            total_score=$((total_score + 7))
        elif [ $API_ROUTES -gt 5 ]; then
            total_score=$((total_score + 5))
        fi
        max_score=$((max_score + 10))
    fi
    
    # Pages
    if [ -d "app" ]; then
        PAGES=$(find app -name "page.tsx" | wc -l)
        echo "Pages: $PAGES"
        
        if [ $PAGES -gt 15 ]; then
            total_score=$((total_score + 8))
        elif [ $PAGES -gt 10 ]; then
            total_score=$((total_score + 6))
        elif [ $PAGES -gt 5 ]; then
            total_score=$((total_score + 4))
        fi
        max_score=$((max_score + 8))
    fi
    
    # Authentification
    if grep -r "NextAuth\|next-auth" . --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
        print_status "Système d'authentification détecté" 0
        total_score=$((total_score + 5))
    else
        print_warning "Pas d'authentification détectée"
    fi
    max_score=$((max_score + 5))
    
    print_section "6. PERFORMANCE ET SÉCURITÉ"
    
    # Configuration Next.js
    if [ -f "next.config.js" ]; then
        if grep -q "compress\|images\|webpack" next.config.js; then
            print_status "Optimisations Next.js configurées" 0
            total_score=$((total_score + 3))
        fi
        max_score=$((max_score + 3))
    fi
    
    # Variables d'environnement
    if [ -f ".env.example" ]; then
        print_status "Template .env.example présent" 0
        total_score=$((total_score + 2))
    else
        print_warning "Fichier .env.example manquant"
    fi
    max_score=$((max_score + 2))
    
    # Validation des données
    if grep -r "zod\|yup\|joi" package.json >/dev/null 2>&1; then
        print_status "Validation des données configurée" 0
        total_score=$((total_score + 3))
    fi
    max_score=$((max_score + 3))
    
    print_section "7. RÉSUMÉ ET RECOMMANDATIONS"
    
    local percentage=$(( (total_score * 100) / max_score ))
    
    echo ""
    echo "📊 SCORES:"
    echo "============"
    echo "Score total: $total_score/$max_score ($percentage%)"
    echo "Erreurs critiques: $errors"
    echo "Avertissements: $warnings"
    
    echo ""
    echo "🎯 ÉVALUATION:"
    echo "=============="
    if [ $percentage -ge 90 ]; then
        echo -e "${GREEN}🏆 EXCELLENT (90-100%)${NC}"
        echo "Projet très mature et bien structuré"
    elif [ $percentage -ge 80 ]; then
        echo -e "${GREEN}✅ TRÈS BON (80-89%)${NC}"
        echo "Quelques optimisations mineures possibles"
    elif [ $percentage -ge 70 ]; then
        echo -e "${YELLOW}👍 BON (70-79%)${NC}"
        echo "Solide avec des améliorations possibles"
    elif [ $percentage -ge 60 ]; then
        echo -e "${YELLOW}⚠️  ACCEPTABLE (60-69%)${NC}"
        echo "Nécessite du travail d'amélioration"
    else
        echo -e "${RED}🚨 PROBLÉMATIQUE (<60%)${NC}"
        echo "Corrections majeures requises"
    fi
    
    echo ""
    echo "📋 ACTIONS RECOMMANDÉES:"
    echo "========================"
    
    if [ $errors -gt 0 ]; then
        echo "🔴 URGENT:"
        [ ! -f "package.json" ] && echo "  - Créer/réparer package.json"
        [ ! -d "node_modules" ] && echo "  - Installer les dépendances: npm install"
        [ $TS_ERRORS -gt 50 ] && echo "  - Corriger les erreurs TypeScript critiques"
    fi
    
    if [ $warnings -gt 0 ]; then
        echo "🟡 IMPORTANT:"
        [ ! -f "tailwind.config.ts" ] && echo "  - Créer tailwind.config.ts"
        [ ! -d "node_modules/.prisma" ] && echo "  - Générer le client Prisma: npx prisma generate"
        [ ! -f ".env.example" ] && echo "  - Créer template .env.example"
    fi
    
    echo "🔵 OPTIMISATIONS:"
    echo "  - Améliorer la couverture TypeScript"
    echo "  - Ajouter des tests automatisés"
    echo "  - Optimiser les performances"
    echo "  - Renforcer la sécurité"
    
    cd - >/dev/null
    
    # Retourner les scores pour comparaison
    echo "$total_score:$max_score:$percentage:$errors:$warnings:$TS_ERRORS:$MODELS:$API_ROUTES:$PAGES"
}

# Fonction de comparaison entre deux projets
compare_projects() {
    local project1_path="$1"
    local project2_path="$2"
    
    echo "=================================================================="
    echo "           AUDIT COMPARATIF - CHANTIERPRO"
    echo "=================================================================="
    echo "Projet 1: $project1_path"
    echo "Projet 2: $project2_path"
    echo "=================================================================="
    
    # Vérification des chemins
    if [ ! -d "$project1_path" ]; then
        echo "Erreur: Le chemin '$project1_path' n'existe pas"
        exit 1
    fi
    
    if [ ! -d "$project2_path" ]; then
        echo "Erreur: Le chemin '$project2_path' n'existe pas"
        exit 1
    fi
    
    # Analyse des deux projets
    echo -e "${BLUE}Analyse du Projet 1...${NC}"
    RESULT1=$(analyze_single_project "$project1_path" "PROJET 1")
    STATS1=$(echo "$RESULT1" | tail -1)
    
    echo ""
    echo -e "${BLUE}Analyse du Projet 2...${NC}"
    RESULT2=$(analyze_single_project "$project2_path" "PROJET 2")
    STATS2=$(echo "$RESULT2" | tail -1)
    
    # Extraction des statistiques
    P1_SCORE=$(echo $STATS1 | cut -d':' -f1)
    P1_MAX=$(echo $STATS1 | cut -d':' -f2)
    P1_PERCENT=$(echo $STATS1 | cut -d':' -f3)
    P1_ERRORS=$(echo $STATS1 | cut -d':' -f4)
    P1_TS_ERRORS=$(echo $STATS1 | cut -d':' -f6)
    
    P2_SCORE=$(echo $STATS2 | cut -d':' -f1)
    P2_MAX=$(echo $STATS2 | cut -d':' -f2)
    P2_PERCENT=$(echo $STATS2 | cut -d':' -f3)
    P2_ERRORS=$(echo $STATS2 | cut -d':' -f4)
    P2_TS_ERRORS=$(echo $STATS2 | cut -d':' -f6)
    
    echo ""
    echo "=================================================================="
    echo "                    COMPARAISON FINALE"
    echo "=================================================================="
    
    echo ""
    echo "📊 SCORES DÉTAILLÉS:"
    echo "==================="
    printf "%-15s | %-15s | %-15s\n" "Critère" "Projet 1" "Projet 2"
    echo "----------------|----------------|----------------"
    printf "%-15s | %-15s | %-15s\n" "Score total" "$P1_SCORE/$P1_MAX" "$P2_SCORE/$P2_MAX"
    printf "%-15s | %-15s | %-15s\n" "Pourcentage" "$P1_PERCENT%" "$P2_PERCENT%"
    printf "%-15s | %-15s | %-15s\n" "Erreurs" "$P1_ERRORS" "$P2_ERRORS"
    printf "%-15s | %-15s | %-15s\n" "Erreurs TS" "$P1_TS_ERRORS" "$P2_TS_ERRORS"
    
    echo ""
    echo "🏆 RÉSULTAT:"
    echo "============"
    
    if [ $P1_SCORE -gt $P2_SCORE ]; then
        echo -e "${GREEN}🥇 GAGNANT: PROJET 1${NC}"
        echo -e "${BLUE}📍 Chemin recommandé: $project1_path${NC}"
        WINNER="PROJET 1"
    elif [ $P2_SCORE -gt $P1_SCORE ]; then
        echo -e "${GREEN}🥇 GAGNANT: PROJET 2${NC}"
        echo -e "${BLUE}📍 Chemin recommandé: $project2_path${NC}"
        WINNER="PROJET 2"
    else
        echo -e "${YELLOW}🤝 ÉGALITÉ - Analyse approfondie nécessaire${NC}"
        WINNER="ÉGALITÉ"
    fi
    
    echo ""
    echo "🎯 RECOMMANDATION POUR L'ÉQUIPE:"
    echo "================================="
    echo "👥 Claude + Gemini + Manus"
    
    if [ "$WINNER" != "ÉGALITÉ" ]; then
        echo "✅ Continuer le développement avec le $WINNER"
        echo "📦 Migrer les bonnes fonctionnalités de l'autre projet si nécessaire"
    else
        echo "⚖️  Analyse manuelle recommandée pour départager"
        echo "🔍 Examiner les spécificités métier et fonctionnelles"
    fi
    
    echo ""
    echo "📅 PROCHAINES ÉTAPES:"
    echo "===================="
    echo "1. 🤖 Partager ces résultats avec Gemini et Manus"
    echo "2. 💬 Discussion collective sur les points techniques"
    echo "3. ✅ Validation finale du choix de projet"
    echo "4. 🚀 Établissement du plan de travail collaboratif"
}

# MAIN - Logique principale
case $# in
    0)
        # Aucun argument - analyse le projet courant
        analyze_single_project "." "PROJET COURANT"
        ;;
    1)
        # Un argument - analyse le projet spécifié
        analyze_single_project "$1" "PROJET"
        ;;
    2)
        # Deux arguments - comparaison
        compare_projects "$1" "$2"
        ;;
    *)
        echo "Usage:"
        echo "  $0                    # Analyse le projet courant"
        echo "  $0 [projet]           # Analyse un projet spécifique"
        echo "  $0 [projet1] [projet2] # Compare deux projets"
        exit 1
        ;;
esac