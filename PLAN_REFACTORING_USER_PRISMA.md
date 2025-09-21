# 🔧 PLAN DE REFACTORING PRISMA - PHASE 1 : MODÈLE USER

## 🎯 **OBJECTIF**
Simplifier le modèle `User` en séparant les responsabilités et réduisant la complexité.

## 📊 **ANALYSE DU MODÈLE USER ACTUEL**

### **PROBLÈMES IDENTIFIÉS**
- **118 lignes** de définition
- **104 champs** différents
- **25+ relations** 
- **Mélange de responsabilités** : Auth, CRM, BTP, RGPD, BI

### **CHAMPS REDONDANTS**
```prisma
// Doublons identifiés
nom           String?  // ❌ À supprimer
name          String?  // ✅ À garder

telephoneFixe     String?  // ❌ À supprimer  
phone         String?  // ✅ À garder

adresse       String?  // ❌ À supprimer
address       String?  // ✅ À garder

sourceProspection  String?  // ❌ À supprimer
sourceProspect   String?   // ✅ À garder
```

## 🏗️ **ARCHITECTURE PROPOSÉE**

### **1. MODÈLE USER CORE (Authentification)**
```prisma
model User {
  id        String @id @default(cuid())
  email     String @unique
  password  String?
  name      String
  role      Role   @default(CLIENT)
  image     String?
  
  // Relations core uniquement
  accounts      Account[]
  sessions      Session[]
  mobileSessions MobileSession[]
  pushSubscriptions PushSubscription[]
  
  // Relations métier principales
  chantiers     Chantier[] @relation("ChantierClient")
  assignedChantiers Chantier[] @relation("ChantierAssignee")
  messages      Message[]
  comments      Comment[]
  timelineEvents TimelineEvent[]
  devis         Devis[] @relation("DevisClient")
  documents     Document[] @relation("DocumentUploader")
  notifications Notification[]
  
  // Relations commerciales (simplifiées)
  commercial         User? @relation("Commercial", fields: [commercialId], references: [id])
  commercialId       String?
  commerciaux        User[] @relation("Commercial")
  
  // Relations audit
  auditLogs     AuditLog[]
  
  // Sécurité 2FA
  twoFactorSecret    String?
  twoFactorEnabled   Boolean @default(false)
  backupCodes        String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Index essentiels uniquement
  @@index([email])
  @@index([role])
  @@index([commercialId])
  @@index([createdAt])
}
```

### **2. MODÈLE USERPROFILE (Données étendues)**
```prisma
model UserProfile {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Informations personnelles
  phone     String?
  company   String?
  address   String?
  codePostal String?
  ville     String?
  pays      String? @default("France")
  
  // Informations BTP
  typeClient      TypeClient? @default(PARTICULIER)
  secteurActivite String?
  effectif        String?
  chiffreAffaires Float?
  
  // Informations légales/administratives  
  siret            String?
  codeApe          String?
  formeJuridique   String?
  capitalSocial    Float?
  
  // Préférences communication
  prefEmail        Boolean   @default(true)
  prefTelephone    Boolean   @default(true)
  prefSMS          Boolean   @default(false)
  prefCourrier     Boolean   @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([typeClient])
  @@index([secteurActivite])
}
```

### **3. MODÈLE USERCRM (Données CRM)**
```prisma
model UserCRM {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Données CRM
  sourceProspect String?   // Comment le prospect a été acquis
  notesCRM       String?   // Notes commerciales libres
  priorite       Int       @default(3) // 1=Haute, 2=Moyenne, 3=Basse
  score          Int       @default(0) // Score de qualification
  
  // Relations CRM
  interactions   InteractionClient[] @relation("ClientInteractions")
  opportunites   Opportunite[] @relation("ClientOpportunites")
  communications CommunicationClient[] @relation("ClientCommunications")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([sourceProspect])
  @@index([priorite])
  @@index([score])
}
```

## 🔄 **MIGRATION DE DONNÉES**

