# Configuration des Variables d'Environnement

## Problème Identifié
Le fichier `.env` est manquant, ce qui cause les erreurs NextAuth.

## Solution
Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# App Configuration
NODE_ENV="development"

# Optional: Redis (if using Redis cache)
# REDIS_URL="redis://localhost:6379"

# Optional: Email configuration
# EMAIL_SERVER_HOST="smtp.gmail.com"
# EMAIL_SERVER_PORT=587
# EMAIL_SERVER_USER="your-email@gmail.com"
# EMAIL_SERVER_PASSWORD="your-app-password"
# EMAIL_FROM="noreply@chantierpro.com"
```

## Commandes à Exécuter

1. Créer le fichier `.env` :
```bash
cp env-setup.md .env
# Puis éditer .env pour garder seulement le contenu des variables
```

2. Générer une clé secrète NextAuth :
```bash
openssl rand -base64 32
```

3. Redémarrer le serveur de développement :
```bash
npm run dev
```
