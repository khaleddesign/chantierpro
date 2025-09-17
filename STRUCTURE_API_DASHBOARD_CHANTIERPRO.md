# Structure API et Dashboard ChantierPro

## 📁 Structure des Routes API (`app/api/`)

### 🔐 Authentification (`auth/`)
```
auth/
├── [...nextauth]/route.ts          # NextAuth configuration
├── 2fa/
│   ├── setup/route.ts              # Configuration 2FA
│   └── verify/route.ts              # Vérification 2FA
├── login/route.ts                  # Login personnalisé
└── register/route.ts               # Inscription utilisateurs
```

### 👑 Administration (`admin/`)
```
admin/
├── cache/route.ts                  # Gestion du cache système
├── gdpr/route.ts                   # Administration RGPD
├── integrations/
│   ├── route.ts                    # Gestion intégrations
│   └── sync/route.ts               # Synchronisation données
├── performance/route.ts             # Métriques performance
├── security/route.ts                # Monitoring sécurité
└── stats/route.ts                  # Statistiques globales
```

### 📊 Analytics (`analytics/`)
```
analytics/
├── business-intelligence/route.ts   # BI et rapports avancés
└── route.ts                         # Analytics de base
```

### 🏗️ Chantiers (`chantiers/`)
```
chantiers/
├── [id]/
│   ├── assign/route.ts              # Assignation ouvriers
│   ├── messages/route.ts            # Messages du chantier
│   ├── restore/route.ts             # Restauration chantier
│   └── route.ts                     # CRUD chantier individuel
├── mes-chantiers/route.ts           # Chantiers de l'utilisateur
└── route.ts                         # Liste tous chantiers
```

### 💼 CRM (`crm/`)
```
crm/
├── analytics/route.ts               # Analytics CRM
├── clients/
│   ├── [id]/
│   │   └── fiche-complete/route.ts  # Fiche client complète
│   └── route.ts                     # Gestion clients
├── communications/route.ts           # Communications clients
├── interactions/
│   ├── [id]/route.ts               # Interaction individuelle
│   └── route.ts                     # Liste interactions
├── opportunites/
│   ├── [id]/route.ts               # Opportunité individuelle
│   └── route.ts                     # Liste opportunités
└── workflows/
    ├── execute/route.ts             # Exécution workflows
    └── route.ts                     # Gestion workflows
```

### 📋 Devis (`devis/`)
```
devis/
├── [id]/
│   ├── autoliquidation/route.ts     # Gestion autoliquidation TVA
│   ├── convert/route.ts             # Conversion devis→facture
│   ├── route.ts                     # CRUD devis individuel
│   ├── send/route.ts                # Envoi devis client
│   ├── situations/route.ts          # Situations de travaux
│   └── tva-multitaux/route.ts       # TVA multi-taux
├── export/route.ts                  # Export devis
├── route.ts                         # Liste tous devis
├── stats/route.ts                   # Statistiques devis
└── test/route.ts                    # Tests devis
```

### 📄 Documents (`documents/`)
```
documents/
├── [id]/
│   ├── download/route.ts            # Téléchargement document
│   ├── preview/route.ts             # Aperçu document
│   └── route.ts                     # CRUD document individuel
├── route.ts                         # Liste tous documents
└── share/route.ts                   # Partage documents
```

### 📧 Messages (`messages/`)
```
messages/
├── [id]/
│   └── edit/route.ts                # Édition message
├── chantier/
│   └── [id]/route.ts                # Messages par chantier
├── contacts/route.ts                # Liste contacts
├── conversation/route.ts             # Gestion conversations
├── conversations/
│   └── [id]/
│       ├── archive/route.ts         # Archivage conversation
│       ├── mark-read/route.ts       # Marquer comme lu
│       ├── pin/route.ts              # Épingler conversation
│       └── route.ts                  # Conversation individuelle
├── files/
│   └── upload/route.ts              # Upload fichiers messages
├── mark-read/route.ts               # Marquer messages comme lus
├── message/
│   └── [id]/
│       └── read/route.ts            # Marquer message comme lu
├── route.ts                         # Liste tous messages
└── search/route.ts                  # Recherche messages
```

