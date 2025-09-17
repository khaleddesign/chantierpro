# 🚨 AUDIT SÉCURITÉ IMMÉDIAT - FAILLES DE PERMISSIONS CHANTIERPRO

## ⚠️ CRITICITÉ MAXIMALE - DONNÉES SENSIBLES EN JEU

**Date d'audit :** Janvier 2025  
**Auditeur :** Assistant IA Cursor  
**Statut :** URGENT - CORRECTIONS IMMÉDIATES REQUISES

---

## 🔥 FAILLES CRITIQUES IDENTIFIÉES

### 1. 🚨 FAILLE MAJEURE - Routes Devis (`/api/devis/`)

#### **Problème :** COMMERCIAL peut voir TOUS les devis
```typescript
// LIGNE 32-36 dans app/api/devis/route.ts
if (session.user.role === "COMMERCIAL") {
  where.client = {
    commercialId: session.user.id  // ❌ FAUSSE LOGIQUE
  };
}
```

**❌ FAUSSE SÉCURITÉ :** Un COMMERCIAL voit les devis de SES CLIENTS, pas les devis qu'IL a créés.

**💥 IMPACT :** 
- Commercial A peut voir les devis de Commercial B
- Accès aux données financières d'autres commerciaux
- Violation de la confidentialité commerciale

#### **Problème :** Paramètre `clientId` non sécurisé
```typescript
// LIGNE 55-57
if (clientId) {
  where.clientId = clientId;  // ❌ PAS DE VÉRIFICATION
}
```

**❌ FAUSSE SÉCURITÉ :** Un COMMERCIAL peut forcer `?clientId=autre-client-id` pour voir les devis d'autres clients.

### 2. 🚨 FAILLE MAJEURE - Routes Chantiers (`/api/chantiers/`)

#### **Problème :** COMMERCIAL peut voir TOUS les chantiers
```typescript
// LIGNE 35-39 dans app/api/chantiers/route.ts
if (session.user.role === "COMMERCIAL") {
  where.client = {
    commercialId: session.user.id  // ❌ MÊME ERREUR
  };
}
```

**❌ FAUSSE SÉCURITÉ :** Même problème que les devis.

#### **Problème :** Paramètre `clientId` non sécurisé
```typescript
// LIGNE 55-57
if (clientId) {
  where.clientId = clientId;  // ❌ PAS DE VÉRIFICATION
}
```

### 3. 🚨 FAILLE CRITIQUE - Routes CRM (`/api/crm/clients/`)

#### **Problème :** Filtrage commercial insuffisant
```typescript
// LIGNE 71-76 dans app/api/crm/clients/route.ts
if (session.user.role === 'COMMERCIAL') {
  whereClause.OR = [
    { commercialId: session.user.id },
    { id: session.user.id }  // ❌ LOGIQUE ÉTRANGE
  ];
}
```

**❌ PROBLÈME :** Un commercial peut voir son propre profil ET ses clients, mais pas les autres commerciaux.

#### **Problème :** Paramètre `commercial` non sécurisé
```typescript
// LIGNE 101-103
if (commercial && commercial.trim().length > 0) {
  whereClause.commercialId = commercial;  // ❌ PAS DE VÉRIFICATION
}
```

**💥 IMPACT :** Un commercial peut forcer `?commercial=autre-commercial-id` pour voir les clients d'autres commerciaux.

### 4. 🚨 FAILLE MAJEURE - Routes Utilisateurs (`/api/users/`)

#### **Problème :** Filtrage insuffisant pour COMMERCIAL
```typescript
// LIGNE 30-39 dans app/api/users/route.ts
if (session.user.role === "COMMERCIAL") {
  where.OR = [
    { commercialId: session.user.id },
    { id: session.user.id }
  ];
}
```

**❌ PROBLÈME :** Un commercial peut voir ses clients ET lui-même, mais pas les autres commerciaux.

#### **Problème :** Paramètres non sécurisés
```typescript
// LIGNE 63-65
if (commercialId) {
  where.commercialId = commercialId;  // ❌ PAS DE VÉRIFICATION
}
```

### 5. 🚨 FAILLE CRITIQUE - Routes Devis Individuels (`/api/devis/[id]/`)

#### **Problème :** Logique de permission incorrecte
```typescript
// LIGNE 65-68 dans app/api/devis/[id]/route.ts
const hasAccess = 
  session.user.role === "ADMIN" ||
  (session.user.role === "CLIENT" && devis.clientId === session.user.id) ||
  (session.user.role === "COMMERCIAL" && devis.client.id === session.user.id);  // ❌ ERREUR
```

**❌ ERREUR :** `devis.client.id` devrait être `devis.client.commercialId`

