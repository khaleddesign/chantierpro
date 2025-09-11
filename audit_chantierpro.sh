#!/bin/bash

# Script d'audit pour les projets ChantierPro
# Usage: ./audit_chantierpro.sh

echo "🏗️  AUDIT STRUCTURE PROJETS CHANTIERPRO"
echo "======================================"

# Fonction pour compter les fichiers par type
count_files() {
    local dir=$1
    local pattern=$2
    local desc=$3
    local count=$(find "$dir" -name "$pattern" -type f 2>/dev/null | wc -l | tr -d ' ')
    printf "%-30s: %s\n" "$desc" "$count"
}

# Fonction pour lister les pages
list_pages() {
    local dir=$1
    echo "Pages trouvées dans $dir:"
    find "$dir/app" -name "page.tsx" -type f 2>/dev/null | sed 's|.*/app/||' | sed 's|/page.tsx||' | sort | sed 's/^/  - /'
    echo ""
}

# Fonction pour lister les APIs
list_apis() {
    local dir=$1
    echo "APIs trouvées dans $dir:"
    find "$dir/app/api" -name "route.ts" -type f 2>/dev/null | sed 's|.*/app/api/||' | sed 's|/route.ts||' | sort | sed 's/^/  - /'
    echo ""
}

# Fonction pour lister les hooks
list_hooks() {
    local dir=$1
    echo "Hooks trouvés dans $dir:"
    find "$dir/hooks" -name "*.ts" -type f 2>/dev/null | sed 's|.*/||' | sort | sed 's/^/  - /'
    echo ""
}

# Vérifier les projets
CHANTIERPRO="chantierpro"
ANCIEN="ancien"

echo ""
echo "📁 STRUCTURE GÉNÉRALE"
echo "===================="

for project in "$CHANTIERPRO" "$ANCIEN"; do
    if [ -d "$project" ]; then
        echo ""
        echo "🔍 PROJET: $project/"
        echo "$(echo $project | tr a-z A-Z | sed 's/./-/g')"
        
        # Comptage des fichiers
        count_files "$project" "*.tsx" "Pages React (.tsx)"
        count_files "$project" "*.ts" "Fichiers TypeScript (.ts)"
        count_files "$project/components" "*.tsx" "Composants"
        count_files "$project/hooks" "*.ts" "Hooks personnalisés"
        count_files "$project/app/api" "route.ts" "Routes API"
        count_files "$project/app" "page.tsx" "Pages Next.js"
        
        echo ""
    else
        echo "❌ Projet $project/ non trouvé"
    fi
done

echo ""
echo "📄 DÉTAIL DES PAGES"
echo "=================="

for project in "$CHANTIERPRO" "$ANCIEN"; do
    if [ -d "$project" ]; then
        echo ""
        list_pages "$project"
    fi
done

echo "🔌 DÉTAIL DES APIS"
echo "================="

for project in "$CHANTIERPRO" "$ANCIEN"; do
    if [ -d "$project" ]; then
        echo ""
        list_apis "$project"
    fi
done

echo "🎣 DÉTAIL DES HOOKS"
echo "=================="

for project in "$CHANTIERPRO" "$ANCIEN"; do
    if [ -d "$project" ]; then
        echo ""
        list_hooks "$project"
    fi
done

echo ""
echo ""
echo "🔍 COMPARAISON DÉTAILLÉE"
echo "======================="

echo ""
echo "🚨 PROBLÈMES POTENTIELS À VÉRIFIER"
echo "================================="

# Vérifier des patterns de problèmes courants
echo ""
echo "Design System (vérifier manuellement):"
echo "  📄 /dashboard/planning/nouveau - Design cohérent ?"
echo "  📄 /dashboard/users - Erreurs présentes ?"
echo "  📄 /dashboard/devis - Erreurs signalées ?"
echo "  📄 CRM - Page existante ?"

echo ""
echo "Boutons à tester:"
echo "  🔘 Nouveau message (Messages)"
echo "  🔘 Upload document (Documents)" 
echo "  🔘 Créer chantier (Chantiers)"
echo "  🔘 Générer PDF (Devis)"
echo "  🔘 Actions CRUD (Users, Admin)"

echo ""
echo "🎯 RECOMMANDATIONS"
echo "=================="
echo "1. Tester chaque page manuellement"
echo "2. Vérifier les erreurs console navigateur"
echo "3. S'assurer que tous les boutons réagissent"
echo "4. Uniformiser le design system"
echo "5. Corriger les erreurs TypeScript restantes"

echo ""
echo "✅ AUDIT TERMINÉ"
echo "==============="
echo "Legende:"
echo "  + = Fichier présent uniquement dans 'ancien'"
echo "  - = Fichier présent uniquement dans 'chantierpro'"
echo ""
echo "💡 Conseil: Les fichiers marqués '+' sont peut-être à copier vers chantierpro"