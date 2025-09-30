# 🔍 Diagnostic : Pourquoi /api/devis fonctionne mais pas /api/chantiers ?

## 📊 COMPARAISON ARCHITECTURE

### ✅ `/api/devis/route.ts` (FONCTIONNE)

**Structure** :
```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Logique métier...
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Caractéristiques** :
- ✅ Pas de wrapper `withErrorHandling`
- ✅ Pas de fonction `requireAuth()`
- ✅ Vérification simple : `!session`
- ✅ Gestion d'erreur manuelle avec try/catch
- ✅ Retour JSON direct

---

### ❌ `/api/chantiers/route.ts` (NE FONCTIONNE PAS)

**Structure** :
```typescript
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'COMMERCIAL', 'CLIENT'], request);

  if (!checkRateLimit(`chantiers:${session.user.id}`, 200, 15 * 60 * 1000)) {
    throw new APIError('Trop de requêtes', 429);
  }

  // Logique métier...
});
```

**Caractéristiques** :
- ❌ Utilise `withErrorHandling` wrapper
- ❌ Utilise `requireAuth()` qui vérifie `!session?.user?.id`
- ❌ Utilise `checkRateLimit()`
- ❌ Utilise `validateAndSanitize()`
- ❌ Plus complexe, plus de points de défaillance

---

## 🎯 DIFFÉRENCES CLÉS IDENTIFIÉES

### 1. **Vérification de session**

| Aspect | Devis | Chantiers |
|--------|-------|-----------|
| Méthode | `!session` | `!session?.user?.id` |
| Strict | Non | Oui (vérifie user.id) |
| Problème | Accepte session vide | Rejette si user.id manquant |

**Hypothèse** : `session.user.id` est `undefined` sur Vercel à cause de la configuration des cookies.

### 2. **Gestion d'erreurs**

| Aspect | Devis | Chantiers |
|--------|-------|-----------|
| Wrapper | Aucun | `withErrorHandling` |
| Logging | Manuel | Automatique via `secureLogger` |
| Format erreur | Simple JSON | `APIError` class |

### 3. **Rate limiting**

| Aspect | Devis | Chantiers |
|--------|-------|-----------|
| Active | Non | Oui (200 req/15min) |
| Stockage | N/A | Map en mémoire |
| Problème | N/A | Peut bloquer en serverless |

### 4. **Validation des paramètres**

| Aspect | Devis | Chantiers |
|--------|-------|-----------|
| Validation | Manuelle | `validateAndSanitize(ChantiersQuerySchema)` |
| Sanitization | Non | Oui |
| Complexité | Faible | Élevée |

---

## 🔧 SOLUTIONS POSSIBLES

### Option 1 : Simplifier l'API chantiers (RECOMMANDÉ)
Aligner `/api/chantiers` sur `/api/devis` :
```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Logique métier identique à devis...
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Option 2 : Corriger `requireAuth()`
Modifier la vérification pour être moins stricte :
```typescript
export async function requireAuth(allowedRoles?: UserRole[], request?: NextRequest) {
  const session = await getServerSession(authOptions);

  // Vérification moins stricte (comme devis)
  if (!session?.user) {
    throw new APIError('Authentication requise', 401);
  }

  return session;
}
```

### Option 3 : Débuguer `session.user.id` sur Vercel
Ajouter des logs pour comprendre pourquoi `user.id` est undefined :
```typescript
console.log('Session complète:', JSON.stringify(session, null, 2));
```

---

## 📋 TEST ENDPOINT CRÉÉ

**URL** : `/api/test-db`

**Tests effectués** :
1. ✅ Variables d'environnement (DATABASE_URL, NEXTAUTH_SECRET, etc.)
2. ✅ Cookies NextAuth (présence, format)
3. ✅ Session NextAuth (structure, user.id)
4. ✅ Connexion Prisma/Supabase
5. ✅ Requête chantiers avec filtrage par rôle

**Utilisation** :
```bash
# Sans authentification
curl https://chantierpro-38o8.vercel.app/api/test-db

# Avec authentification (dans le navigateur après connexion)
https://chantierpro-38o8.vercel.app/api/test-db
```

---

## 🚀 PROCHAINES ÉTAPES

1. **Tester l'endpoint** `/api/test-db` sur Vercel
2. **Analyser les résultats** pour identifier le test qui échoue
3. **Appliquer la solution** en fonction du diagnostic :
   - Si `session.user.id` est undefined → Corriger callbacks NextAuth
   - Si cookies absents → Corriger configuration cookies
   - Si connexion DB échoue → Vérifier DATABASE_URL
4. **Simplifier l'API chantiers** en s'inspirant de l'API devis (qui fonctionne)

---

## 💡 RECOMMANDATION FINALE

La complexité ajoutée par `withErrorHandling`, `requireAuth()`, `validateAndSanitize()` et `checkRateLimit()` introduit des points de défaillance. **L'API devis fonctionne car elle est simple.**

**Action recommandée** : Créer une version simplifiée de `/api/chantiers` sans les wrappers pour valider que le problème vient bien de là.