### 📱 Mobile (`mobile/`)
```
mobile/
├── auth/
│   └── login/route.ts               # Authentification mobile
├── chantiers/route.ts               # Chantiers mobile
├── documents/route.ts                # Documents mobile
├── messages/route.ts                 # Messages mobile
├── planning/route.ts                 # Planning mobile
├── push/
│   └── subscribe/route.ts           # Abonnement notifications
└── sync/route.ts                    # Synchronisation mobile
```

### 📅 Planning (`planning/`)
```
planning/
├── [id]/route.ts                    # Événement planning individuel
├── conflicts/route.ts               # Détection conflits planning
└── route.ts                         # Liste tous événements
```

### 👥 Utilisateurs (`users/`)
```
users/
├── [id]/route.ts                    # Utilisateur individuel
└── route.ts                         # Liste tous utilisateurs
```

### 🔧 Modules Spécialisés
```
bibliotheque/                        # Bibliothèque documents
├── [id]/route.ts
└── route.ts

bibliotheque-prix/                   # Bibliothèque prix BTP
├── [id]/route.ts
├── export/route.ts
├── import/route.ts
└── route.ts

etapes/                              # Étapes chantiers
├── [id]/route.ts
└── route.ts

facturation/                         # Facturation
└── route.ts

factures/                            # Gestion factures
├── analytics/route.ts
├── paiements/route.ts
└── relances/route.ts

gdpr/                                # RGPD utilisateur
└── route.ts

health/                              # Santé application
└── route.ts

interactions/                        # Interactions clients
└── route.ts

opportunites/                        # Opportunités commerciales
└── route.ts

profile/                             # Profil utilisateur
└── route.ts

projets/                             # Projets BTP
└── [id]/
    └── planning/
        └── [id]/

security/                            # Sécurité
└── monitoring/route.ts

taches/                              # Tâches projets
└── [id]/route.ts

timeline/                            # Timeline événements
└── route.ts

upload/                              # Upload fichiers
└── route.ts
```

---

## 🎯 Structure des Modules Dashboard (`app/dashboard/`)

### 🏠 Dashboard Principal
```
dashboard/
├── layout.tsx                       # Layout principal dashboard
├── page.tsx                         # Page d'accueil dashboard
└── page-direct.tsx                  # Page d'accueil directe
```

### 👑 Administration (`admin/`)
```
admin/
├── page.tsx                         # Tableau de bord admin
├── bibliotheque/page.tsx            # Gestion bibliothèque
├── integrations/page.tsx            # Configuration intégrations
├── monitoring/page.tsx               # Monitoring système
└── rgpd/page.tsx                    # Administration RGPD
```

### 📊 Analytics (`analytics/`)
```
analytics/
└── business-intelligence/page.tsx    # Business Intelligence
```

### 🏗️ Chantiers (`chantiers/`)
```
chantiers/
├── page.tsx                         # Liste tous chantiers
├── nouveau/page.tsx                 # Création nouveau chantier
└── [id]/
    ├── page.tsx                     # Détail chantier
    ├── etapes/page.tsx              # Étapes du chantier
    └── components/                  # Composants chantier
        ├── AssignmentPanel.tsx      # Panel assignation
        ├── ChantierDocuments.tsx     # Documents chantier
        ├── ChantierEtapes.tsx       # Étapes chantier
        ├── ChantierMessages.tsx     # Messages chantier
        ├── ChantierPhotos.tsx       # Photos chantier
        └── ChantierTimeline.tsx     # Timeline chantier
```

### 👤 Client (`client/`)
```
client/
├── layout.tsx                       # Layout spécifique client
├── page.tsx                         # Dashboard client
├── page-direct.tsx                  # Page directe client
└── page-test.tsx                   # Page test client
```

