# Plan d'Optimisation CRM - ChantierPro

## Problèmes actuels
- 14 pages dashboard dispersées
- Redondances (projets/chantiers, client/crm)  
- Navigation confuse
- Manque de focus sur le pipeline de vente
- Fonctionnalités essentielles CRM manquantes

## Architecture optimisée proposée

### 1. Dashboard principal unifié
- Vue d'ensemble : KPIs, pipeline, activités récentes
- Accès rapide aux fonctions critiques
- Notifications centralisées

### 2. Module CRM intégré (4 sections core)
```
📊 PIPELINE
├── Prospects/Leads
├── Opportunités en cours  
├── Chantiers (projets confirmés)
└── Suivi post-vente

👥 CONTACTS
├── Clients existants
├── Prospects  
├── Partenaires
└── Équipe interne

💬 COMMUNICATIONS
├── Messages intégrés
├── Historique interactions
├── Rappels/Tâches
└── E-mails automatiques

📄 DOCUMENTS & DEVIS
├── Devis en cours
├── Contrats signés
├── Factures
└── Documents projets
```

### 3. Pages à supprimer/fusionner
- ❌ `/projets` → fusionner avec `/chantiers` 
- ❌ `/client` → intégrer dans CRM unifié
- ❌ `/admin` → fonctions dans paramètres
- ❌ `/ouvrier` → intégrer dans équipe/ressources
- ❌ `/users` → fusionner avec admin/équipe
- ❌ Pages reports séparées → dashboard intégré

### 4. Navigation simplifiée (6 sections max)
1. 🏠 **Dashboard** - Vue d'ensemble
2. 🎯 **CRM/Pipeline** - Gestion commerciale complète  
3. 🏗️ **Chantiers** - Gestion opérationnelle projets
4. 📅 **Planning** - Calendrier unifié
5. 📁 **Documents** - Gestion documentaire centralisée
6. ⚙️ **Paramètres** - Configuration & équipe

## Bénéfices attendus
✅ Navigation 60% plus simple
✅ Réduction de 8 pages superflues  
✅ Pipeline de vente unifié et clair
✅ Focus sur les conversions prospect → client → chantier
✅ Workflow commercial optimisé
✅ Moins de clics, plus d'efficacité

## Prochaines étapes
1. Refonte du dashboard principal
2. Création du module CRM intégré
3. Migration/fusion des pages existantes
4. Tests utilisateur et ajustements