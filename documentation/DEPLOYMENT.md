# 🚀 Guide de Déploiement - ChantierPro

## Vue d'ensemble du déploiement

Ce guide couvre les différentes options de déploiement pour ChantierPro, de l'environnement de développement à la production complète.

## 🏗️ Architecture de déploiement recommandée

```
┌─────────────────────────────────────────────────────────┐
│                    Production Setup                     │
├─────────────────────────────────────────────────────────┤
│  CDN/Edge (Vercel Edge/CloudFlare)                     │
│  ├── Static Assets Caching                             │
│  └── Global Distribution                               │
├─────────────────────────────────────────────────────────┤
│  Application Layer (Vercel/Railway/Render)             │
│  ├── Next.js App (Server-side Rendering)               │
│  ├── API Routes                                        │
│  └── Authentication (NextAuth.js)                      │
├─────────────────────────────────────────────────────────┤
│  Database Layer                                         │
│  ├── PostgreSQL (Recommended for production)           │
│  └── Prisma ORM                                        │
├─────────────────────────────────────────────────────────┤
│  File Storage                                           │
│  ├── Vercel Blob / AWS S3 / CloudFlare R2              │
│  └── Image Optimization                                │
└─────────────────────────────────────────────────────────┘
```

## 🌍 Options de déploiement

### 1. 🚀 Vercel (Recommandé)

Vercel est la solution recommandée pour le déploiement de ChantierPro car :
- Optimisé pour Next.js
- Déploiement automatique depuis Git
- Edge Functions pour les performances
- Base de données intégrée disponible

#### Configuration Vercel

**1. Installation CLI**
```bash
npm i -g vercel
vercel login
```

**2. Configuration du projet**
```bash
# Dans le dossier du projet
vercel

# Suivre les instructions :
# - Link to existing project? No
# - Project name: chantierpro
# - Directory: ./
# - Settings correct? Yes
```

**3. Variables d'environnement**
```bash
# Ajouter les variables d'environnement
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Exemple de valeurs :
# DATABASE_URL="postgresql://user:password@host:port/db"
# NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
# NEXTAUTH_URL="https://your-app.vercel.app"
```

**4. Configuration base de données (vercel.json)**
```json
{
  "build": {
    "env": {
      "PRISMA_GENERATE_DATAPROXY": "true"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**5. Script de déploiement (package.json)**
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma db push && next build"
  }
}
```

### 2. 🛤️ Railway

Railway offre un excellent support pour PostgreSQL et un déploiement simple.

#### Configuration Railway

**1. Installation CLI**
```bash
npm i -g @railway/cli
railway login
```

**2. Initialisation**
```bash
railway init chantierpro
railway add postgresql
```

**3. Variables d'environnement**
```bash
railway variables set NEXTAUTH_SECRET=your-secret-key
railway variables set NEXTAUTH_URL=https://your-app.up.railway.app
# DATABASE_URL est automatiquement configurée
```

**4. Déploiement**
```bash
railway up
```

### 3. 🎯 Render

Alternative robuste avec base de données PostgreSQL incluse.

#### Configuration Render

**1. Création du service Web**
- Connecter le repository GitHub
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npm start`

**2. Base de données PostgreSQL**
- Créer un service PostgreSQL
- Copier l'URL de connexion interne

**3. Variables d'environnement**
```env
DATABASE_URL=postgresql://user:pass@hostname:port/database
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=your-secret-key-32-chars-minimum
NODE_ENV=production
```

## 🗄️ Configuration base de données

### PostgreSQL (Production recommandée)

**1. Migration depuis SQLite**
```bash
# Backup des données SQLite (optionnel)
sqlite3 prisma/dev.db .dump > backup.sql

# Modifier DATABASE_URL dans .env
DATABASE_URL="postgresql://user:password@host:port/dbname"

# Appliquer le schéma
npx prisma db push

