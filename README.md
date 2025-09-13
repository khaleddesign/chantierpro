# ChantierPro - CRM BTP

## 🏗️ Description

ChantierPro est une plateforme de gestion complète pour les professionnels du BTP. Elle offre un CRM avancé, la gestion des chantiers, la facturation, et bien plus encore.

## ✨ Fonctionnalités

### 🏢 CRM Complet
- **Gestion des clients** : PARTICULIER, ENTREPRISE, COLLECTIVITE
- **Pipeline commercial** avec suivi des opportunités
- **Segmentation automatique** par secteur et chiffre d'affaires
- **Analytics avancées** avec métriques de performance
- **Historique complet** des interactions

### 📊 Tableau de Bord
- **Dashboard personnalisé** selon le rôle (ADMIN, COMMERCIAL, CLIENT)
- **Métriques en temps réel** : CA, conversions, performance
- **Graphiques interactifs** avec Chart.js
- **Alertes intelligentes** et notifications push

### 🏗️ Gestion de Chantiers
- **Suivi complet** des projets de construction
- **Timeline automatique** des événements
- **Gestion des étapes** et jalons
- **Documents partagés** et versioning
- **Photos avant/après** avec géolocalisation

### 💰 Facturation & Devis
- **Générateur de devis** automatique
- **Facturation récurrente** et one-shot
- **Templates personnalisables** PDF
- **Suivi des paiements** et relances
- **Reporting financier** détaillé

### 📱 PWA & Mobile
- **Progressive Web App** installable
- **Mode hors-ligne** avec sync automatique
- **Notifications push** multi-plateforme
- **Interface responsive** adaptative
- **API mobile** dédiée avec JWT

### 🔐 Sécurité & Authentification
- **NextAuth.js** avec sessions sécurisées
- **Validation renforcée** des mots de passe (12+ caractères)  
- **Rate limiting** anti-bruteforce
- **Middleware** de protection des routes
- **Audit trail** des actions utilisateurs
- **Protection robuste** contre les erreurs d'authentification (v1.2.1)

## 🛠️ Technologies

- **Next.js 15** - App Router avec RSC
- **TypeScript** - Typage statique strict
- **Prisma ORM** - Base de données type-safe
- **NextAuth.js** - Authentification complète
- **Tailwind CSS** - Design system moderne
- **PWA** - Application web progressive

## 🚀 Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/chantierpro.git
cd chantierpro

# Installer les dépendances
npm install

# Configurer la base de données
npx prisma generate
npx prisma db push

# Lancement
npm run dev
```

## 🐛 Débogage & Support

### Problèmes Courants

#### Erreur d'Authentification
```bash
# Si vous rencontrez "Cannot read properties of undefined"
# Vérifiez que le SessionProvider est bien configuré
# Cette erreur a été corrigée en v1.2.1
```

#### Page Blanche Dashboard
```bash
# Problème résolu en v1.2.1
# Le dashboard client utilise maintenant des Server Components
# Redémarrez le serveur si le problème persiste
npm run dev
```

#### Base de Données
```bash
# Réinitialiser la base de données
npx prisma db push --force-reset
npx prisma generate
```

### Comptes de Test
- **Admin** : `admin@chantierpro.fr` / `admin123`
- **Commercial** : `commercial@chantierpro.fr` / `commercial123`  
- **Client** : `client@chantierpro.fr` / `client123`

### Logs de Débogage
```bash
# Activer les logs Prisma
DEBUG="prisma:*" npm run dev

# Voir les requêtes NextAuth
NEXTAUTH_DEBUG=true npm run dev
```

### Documentation Technique
- **[Correction Authentification](./documentation/AUTHENTICATION_FIX.md)** - Détails techniques v1.2.1
- **[Changelog](./documentation/CHANGELOG.md)** - Historique complet des versions
- **[Architecture](./documentation/ARCHITECTURE.md)** - Structure technique

## 📄 Licence

MIT License

---

**Développé avec ❤️ pour les professionnels du BTP**