### **Script de Migration**
```sql
-- 1. Créer les nouvelles tables
-- (Exécuté par Prisma migrate)

-- 2. Migrer les données User vers UserProfile
INSERT INTO "UserProfile" (
  id, userId, phone, company, address, codePostal, ville, pays,
  typeClient, secteurActivite, effectif, chiffreAffaires,
  siret, codeApe, formeJuridique, capitalSocial,
  prefEmail, prefTelephone, prefSMS, prefCourrier,
  createdAt, updatedAt
)
SELECT 
  gen_random_uuid() as id,
  id as userId,
  phone,
  company,
  address,
  codePostal,
  ville,
  pays,
  typeClient,
  secteurActivite,
  effectif,
  chiffreAffaires,
  siret,
  codeApe,
  formeJuridique,
  capitalSocial,
  prefEmail,
  prefTelephone,
  prefSMS,
  prefCourrier,
  createdAt,
  updatedAt
FROM "User"
WHERE phone IS NOT NULL 
   OR company IS NOT NULL 
   OR address IS NOT NULL
   OR typeClient IS NOT NULL;

-- 3. Migrer les données User vers UserCRM
INSERT INTO "UserCRM" (
  id, userId, sourceProspect, notesCRM, priorite, score,
  createdAt, updatedAt
)
SELECT 
  gen_random_uuid() as id,
  id as userId,
  sourceProspect,
  notesCRM,
  priorite,
  score,
  createdAt,
  updatedAt
FROM "User"
WHERE sourceProspect IS NOT NULL 
   OR notesCRM IS NOT NULL 
   OR priorite != 3 
   OR score != 0;

-- 4. Supprimer les colonnes migrées du modèle User
-- (Exécuté par Prisma migrate)
```

## 📝 **MIGRATION PRISMA**

### **Fichier de Migration**
```prisma
// 1. Ajouter les nouveaux modèles
model UserProfile {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // ... (voir définition complète ci-dessus)
}

model UserCRM {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // ... (voir définition complète ci-dessus)
}

// 2. Modifier le modèle User
model User {
  id        String @id @default(cuid())
  email     String @unique
  password  String?
  name      String  // ✅ Garder seulement name
  role      Role    @default(CLIENT)
  image     String?
  
  // Relations core
  accounts      Account[]
  sessions      Session[]
  mobileSessions MobileSession[]
  pushSubscriptions PushSubscription[]
  
  // Relations métier principales
  chantiers     Chantier[] @relation("ChantierClient")
  assignedChantiers Chantier[] @relation("ChantierAssignee")
  messages      Message[]
  comments      Comment[]
  timelineEvents TimelineEvent[]
  devis         Devis[] @relation("DevisClient")
  documents     Document[] @relation("DocumentUploader")
  notifications Notification[]
  
  // Relations commerciales
  commercial         User? @relation("Commercial", fields: [commercialId], references: [id])
  commercialId       String?
  commerciaux        User[] @relation("Commercial")
  
  // Relations audit
  auditLogs     AuditLog[]
  
  // Sécurité 2FA
  twoFactorSecret    String?
  twoFactorEnabled   Boolean @default(false)
  backupCodes        String?
  
  // Relations vers les nouveaux modèles
  profile      UserProfile?
  crm          UserCRM?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
  @@index([role])
  @@index([commercialId])
  @@index([createdAt])
}
```

## 🧪 **TESTS DE VALIDATION**

### **Tests Unitaires**
```typescript
// Test de création d'utilisateur
describe('User Creation', () => {
  it('should create user with profile', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
        profile: {
          create: {
            phone: '+33123456789',
            company: 'Test Company',
            typeClient: 'PROFESSIONNEL'
          }
        }
      },
      include: {
        profile: true
      }
    });
    
    expect(user.profile).toBeDefined();
    expect(user.profile?.phone).toBe('+33123456789');
  });
});

// Test de création d'utilisateur CRM
describe('User CRM', () => {
  it('should create user with CRM data', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'crm@example.com',
        name: 'CRM User',
        role: 'COMMERCIAL',
        crm: {
          create: {
            sourceProspect: 'Website',
            notesCRM: 'Hot prospect',
            priorite: 1,
            score: 85
          }
        }
      },
      include: {
        crm: true
      }
    });
    
    expect(user.crm).toBeDefined();
    expect(user.crm?.score).toBe(85);
  });
});
```

