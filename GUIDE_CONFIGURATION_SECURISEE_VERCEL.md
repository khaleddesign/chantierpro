# 🔒 GUIDE DE CONFIGURATION SÉCURISÉE - VERCEL

## ⚠️ **ATTENTION CRITIQUE**
**Les secrets ont été supprimés du code source pour des raisons de sécurité.**

## 📋 **VARIABLES D'ENVIRONNEMENT À CONFIGURER DANS VERCEL**

### **1. Accéder au Dashboard Vercel**
1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet `chantierpro`
3. Aller dans **Settings** → **Environment Variables**

### **2. Variables à configurer**

#### **🔐 Variables sensibles (OBLIGATOIRES)**
```bash
# ⚠️ ATTENTION: Ces valeurs sont temporaires et doivent être régénérées après configuration
NEXTAUTH_SECRET=<secret-temporaire-à-régénérer>
DATABASE_URL=<url-base-de-données-temporaire>
POSTGRES_PRISMA_URL=<url-pooled-temporaire>
POSTGRES_URL_NON_POOLING=<url-direct-temporaire>
SUPABASE_URL=<url-supabase-temporaire>
SUPABASE_ANON_KEY=<clé-anonyme-temporaire>
```

**📧 Contactez l'administrateur pour obtenir les valeurs temporaires de configuration.**

#### **🌐 Variables publiques (DÉJÀ CONFIGURÉES)**
```bash
NEXTAUTH_URL=https://chantierpro-g39ldrxhs-khaleddesigns-projects.vercel.app
REDIS_DISABLED=true
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=ChantierPro
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### **3. Instructions de configuration**

#### **Pour chaque variable :**
1. Cliquer sur **"Add New"**
2. **Name** : Nom de la variable (ex: `NEXTAUTH_SECRET`)
3. **Value** : Valeur de la variable (copier depuis ce guide)
4. **Environment** : Sélectionner **Production** (et **Preview** si nécessaire)
5. Cliquer sur **"Save"**

#### **Ordre de configuration recommandé :**
1. `NEXTAUTH_SECRET`
2. `DATABASE_URL`
3. `POSTGRES_PRISMA_URL`
4. `POSTGRES_URL_NON_POOLING`
5. `SUPABASE_URL`
6. `SUPABASE_ANON_KEY`

### **4. Vérification**

#### **Après configuration :**
1. Aller dans **Deployments**
2. Déclencher un nouveau déploiement
3. Vérifier que l'application se connecte correctement

#### **Tests de validation :**
```bash
# Test de connexion à la base de données
curl https://chantierpro-g39ldrxhs-khaleddesigns-projects.vercel.app/api/health

# Test d'authentification
curl -X POST https://chantierpro-g39ldrxhs-khaleddesigns-projects.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chantierpro.fr","password":"admin123"}'
```

## 🛡️ **BONNES PRATIQUES DE SÉCURITÉ**

### **✅ À FAIRE**
- ✅ Configurer les secrets dans Vercel Dashboard uniquement
- ✅ Utiliser des secrets différents pour chaque environnement
- ✅ Régénérer les secrets régulièrement
- ✅ Limiter l'accès au Dashboard Vercel

### **❌ À ÉVITER**
- ❌ Ne jamais commiter des secrets dans le code
- ❌ Ne jamais partager les secrets par email/chat
- ❌ Ne jamais utiliser les mêmes secrets en dev/prod
- ❌ Ne jamais laisser les secrets dans les logs

## 🚨 **EN CAS DE PROBLÈME**

### **Si l'application ne démarre pas :**
1. Vérifier que toutes les variables sont configurées
2. Vérifier l'orthographe des noms de variables
3. Vérifier que les valeurs sont correctes
4. Consulter les logs de déploiement Vercel

### **Si la base de données ne se connecte pas :**
1. Vérifier que `DATABASE_URL` est correcte
2. Vérifier que `POSTGRES_PRISMA_URL` est configurée
3. Vérifier que `POSTGRES_URL_NON_POOLING` est configurée
4. Tester la connexion depuis Supabase Dashboard

## 📞 **SUPPORT**

En cas de problème, consulter :
- [Documentation Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation NextAuth](https://next-auth.js.org/configuration/options)

---

**⚠️ IMPORTANT : Ce guide contient des secrets temporaires. Après configuration, ces secrets doivent être régénérés pour des raisons de sécurité.**
