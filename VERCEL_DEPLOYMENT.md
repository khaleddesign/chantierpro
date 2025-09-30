# 🚀 Configuration Vercel - ChantierPro

## ⚠️ IMPORTANT : Variables d'environnement CRITIQUES

### 1. NEXTAUTH_URL (CRITIQUE)
**OBLIGATOIRE** : Cette variable doit pointer vers votre URL de production Vercel.

```bash
# ❌ INCORRECT (cause les erreurs 401)
NEXTAUTH_URL="http://localhost:3000"

# ✅ CORRECT pour production
NEXTAUTH_URL="https://chantierpro-38o8.vercel.app"
```

**Impact si incorrecte** :
- ❌ Erreurs 401 sur toutes les requêtes API
- ❌ `session.user.id` = undefined
- ❌ Cookies NextAuth invalides
- ❌ Authentification non fonctionnelle

### 2. NEXTAUTH_SECRET
Générez une clé secrète sécurisée :
```bash
openssl rand -base64 32
```

### 3. DATABASE_URL
Utilisez la connexion poolée Supabase pour Vercel :
```bash
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1&pool_timeout=20&schema=public"
```

## 📋 Checklist de déploiement

- [ ] Configurer `NEXTAUTH_URL` avec l'URL Vercel de production
- [ ] Vérifier que `NEXTAUTH_SECRET` est défini
- [ ] Vérifier `DATABASE_URL` pointe vers Supabase pooler
- [ ] Définir `NODE_ENV=production`
- [ ] Vérifier `REDIS_DISABLED=true` (si pas de Redis sur Vercel)
- [ ] Tester l'authentification après déploiement

## 🔍 Diagnostic des erreurs d'authentification

### Symptômes : 401 sur /api/chantiers
1. Vérifier NEXTAUTH_URL dans Vercel Dashboard
2. Vérifier les logs serveur : `userId: undefined` indique un problème de session
3. Tester la connexion avec les DevTools Network tab

### Symptômes : 401 sur /manifest.json
- ✅ **CORRIGÉ** : middleware.ts ligne 93-95 exclut maintenant /manifest.json, /sw.js et /api/auth

## 🏗️ Architecture d'authentification

```
Client → NextAuth → getServerSession() → session.user.id
                                            ↓
                                      API Routes
                                            ↓
                                    requireAuth(['ADMIN'])
```

### Flux de session
1. **Connexion** : `CredentialsProvider` → `authorize()`
2. **JWT** : callback `jwt()` ajoute `user.id` au token
3. **Session** : callback `session()` expose `token.id` comme `session.user.id`
4. **API** : `requireAuth()` vérifie `session?.user?.id`

## 🔧 Configuration minimale Vercel

Variables d'environnement requises dans Vercel Dashboard :

```env
NEXTAUTH_URL=https://chantierpro-38o8.vercel.app
NEXTAUTH_SECRET=<votre_secret_généré>
DATABASE_URL=<supabase_pooler_url>
NODE_ENV=production
```

## 📚 Références
- NextAuth.js Configuration : https://next-auth.js.org/configuration/options
- Vercel Environment Variables : https://vercel.com/docs/environment-variables