### 💼 CRM (`crm/`)
```
crm/
├── page.tsx                         # Tableau de bord CRM
├── alertes/page.tsx                 # Alertes CRM
├── analytics/page.tsx               # Analytics CRM
├── clients/
│   ├── page.tsx                     # Liste clients
│   └── [id]/page.tsx                # Fiche client
├── interactions/page.tsx            # Interactions clients
├── opportunites/
│   ├── page.tsx                     # Liste opportunités
│   ├── [id]/page.tsx                # Détail opportunité
│   └── nouveau/page.tsx             # Nouvelle opportunité
├── pipeline/page.tsx                # Pipeline commercial
├── tools/page.tsx                   # Outils CRM
└── workflows/page.tsx               # Workflows automatisation
```

### 📋 Devis (`devis/`)
```
devis/
├── page.tsx                         # Liste tous devis
├── nouveau/page.tsx                 # Création nouveau devis
└── [id]/
    ├── page.tsx                     # Détail devis
    ├── edit/page.tsx                # Édition devis
    └── tva-multitaux/page.tsx       # Configuration TVA multi-taux
```

### 📄 Documents (`documents/`)
```
documents/
├── page.tsx                         # Liste tous documents
├── upload/page.tsx                  # Upload documents
└── [id]/page.tsx                    # Détail document
```

### 💰 Factures (`factures/`)
```
factures/
└── page.tsx                         # Gestion factures
```

### 📧 Messages (`messages/`)
```
messages/
├── page.tsx                         # Liste messages
├── nouveau/page.tsx                 # Nouveau message
└── recherche/page.tsx               # Recherche messages
```

### 👷 Ouvrier (`ouvrier/`)
```
ouvrier/
└── page.tsx                         # Dashboard ouvrier
```

### 📅 Planning (`planning/`)
```
planning/
├── page.tsx                         # Calendrier planning
├── nouveau/page.tsx                 # Nouvel événement
└── [id]/page.tsx                    # Détail événement
```

### 👤 Profil (`profile/`)
```
profile/
├── page.tsx                         # Profil utilisateur
├── ProfileForm.tsx                  # Formulaire profil
└── components/
    └── ProfileForm.tsx              # Composant formulaire
```

### 🏗️ Projets (`projets/`)
```
projets/
├── page.tsx                         # Liste projets
└── [id]/
    ├── layout.tsx                   # Layout projet
    ├── page.tsx                     # Détail projet
    └── planning/
        └── page.tsx                 # Planning projet
```

### 📊 Rapports (`reports/`)
```
reports/
└── page.tsx                         # Rapports et exports
```

### 👥 Utilisateurs (`users/`)
```
users/
├── page.tsx                         # Liste utilisateurs
├── nouveau/page.tsx                 # Nouvel utilisateur
└── [id]/page.tsx                    # Détail utilisateur
```

---

## 📈 Résumé des Modules Implémentés

### ✅ Modules Complets (API + Dashboard)
- **Chantiers** : Gestion complète des projets BTP
- **Devis/Facturation** : Workflow commercial complet
- **CRM** : Gestion clients, opportunités, interactions
- **Messages** : Communication interne et externe
- **Planning** : Organisation et coordination
- **Documents** : Gestion documentaire
- **Utilisateurs** : Gestion des comptes et permissions
- **Administration** : Outils d'administration système

### 🔧 Modules Spécialisés
- **Mobile** : APIs optimisées pour mobile
- **Analytics/BI** : Business Intelligence
- **RGPD** : Conformité réglementaire
- **Sécurité** : Monitoring et audit
- **Intégrations** : Connexions externes
- **Bibliothèque Prix** : Base de données prix BTP

### 🎯 Interfaces par Rôle
- **ADMIN** : Accès complet à tous les modules
- **COMMERCIAL** : CRM, devis, clients, planning
- **OUVRIER** : Chantiers assignés, messages, documents
- **CLIENT** : Interface simplifiée pour ses projets

Cette structure démontre une application BTP complète et professionnelle avec une séparation claire des responsabilités et des interfaces adaptées à chaque rôle utilisateur.