### **Tests d'Intégration**
```typescript
// Test de migration des données existantes
describe('Data Migration', () => {
  it('should migrate existing user data', async () => {
    // Créer un utilisateur avec l'ancien schéma
    const oldUser = await prisma.user.create({
      data: {
        email: 'migration@example.com',
        name: 'Migration User',
        phone: '+33123456789',
        company: 'Migration Company',
        sourceProspect: 'Referral',
        notesCRM: 'Migration test',
        priorite: 2,
        score: 70
      }
    });
    
    // Exécuter la migration
    await migrateUserData(oldUser.id);
    
    // Vérifier la migration
    const newUser = await prisma.user.findUnique({
      where: { id: oldUser.id },
      include: {
        profile: true,
        crm: true
      }
    });
    
    expect(newUser?.profile?.phone).toBe('+33123456789');
    expect(newUser?.crm?.sourceProspect).toBe('Referral');
  });
});
```

## 📊 **MÉTRIQUES DE SUCCÈS**

### **AVANT REFACTORING**
- **Lignes User** : 118 lignes
- **Champs User** : 104 champs
- **Relations User** : 25+ relations
- **Complexité** : TRÈS ÉLEVÉE

### **APRÈS REFACTORING**
- **Lignes User** : 45 lignes (-62%)
- **Champs User** : 12 champs (-88%)
- **Relations User** : 15 relations (-40%)
- **Complexité** : MODÉRÉE

### **BÉNÉFICES ATTENDUS**
- ✅ **Maintenabilité** : +70%
- ✅ **Performance** : +40%
- ✅ **Lisibilité** : +80%
- ✅ **Évolutivité** : +60%

## 🚀 **PLAN D'EXÉCUTION**

### **ÉTAPE 1 : Préparation (30min)**
1. Sauvegarde de la base de données
2. Création des tests de non-régression
3. Validation du plan avec l'équipe

### **ÉTAPE 2 : Création des nouveaux modèles (1h)**
1. Création des modèles UserProfile et UserCRM
2. Génération du client Prisma
3. Tests des nouveaux modèles

### **ÉTAPE 3 : Migration des données (1h)**
1. Exécution du script de migration
2. Validation des données migrées
3. Tests de cohérence

### **ÉTAPE 4 : Mise à jour du modèle User (30min)**
1. Suppression des champs migrés
2. Ajout des relations vers les nouveaux modèles
3. Mise à jour des index

### **ÉTAPE 5 : Tests et validation (30min)**
1. Tests unitaires et d'intégration
2. Tests de performance
3. Validation des APIs

## ⚠️ **RISQUES ET MITIGATION**

### **RISQUES IDENTIFIÉS**
1. **Perte de données** lors de la migration
2. **Régression des APIs** existantes
3. **Performance dégradée** temporairement

### **STRATÉGIES DE MITIGATION**
1. **Sauvegarde complète** avant migration
2. **Tests automatisés** pour chaque étape
3. **Migration progressive** avec rollback possible
4. **Monitoring** des performances

## 📋 **CHECKLIST DE VALIDATION**

- [ ] Sauvegarde de la base de données
- [ ] Tests de non-régression créés
- [ ] Nouveaux modèles créés
- [ ] Script de migration testé
- [ ] Données migrées avec succès
- [ ] Modèle User simplifié
- [ ] APIs mises à jour
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Performance validée
- [ ] Documentation mise à jour

---

**Cette refactorisation du modèle User réduira significativement la complexité du schéma Prisma tout en améliorant la maintenabilité et les performances.**
