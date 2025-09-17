# 🐘 GUIDE MIGRATION POSTGRESQL - ChantierPro

## ✅ MIGRATION TERMINÉE

### 🔧 Modifications effectuées :

#### 1. **Schema Prisma** (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "postgresql"  // ✅ Changé de "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 2. **Scripts Package.json** (`package.json`)
```json
{
  "scripts": {
    "db:migrate": "prisma migrate deploy",      // ✅ Nouveau
    "db:reset": "prisma migrate reset",         // ✅ Nouveau  
    "db:migrate:dev": "prisma migrate dev",     // ✅ Nouveau
    "build:vercel": "npx prisma generate && npx prisma migrate deploy && next build"  // ✅ Mis à jour
  }
}
```

#### 3. **Fichiers nettoyés**
- ❌ `prisma/prisma/dev.db` (supprimé)
- ❌ `prisma/prisma/dev.db-journal` (supprimé)
- ❌ `tmp/` (supprimé)
- ✅ `.gitignore` mis à jour pour PostgreSQL

#### 4. **Configuration Vercel** (`vercel.json`)
```json
{
  "env": {
    "DATABASE_URL": "postgresql://postgres:[YOUR-PASSWORD]@db.oikxkloiqxhwwtkfpbkb.supabase.co:5432/postgres"
  }
}
```

## 🚀 ÉTAPES POUR DÉPLOIEMENT

### 1. **Récupérer l'URL Supabase**
Dans votre dashboard Supabase :
1. Allez dans **Settings** → **Database**
2. Copiez la **Connection String**
3. Remplacez `[YOUR-PASSWORD]` par votre mot de passe

### 2. **Variables d'environnement Vercel**
Ajouter dans les paramètres Vercel :
```
NEXTAUTH_SECRET=chantierpro-production-secret-key-2025-very-long-and-secure
NEXTAUTH_URL=https://chantierpro-g39ldrxhs-khaleddesigns-projects.vercel.app
DATABASE_URL=postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.oikxkloiqxhwwtkfpbkb.supabase.co:5432/postgres
REDIS_DISABLED=true
NODE_ENV=production
```

### 3. **Script de migration local** (optionnel)
```bash
# Définir l'URL Supabase
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.oikxkloiqxhwwtkfpbkb.supabase.co:5432/postgres"

# Exécuter la migration
./scripts/migrate-postgresql.sh
```

## 🎯 AVANTAGES POSTGRESQL

### ✅ **Persistance des données**
- Données sauvegardées définitivement
- Pas de perte lors des redémarrages Vercel

### ✅ **Performance**
- Requêtes optimisées
- Index avancés
- Concurrence améliorée

### ✅ **Fonctionnalités avancées**
- JSON natif
- Requêtes complexes
- Triggers et fonctions

## 🔧 COMMANDES UTILES

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# Reset complet (ATTENTION: supprime toutes les données)
npm run db:reset

# Migration en développement
npm run db:migrate:dev

# Build pour Vercel
npm run build:vercel
```

## ⚠️ IMPORTANT

1. **Sauvegardez vos données** avant la migration
2. **Testez localement** avec Supabase
3. **Vérifiez les permissions** dans Supabase
4. **Configurez les variables** dans Vercel

## 🎉 RÉSULTAT

Votre application ChantierPro est maintenant configurée pour :
- ✅ PostgreSQL Supabase
- ✅ Déploiement Vercel
- ✅ Données persistantes
- ✅ Performance optimisée
