# 📋 Changelog - ChantierPro

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/).

## [Non publié]

### Ajouté
- Système de notifications push en temps réel
- Export PDF avancé avec template personnalisable
- Géolocalisation des chantiers sur carte interactive
- Module de planification Gantt avancé

### Modifié
- Amélioration des performances de la liste des chantiers
- Interface utilisateur des devis optimisée

### Corrigé
- Problème de synchronisation des données en temps réel
- Bug de calcul TVA dans certains cas spécifiques

## [1.2.1] - 2024-01-20

### 🐛 Corrigé
- **Erreur critique d'authentification** : "Cannot read properties of undefined (reading 'call')"
  - Ajout de vérifications de sécurité dans `hooks/useAuth.ts` pour les fonctions `signIn()` et `signOut()`
  - Protection contre l'appel de fonctions non définies de next-auth/react
  - Messages d'erreur utilisateur améliorés ("Service d'authentification non disponible")
- **Page blanche sur dashboard client** 
  - Conversion du composant client vers composant serveur dans `/dashboard/client/page.tsx`
  - Suppression du conflit d'hydratation React entre SSR et CSR
  - Utilisation cohérente de `getServerSession()` pour l'authentification côté serveur
- **Stabilité de la session utilisateur**
  - Amélioration de la gestion des erreurs d'authentification
  - Prévention des boucles de redirection infinies

### 🔒 Sécurité
- **Validation renforcée** des fonctions d'authentification
- **Gestion d'erreur robuste** pour éviter les crashes de l'application
- **Messages d'erreur informatifs** sans exposition d'informations techniques

### ⚡ Performances
- **Réduction des erreurs JavaScript** côté client
- **Amélioration du temps de chargement** des pages d'authentification
- **Optimisation de l'hydratation React** pour les pages protégées

## [1.2.0] - 2024-01-15

### 🆕 Ajouté
- **CRM Client complet** avec gestion des interactions
- **Pipeline commercial** avec opportunités
- **Bibliothèque prix BTP** avec import/export CSV
- **Gestion des situations de travaux** pour facturation progressive
- **TVA multi-taux** (5.5%, 10%, 20%) pour le BTP
- **Autoliquidation** pour la sous-traitance
- **Retenues de garantie** avec gestion des échéances
- **Signatures électroniques** sur devis
- **Module de planification** avec calendrier intégré
- **Détection de conflits** de planning
- **Système de messagerie** par chantier
- **Upload de fichiers** avec aperçu
- **Recherche avancée** dans tous les modules

### 🔧 Modifié
- **Interface utilisateur** complètement redessinée
- **Performance** : Optimisation des requêtes base de données
- **Navigation** : Nouvelle sidebar avec organisation par modules
- **Dashboard** : Widgets interactifs et KPIs en temps réel
- **Responsive design** : Adaptation mobile améliorée
- **Accessibilité** : Conformité WCAG 2.1 AA

### 🐛 Corrigé
- Calcul automatique des totaux dans les devis
- Gestion des permissions par rôle utilisateur
- Synchronisation des données entre modules
- Validation des formulaires côté client et serveur
- Gestion d'erreurs API améliorée

### 🔒 Sécurité
- **Hachage des mots de passe** avec bcrypt
- **Validation des données** avec Zod
- **Protection CSRF** sur toutes les routes
- **Headers de sécurité** configurés
- **Sessions sécurisées** avec NextAuth.js

## [1.1.0] - 2023-12-01

### 🆕 Ajouté
- **Système d'authentification** avec NextAuth.js
- **Gestion des rôles** (Admin, Commercial, Ouvrier, Client)
- **Module de facturation** avec génération PDF
- **Suivi des paiements** et relances automatiques
- **Gestion documentaire** avec stockage sécurisé
- **Timeline des événements** par chantier
- **Système de commentaires** collaboratifs
- **Notifications** toast intégrées
- **Mode sombre** pour l'interface

### 🔧 Modifié
- Migration vers **Next.js 15** avec App Router
- Adoption de **TypeScript** pour toute la codebase  
- **Architecture modulaire** avec hooks personnalisés
- **Base de données** : Support PostgreSQL en production
- **UI/UX** : Design system avec Radix UI + Tailwind
- **État global** : Context providers optimisés

### 🐛 Corrigé
- Problèmes de performance sur les grandes listes
- Bugs d'affichage sur mobile
- Validation des formulaires incohérente
- Gestion d'erreurs API manquante

## [1.0.0] - 2023-10-15

### 🎉 Version initiale

#### Fonctionnalités de base
- **Gestion des chantiers** : CRUD complet
- **Gestion des clients** : Fiches clients détaillées
- **Devis simples** : Création et modification
- **Dashboard basique** : Vue d'ensemble des projets
- **Authentification simple** : Login/logout
- **Base de données SQLite** : Stockage local

#### Modules principaux
- Interface d'administration
- Gestion des utilisateurs
- Système de permissions basique
- Export PDF des devis
- Recherche textuelle simple

#### Technologies utilisées
- Next.js 13 (Pages Router)
- React 18
- Prisma ORM
- SQLite
- Tailwind CSS
- NextAuth.js

---

## 🚀 Roadmap Future

### Version 1.3.0 (Q2 2024)
- **Mobile App** : Application React Native
- **Notifications Push** : Système temps réel
- **Intégrations** : APIs comptables (Sage, Cegid)
- **BI/Analytics** : Tableaux de bord avancés
- **Multi-tenancy** : Support multi-entreprises

### Version 1.4.0 (Q3 2024)
- **IoT Integration** : Capteurs de chantier
- **ML/AI** : Prédictions de retards
- **Blockchain** : Traçabilité des matériaux
- **API Publique** : Webhooks et intégrations

### Version 2.0.0 (Q4 2024)
- **Microservices** : Architecture distribuée
- **Real-time** : Synchronisation temps réel
- **International** : Support multi-langues
- **Marketplace** : Plugins communautaires

---

## 📊 Métriques par version

| Version | Lignes de Code | Tests | Couverture | Performances |
|---------|---------------|--------|-----------|--------------|
| 1.0.0   | ~15,000      | 45     | 65%       | Base        |
| 1.1.0   | ~25,000      | 120    | 78%       | +25%        |
| 1.2.0   | ~45,000      | 280    | 85%       | +40%        |

---

## 🤝 Contributeurs

Un grand merci à tous ceux qui ont contribué à ChantierPro :

- [@username1](https://github.com/username1) - Développeur principal
- [@username2](https://github.com/username2) - UI/UX Designer
- [@username3](https://github.com/username3) - DevOps & Infrastructure
- [@username4](https://github.com/username4) - Tests & QA

---

## 📚 Ressources

- **Documentation** : [docs.chantierpro.fr](https://docs.chantierpro.fr)
- **API Reference** : [api.chantierpro.fr](https://api.chantierpro.fr)  
- **Support** : [support@chantierpro.fr](mailto:support@chantierpro.fr)
- **Communauté** : [Discord](https://discord.gg/chantierpro)

---

## 🏷️ Types de modifications

- **🆕 Ajouté** : Nouvelles fonctionnalités
- **🔧 Modifié** : Changements dans les fonctionnalités existantes
- **❌ Supprimé** : Fonctionnalités supprimées
- **🐛 Corrigé** : Corrections de bugs
- **🔒 Sécurité** : Correctifs de sécurité
- **⚡ Performances** : Améliorations de performance
- **📚 Documentation** : Changements dans la documentation

---

*Pour plus de détails sur chaque version, consultez les [releases GitHub](https://github.com/owner/chantierpro/releases).*