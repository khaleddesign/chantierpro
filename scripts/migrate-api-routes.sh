#!/bin/bash

# Script de migration automatisé pour les routes API critiques
# Usage: ./scripts/migrate-api-routes.sh [route-name]

echo "🚀 Démarrage de la migration automatisée des routes API..."
echo "=========================================================="

# Configuration
ROUTES_DIR="app/api"
BACKUP_DIR="backups/api-routes"
TEMPLATE_FILE="templates/api-route-template.ts"

# Fonction pour créer un backup
create_backup() {
    local route_file=$1
    local backup_file="${BACKUP_DIR}/$(basename $route_file).backup.$(date +%Y%m%d_%H%M%S)"
    
    mkdir -p "$BACKUP_DIR"
    cp "$route_file" "$backup_file"
    echo "✅ Backup créé: $backup_file"
}

# Fonction pour migrer une route spécifique
migrate_route() {
    local route_name=$1
    local route_file="${ROUTES_DIR}/${route_name}/route.ts"
    
    if [ ! -f "$route_file" ]; then
        echo "❌ Route non trouvée: $route_file"
        return 1
    fi
    
    echo "🔄 Migration de $route_name..."
    
    # Créer un backup
    create_backup "$route_file"
    
    # Analyser la route existante
    echo "📊 Analyse de la route existante..."
    
    # Vérifier les dépendances spécialisées
    if grep -q "checkPermission\|logSecurityEvent\|GDPRDataController\|cache\.get" "$route_file"; then
        echo "⚠️  Route avec dépendances spécialisées détectée"
        echo "   Migration manuelle requise pour les fonctions spécialisées"
        return 2
    fi
    
    # Vérifier les schémas Zod existants
    if grep -q "Schema.*=.*z\.object" "$route_file"; then
        echo "✅ Schémas Zod existants détectés"
    else
        echo "⚠️  Aucun schéma Zod détecté - création requise"
    fi
    
    # Générer le template de migration
    generate_migration_template "$route_name" "$route_file"
    
    echo "✅ Migration de $route_name terminée"
}

# Fonction pour générer le template de migration
generate_migration_template() {
    local route_name=$1
    local route_file=$2
    
    echo "📝 Génération du template de migration pour $route_name..."
    
    # Extraire les méthodes HTTP utilisées
    local methods=$(grep -o "export async function [A-Z]*" "$route_file" | sed 's/export async function //' | tr '\n' ' ')
    
    echo "   Méthodes détectées: $methods"
    
    # Créer le fichier de migration
    local migration_file="${BACKUP_DIR}/${route_name}_migration_plan.md"
    
    cat > "$migration_file" << 'EOF'
# Plan de Migration pour ROUTE_NAME

## Route: ROUTE_FILE

### Méthodes HTTP détectées
METHODS

### Dépendances spécialisées
DEPENDENCIES

### Schémas Zod existants
SCHEMAS

### Actions requises
1. ✅ Backup créé
2. 🔄 Appliquer le template standardisé
3. 🔧 Adapter les dépendances spécialisées (si nécessaire)
4. 📋 Créer les schémas Zod manquants
5. 🧪 Tester la route migrée
6. 🚀 Déployer

### Template à appliquer
```typescript
// Force Node.js runtime pour les opérations de base de données
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from "next/server";
import { 
  withErrorHandling, 
  requireAuth, 
  createSuccessResponse,
  createPaginatedResponse,
  logUserAction,
  checkRateLimit,
  APIError
} from '@/lib/api-helpers';
import { validateAndSanitize } from '@/lib/validations/crm';
import { ROUTE_NAME_QuerySchema, ROUTE_NAME_CreateSchema } from '@/lib/validations';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// GET /api/ROUTE_NAME - Récupérer la liste
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'COMMERCIAL']);
  
  if (!checkRateLimit(`ROUTE_NAME:${session.user.id}`, 200, 15 * 60 * 1000)) {
    throw new APIError('Trop de requêtes, veuillez réessayer plus tard', 429);
  }

  const { searchParams } = new URL(request.url);
  
  const paramsValidation = validateAndSanitize(ROUTE_NAME_QuerySchema, {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    search: searchParams.get('search') || undefined
  });

  if (!paramsValidation.success) {
    throw new APIError(`Paramètres invalides: ${paramsValidation.errors?.join(', ')}`, 400);
  }

  const { page, limit, search } = paramsValidation.data!;
  const skip = (page - 1) * limit;

  // Logique métier spécifique à ROUTE_NAME
  const whereClause: any = {};
  if (search) {
    whereClause.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  const [data, total] = await Promise.all([
    prisma.ROUTE_NAME.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.ROUTE_NAME.count({ where: whereClause })
  ]);

  await logUserAction(
    session.user.id, 
    'GET_ROUTE_NAME', 
    'ROUTE_NAME', 
    undefined, 
    { search, page, limit },
    request
  );

  return createPaginatedResponse(data, total, page, limit, 'ROUTE_NAME récupérés avec succès');
});

// POST /api/ROUTE_NAME - Créer un nouvel élément
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'COMMERCIAL']);
  
  if (!checkRateLimit(`ROUTE_NAME:${session.user.id}`, 10, 15 * 60 * 1000)) {
    throw new APIError('Trop de créations, veuillez réessayer plus tard', 429);
  }

  const body = await request.json();
  
  const validation = validateAndSanitize(ROUTE_NAME_CreateSchema, body);
  if (!validation.success) {
    throw new APIError(`Données invalides: ${validation.errors?.join(', ')}`, 400);
  }

  const data = validation.data!;

  const newItem = await prisma.ROUTE_NAME.create({
    data: data
  });

  await logUserAction(
    session.user.id, 
    'CREATE_ROUTE_NAME', 
    'ROUTE_NAME', 
    newItem.id, 
    { nom: newItem.nom },
    request
  );

  return createSuccessResponse(newItem, 'ROUTE_NAME créé avec succès', 201);
});
```
EOF

    # Remplacer les placeholders
    sed -i "s/ROUTE_NAME/$route_name/g" "$migration_file"
    sed -i "s/ROUTE_FILE/$route_file/g" "$migration_file"
    sed -i "s/METHODS/$methods/g" "$migration_file"
    
    # Ajouter les dépendances spécialisées
    local dependencies=$(grep -n "import.*security\|import.*gdpr\|import.*cache" "$route_file" || echo "Aucune dépendance spécialisée")
    sed -i "s/DEPENDENCIES/$dependencies/g" "$migration_file"
    
    # Ajouter les schémas Zod existants
    local schemas=$(grep -n "Schema.*=.*z\.object" "$route_file" || echo "Aucun schéma Zod existant")
    sed -i "s/SCHEMAS/$schemas/g" "$migration_file"

    echo "📋 Plan de migration créé: $migration_file"
}

# Fonction principale
main() {
    local route_name=$1
    
    if [ -z "$route_name" ]; then
        echo "📋 Routes disponibles pour migration:"
        echo "   1. chantiers"
        echo "   2. documents" 
        echo "   3. devis"
        echo "   4. admin/security"
        echo "   5. admin/gdpr"
        echo ""
        echo "Usage: $0 [route-name]"
        echo "Exemple: $0 chantiers"
        exit 1
    fi
    
    migrate_route "$route_name"
    
    echo ""
    echo "🎉 Migration terminée pour $route_name"
    echo "📋 Consultez le plan de migration dans: ${BACKUP_DIR}/${route_name}_migration_plan.md"
}

# Exécution
main "$@"
