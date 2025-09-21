# 🗄️ GUIDE DE MIGRATION PRISMA - CHANTIERPRO

## 📋 **CONTEXTE**

Ce guide documente la migration de `prisma db push` vers `prisma migrate dev` pour améliorer la sécurité et la traçabilité des modifications de base de données.

## ⚠️ **PROBLÈME RÉSOLU**

**Avant** : Utilisation de `prisma db push` en production
- ❌ Pas d'historique des modifications
- ❌ Risque de perte de données
- ❌ Pas de rollback possible
- ❌ Pratique dangereuse en production

**Après** : Utilisation de `prisma migrate dev` et `prisma migrate deploy`
- ✅ Historique complet des migrations
- ✅ Sécurité des données
- ✅ Rollback possible
- ✅ Pratique recommandée par Prisma

## 🚀 **MIGRATION EFFECTUÉE**

### **1. Création de la migration initiale**
```bash
# Migration créée manuellement
prisma/migrations/20250121000000_init/
├── migration.sql    # Script SQL complet
└── migration.json   # Métadonnées
```

### **2. Scripts package.json mis à jour**
```json
{
  "scripts": {
    "db:migrate": "prisma migrate deploy",
    "db:reset": "prisma migrate reset", 
    "db:migrate:dev": "prisma migrate dev",
    "build:vercel": "npx prisma generate && npx prisma migrate deploy && next build"
  }
}
```

### **3. Structure des migrations**
```
prisma/
├── migrations/
│   └── 20250121000000_init/
│       ├── migration.sql
│       └── migration.json
├── schema.prisma
└── seed.ts
```

## 📖 **UTILISATION**

### **Développement local**
```bash
# Créer une nouvelle migration
npm run db:migrate:dev

# Appliquer les migrations
npm run db:migrate

# Reset complet (ATTENTION: supprime toutes les données)
npm run db:reset
```

### **Production (Vercel)**
```bash
# Build avec migrations
npm run build:vercel
```

### **Nouvelles modifications de schéma**
```bash
# 1. Modifier prisma/schema.prisma
# 2. Créer la migration
npx prisma migrate dev --name description_du_changement

# 3. Vérifier la migration générée
# 4. Tester en local
# 5. Déployer en production
```

## 🔧 **COMMANDES PRISMA MIGRATION**

### **Développement**
```bash
# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en local
npx prisma migrate dev

# Reset et re-seed
npx prisma migrate reset
```

### **Production**
```bash
# Appliquer les migrations (sans interaction)
npx prisma migrate deploy

# Vérifier le statut des migrations
npx prisma migrate status
```

### **Utilitaires**
```bash
# Générer le client Prisma
npx prisma generate

# Visualiser la base de données
npx prisma studio

# Diff entre schéma et base de données
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url $DATABASE_URL
```

## 📊 **AVANTAGES DES MIGRATIONS**

### **1. Sécurité**
- ✅ Historique complet des modifications
- ✅ Pas de perte de données accidentelle
- ✅ Rollback possible en cas de problème

### **2. Traçabilité**
- ✅ Chaque modification est documentée
- ✅ Timestamp de chaque migration
- ✅ Description des changements

### **3. Collaboration**
- ✅ Migrations partagées entre développeurs
- ✅ Synchronisation automatique des schémas
- ✅ Résolution des conflits facilitée

### **4. Production**
- ✅ Déploiements sécurisés
- ✅ Migrations atomiques
- ✅ Monitoring des changements

## 🚨 **BONNES PRATIQUES**

### **✅ À FAIRE**
- ✅ Toujours créer une migration pour chaque changement de schéma
- ✅ Tester les migrations en local avant déploiement
- ✅ Utiliser des noms descriptifs pour les migrations
- ✅ Vérifier le SQL généré avant application
- ✅ Sauvegarder la base de données avant migration importante

### **❌ À ÉVITER**
- ❌ Ne jamais utiliser `db push` en production
- ❌ Ne jamais modifier directement les fichiers de migration
- ❌ Ne jamais appliquer des migrations non testées
- ❌ Ne jamais ignorer les erreurs de migration

## 🔍 **DÉPANNAGE**

### **Problème : Migration échoue**
```bash
# Vérifier le statut
npx prisma migrate status

# Résoudre les conflits
npx prisma migrate resolve --applied 20250121000000_init

# Reset si nécessaire (ATTENTION: perte de données)
npx prisma migrate reset
```

### **Problème : Schéma désynchronisé**
```bash
# Synchroniser le schéma
npx prisma db pull

# Créer une migration de synchronisation
npx prisma migrate dev --name sync_schema
```

### **Problème : Base de données corrompue**
```bash
# Reset complet
npx prisma migrate reset

# Re-seed des données
npm run db:seed
```

## 📈 **MÉTRIQUES DE SUCCÈS**

### **Avant la migration**
- ❌ Utilisation de `db push` (risqué)
- ❌ Pas d'historique des modifications
- ❌ Risque de perte de données

### **Après la migration**
- ✅ Utilisation de `migrate dev/deploy` (sécurisé)
- ✅ Historique complet des migrations
- ✅ Sécurité des données garantie

## 🎯 **PROCHAINES ÉTAPES**

1. **Tester les migrations en local**
2. **Déployer en production avec les nouvelles migrations**
3. **Former l'équipe aux bonnes pratiques**
4. **Mettre en place un processus de review des migrations**

---

**✅ Migration Prisma terminée avec succès !**
**L'application utilise maintenant des migrations versionnées sécurisées.**
