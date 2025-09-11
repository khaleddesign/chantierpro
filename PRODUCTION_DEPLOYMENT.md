# Guide de Déploiement Production ChantierPro

## ✅ Pré-requis

### 1. Infrastructure
- **Base de données**: PostgreSQL 14+ (recommandé)
- **Cache**: Redis 6+ (recommandé pour les performances)
- **Node.js**: Version 18+ ou 20+ 
- **Serveur Web**: Nginx ou Apache (pour reverse proxy)
- **SSL/TLS**: Certificat valide (Let's Encrypt recommandé)

### 2. Variables d'environnement
Copiez `.env.production.example` vers `.env` et configurez:

```bash
cp .env.production.example .env
```

**Variables critiques à modifier:**
- `DATABASE_URL`: Connection PostgreSQL
- `NEXTAUTH_SECRET`: Clé secrète forte (32+ caractères)
- `NEXTAUTH_URL`: URL complète de votre domaine
- `SMTP_*`: Configuration email pour notifications

## 🔐 Sécurité

### Headers de sécurité (déjà configurés)
- Content Security Policy via middleware
- HSTS, XSS Protection, Frame Options
- Secure cookies en production

### Authentification
- JWT tokens avec expiration
- Hachage bcrypt pour mots de passe
- Validation stricte des rôles utilisateur

## 🚀 Déploiement

### 1. Build de l'application
```bash
npm ci --production=false
npm run build
```

### 2. Migration de base de données
```bash
npx prisma generate
npx prisma db push
```

### 3. Démarrage en production
```bash
NODE_ENV=production npm start
```

## 📊 Monitoring & Logs

### Configuration Sentry (recommandé)
1. Créer un projet Sentry
2. Configurer `SENTRY_DSN` dans `.env`
3. Les erreurs seront automatiquement trackées

### Logs de production
- Niveau `error` par défaut
- Rotation automatique recommandée
- Monitoring des performances via headers

## 🔧 Optimisations

### Performance
- Cache Redis activé
- Compression des assets
- Source maps désactivées en production
- Optimisation des images automatique

### Sauvegardes automatiques
- Base de données: quotidienne
- Fichiers uploadés: sync cloud storage
- Rétention: 30 jours par défaut

## 🧪 Tests avant déploiement

```bash
# Tests unitaires
npm test

# Build de vérification
npm run build

# Lint et format
npm run lint
npm run format
```

## 🔄 CI/CD (Recommandations)

### GitHub Actions / GitLab CI
1. Tests automatiques sur PR
2. Build validation
3. Déploiement automatique sur main
4. Rollback en cas d'erreur

### Health Checks
- `/api/health` endpoint disponible
- Monitoring uptime recommandé
- Alertes en cas de downtime

## 🆘 Résolution de problèmes

### Erreurs courantes
1. **Database connection**: Vérifier `DATABASE_URL`
2. **Auth errors**: Valider `NEXTAUTH_SECRET`
3. **Build failures**: TypeScript strict activé en prod

### Logs utiles
```bash
# Logs de production
pm2 logs chantierpro

# Monitoring base de données
tail -f /var/log/postgresql/postgresql.log
```

## 📞 Support

En cas de problème:
1. Vérifier les logs d'application
2. Consulter Sentry pour les erreurs
3. Tester la connectivité database/redis
4. Valider les certificats SSL

---
**Note**: Cette configuration suit les meilleures pratiques de sécurité et performance pour une application Next.js en production.