### 6. 🚨 FAILLE MAJEURE - Routes Chantiers Individuels (`/api/chantiers/[id]/`)

#### **Problème :** COMMERCIAL peut voir TOUS les chantiers
```typescript
// LIGNE 116-120 dans app/api/chantiers/[id]/route.ts
const hasAccess = 
  session.user.role === "ADMIN" ||
  session.user.role === "COMMERCIAL" ||  // ❌ ACCÈS TOTAL
  (session.user.role === "CLIENT" && chantier.clientId === session.user.id) ||
  chantier.assignees.some(assignee => assignee.id === session.user.id);
```

**💥 IMPACT :** Un COMMERCIAL peut voir TOUS les chantiers de l'entreprise, même ceux d'autres commerciaux.

### 7. 🚨 FAILLE CRITIQUE - Routes Interactions CRM (`/api/crm/interactions/`)

#### **Problème :** Aucune vérification de permissions
```typescript
// LIGNE 48-54 dans app/api/crm/interactions/route.ts
const where: any = {};

if (clientId) where.clientId = clientId;  // ❌ PAS DE VÉRIFICATION
if (chantierId) where.chantierId = chantierId;  // ❌ PAS DE VÉRIFICATION
```

**💥 IMPACT :** 
- Un CLIENT peut voir les interactions d'autres clients
- Un OUVRIER peut voir les données CRM
- Accès total aux données commerciales sensibles

---

## 🛡️ MIDDLEWARE - ANALYSE DE SÉCURITÉ

### ✅ Points Positifs
- Authentification obligatoire pour `/dashboard/*`
- Redirections par rôle fonctionnelles
- Headers de sécurité en production

### ❌ Limites Critiques
- **Aucune vérification au niveau des données**
- **Seulement l'authentification, pas l'autorisation**
- **Les APIs ne sont pas protégées par le middleware**

```typescript
// middleware.ts - LIGNE 110-114
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|manifest.json).*)",
  ],
};
```

**❌ PROBLÈME :** Le middleware exclut explicitement les routes `/api/*` !

---

## 🎯 SCÉNARIOS D'ATTAQUE IDENTIFIÉS

### Scénario 1 : Commercial Espion
1. Commercial A se connecte
2. Accède à `/api/devis?clientId=client-de-commercial-b`
3. **RÉSULTAT :** Voir tous les devis du client de Commercial B

### Scénario 2 : Client Curieux
1. Client A se connecte
2. Accède à `/api/crm/interactions?clientId=client-b`
3. **RÉSULTAT :** Voir les interactions commerciales de Client B

### Scénario 3 : Ouvrier Indiscret
1. Ouvrier se connecte
2. Accède à `/api/crm/clients`
3. **RÉSULTAT :** Voir tous les clients de l'entreprise

### Scénario 4 : Accès Direct aux Données
1. Utilisateur authentifié
2. Accède directement à `/api/devis/[id]` avec ID d'un autre devis
3. **RÉSULTAT :** Accès aux données financières d'autres clients

---

## 🔧 CORRECTIONS IMMÉDIATES REQUISES

### 1. **URGENT** - Corriger les filtres COMMERCIAL

#### Dans `/api/devis/route.ts` :
```typescript
// ❌ ACTUEL (FAILLE)
if (session.user.role === "COMMERCIAL") {
  where.client = {
    commercialId: session.user.id
  };
}

// ✅ CORRECTION
if (session.user.role === "COMMERCIAL") {
  where.client = {
    commercialId: session.user.id
  };
  // Ajouter vérification si clientId est fourni
  if (clientId && clientId !== session.user.id) {
    // Vérifier que le client appartient au commercial
    const client = await prisma.user.findFirst({
      where: { id: clientId, commercialId: session.user.id }
    });
    if (!client) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }
}
```

#### Dans `/api/chantiers/route.ts` :
```typescript
// ✅ CORRECTION SIMILAIRE
if (session.user.role === "COMMERCIAL") {
  where.client = {
    commercialId: session.user.id
  };
  // Même vérification pour clientId
}
```

### 2. **URGENT** - Sécuriser les paramètres de requête

#### Dans toutes les routes :
```typescript
// ✅ CORRECTION GÉNÉRALE
if (clientId) {
  // Vérifier que l'utilisateur a le droit de voir ce client
  if (session.user.role === "CLIENT" && clientId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (session.user.role === "COMMERCIAL") {
    const client = await prisma.user.findFirst({
      where: { id: clientId, commercialId: session.user.id }
    });
    if (!client) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }
  where.clientId = clientId;
}
```

### 3. **URGENT** - Corriger les routes individuelles

#### Dans `/api/devis/[id]/route.ts` :
```typescript
// ❌ ACTUEL (FAILLE)
(session.user.role === "COMMERCIAL" && devis.client.id === session.user.id)

// ✅ CORRECTION
(session.user.role === "COMMERCIAL" && devis.client.commercialId === session.user.id)
```