# Générer le client
npx prisma generate
```

**2. Schema Prisma pour PostgreSQL**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Changed from "sqlite"
  url      = env("DATABASE_URL")
}

// Le reste du schéma reste identique
```

**3. Configuration des connexions**
```typescript
// lib/prisma.ts - Production optimized
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
```

### Seed de données initiales

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Créer un admin par défaut
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.create({
    data: {
      name: 'Administrateur',
      email: 'admin@chantierpro.fr',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  // Ajouter des données de base
  await prisma.bibliothequePrix.createMany({
    data: [
      {
        code: 'CAR001',
        designation: 'Carrelage sol 30x30',
        unite: 'm²',
        prixHT: 45.00,
        corpsEtat: 'Carrelage',
        region: 'France'
      },
      // ... autres prix
    ]
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## 🔒 Configuration de sécurité

### Variables d'environnement de production

```env
# Base de données
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters-long"

# Optionnel : OAuth providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optionnel : Storage
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Headers de sécurité (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... autres configurations
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

## 📁 Gestion des fichiers en production

### Option 1: Vercel Blob
```typescript
// lib/storage.ts
import { put, del } from '@vercel/blob'

export async function uploadFile(file: File, filename: string) {
  const blob = await put(filename, file, {
    access: 'public',
  })
  
  return blob.url
}

export async function deleteFile(url: string) {
  await del(url)
}
```

### Option 2: AWS S3
```bash
npm install @aws-sdk/client-s3
```

```typescript
// lib/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToS3(file: Buffer, key: string, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
  }))
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions (recommandé)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📊 Monitoring et observabilité

### Logging en production

```typescript
// lib/logger.ts
interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: any;
  timestamp: string;
  userId?: string;
  requestId?: string;
}

class Logger {
  private log(entry: LogEntry) {
    const logLine = JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    
    console.log(logLine);
    
    // En production, envoyer vers un service de logging
    if (process.env.NODE_ENV === 'production') {
      // this.sendToLoggingService(entry);
    }
  }
  
  info(message: string, metadata?: any, userId?: string) {
    this.log({ level: 'info', message, metadata, userId });
  }
  
  error(message: string, error?: Error, metadata?: any, userId?: string) {
    this.log({ 
      level: 'error', 
      message, 
      metadata: { ...metadata, error: error?.stack },
      userId 
    });
  }
}

export const logger = new Logger();
```

### Health Check endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: process.env.npm_package_version
    };
    
    return NextResponse.json(healthCheck);
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Database connection failed' 
      }, 
      { status: 503 }
    );
  }
}
```

## 🎯 Performance en production

### Configuration optimisée

```javascript
// next.config.js
const nextConfig = {
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  
  // Bundle analyzer (développement)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(new BundleAnalyzerPlugin({
        openAnalyzer: false,
      }));
      return config;
    },
  }),
}
```

### Caching Strategy

```typescript
// Caching des API Routes
export async function GET(request: NextRequest) {
  const response = await getChantiers();
  
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600'
    }
  });
}
```

## 🔧 Scripts de maintenance

### Backup automatisé

```bash
#!/bin/bash
# scripts/backup-db.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

# PostgreSQL backup
pg_dump $DATABASE_URL > backups/$BACKUP_FILE

# Upload vers S3 (optionnel)
aws s3 cp backups/$BACKUP_FILE s3://your-backup-bucket/

echo "Backup créé: $BACKUP_FILE"
```

### Script de migration

```bash
#!/bin/bash
# scripts/migrate-production.sh

echo "🔄 Démarrage migration production..."

# Backup avant migration
./scripts/backup-db.sh

# Appliquer les migrations
npx prisma migrate deploy

# Redémarrer l'application (selon le provider)
# vercel --prod
# railway up
# render deploy

echo "✅ Migration terminée"
```

Ce guide de déploiement vous permettra de mettre ChantierPro en production de manière sécurisée et performante, avec toutes les bonnes pratiques de l'industrie.