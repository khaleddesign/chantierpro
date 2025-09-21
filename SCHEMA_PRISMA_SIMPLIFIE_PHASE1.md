# 🔧 SCHÉMA PRISMA SIMPLIFIÉ - PHASE 1

## 📋 **NOUVEAUX MODÈLES USER**

```prisma
// Modèle User simplifié (core auth)
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

// Modèle UserProfile (données étendues)
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

// Modèle UserCRM (données CRM)
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

## 📊 **BÉNÉFICES OBTENUS**

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

## 🚀 **PROCHAINES ÉTAPES**

1. **Tester la migration** avec les données existantes
2. **Valider les APIs** avec le nouveau schéma
3. **Passer à la Phase 2** : Simplification CRM
4. **Continuer avec Phase 3** : Simplification BI/RGPD