#### Dans `/api/chantiers/[id]/route.ts` :
```typescript
// ❌ ACTUEL (FAILLE)
session.user.role === "COMMERCIAL" ||

// ✅ CORRECTION
(session.user.role === "COMMERCIAL" && chantier.client.commercialId === session.user.id) ||
```

### 4. **URGENT** - Sécuriser les routes CRM

#### Dans `/api/crm/interactions/route.ts` :
```typescript
// ✅ AJOUTER VÉRIFICATIONS
if (clientId) {
  // Vérifier que l'utilisateur a le droit de voir ce client
  if (session.user.role === "CLIENT" && clientId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (session.user.role === "COMMERCIAL") {
    const client = await prisma.user.findFirst({
      where: { id: clientId, commercialId: session.user.id }
    });
    if (!client) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }
  where.clientId = clientId;
}
```

### 5. **URGENT** - Restreindre l'accès CRM

#### Dans `/api/crm/clients/route.ts` :
```typescript
// ✅ AJOUTER VÉRIFICATION
if (commercial && commercial.trim().length > 0) {
  // Un commercial ne peut voir que ses propres clients
  if (session.user.role === "COMMERCIAL" && commercial !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  whereClause.commercialId = commercial;
}
```

---

## 📊 MATRICE DE CORRECTIONS PRIORITAIRES

| Route | Criticité | Impact | Correction |
|-------|-----------|--------|------------|
| `/api/devis/` | 🔴 CRITIQUE | Accès aux devis d'autres commerciaux | Vérification commercialId |
| `/api/devis/[id]/` | 🔴 CRITIQUE | Accès aux devis individuels | Correction logique permission |
| `/api/chantiers/` | 🔴 CRITIQUE | Accès aux chantiers d'autres commerciaux | Vérification commercialId |
| `/api/chantiers/[id]/` | 🔴 CRITIQUE | Accès aux chantiers individuels | Restriction COMMERCIAL |
| `/api/crm/interactions/` | 🔴 CRITIQUE | Accès aux données CRM | Ajout vérifications |
| `/api/crm/clients/` | 🟡 MOYEN | Accès aux clients d'autres commerciaux | Vérification paramètres |
| `/api/users/` | 🟡 MOYEN | Accès aux utilisateurs | Vérification paramètres |

---

## 🚨 ACTIONS IMMÉDIATES REQUISES

### Phase 1 - Corrections Critiques (URGENT)
1. **Corriger les filtres COMMERCIAL** dans toutes les routes
2. **Sécuriser les paramètres de requête** (clientId, commercialId)
3. **Corriger les routes individuelles** (devis/[id], chantiers/[id])
4. **Ajouter les vérifications CRM** manquantes

### Phase 2 - Tests de Sécurité
1. **Tester chaque scénario d'attaque** identifié
2. **Vérifier que les corrections** bloquent les accès non autorisés
3. **Valider que les fonctionnalités légitimes** fonctionnent toujours

### Phase 3 - Améliorations
1. **Ajouter des logs de sécurité** pour détecter les tentatives d'accès
2. **Implémenter un système d'audit** des accès aux données
3. **Créer des tests automatisés** pour les permissions

---

## ⚠️ RECOMMANDATIONS GÉNÉRALES

### 1. Principe du Moindre Privilège
- Chaque utilisateur ne doit voir que SES données
- Les COMMERCIAUX ne voient que LEURS clients
- Les CLIENTS ne voient que LEURS projets

### 2. Validation Systématique
- Toujours vérifier les paramètres de requête
- Valider les relations commercial/client
- Bloquer les accès non autorisés

### 3. Logs de Sécurité
- Logger tous les accès aux données sensibles
- Détecter les tentatives d'accès non autorisé
- Alerter en cas de comportement suspect

### 4. Tests de Sécurité
- Tests automatisés pour chaque route
- Validation des permissions par rôle
- Simulation d'attaques

---

## 🎯 CONCLUSION

**CRITICITÉ :** 🔴 **MAXIMALE**

L'application ChantierPro présente des **failles de sécurité critiques** permettant :
- Accès aux données financières d'autres commerciaux
- Consultation des clients d'autres commerciaux  
- Accès aux données CRM par des utilisateurs non autorisés
- Violation de la confidentialité commerciale

**ACTION REQUISE :** Corrections immédiates avant toute mise en production.

**ESTIMATION :** 2-3 heures de corrections + 1 heure de tests = **4 heures maximum**

Ces failles doivent être corrigées **IMMÉDIATEMENT** pour protéger les données sensibles de l'entreprise et de ses clients.
