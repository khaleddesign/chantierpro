#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

console.log('🚀 Migration vers PostgreSQL - ChantierPro')
console.log('===============================================')

async function migrateToPostgreSQL() {
  console.log('📊 1. Vérification de la base SQLite existante...')
  
  const sqliteDbPath = path.join(__dirname, '..', 'prisma', 'dev.db')
  
  if (!fs.existsSync(sqliteDbPath)) {
    console.log('❌ Aucune base SQLite trouvée à migrer.')
    console.log('✅ Vous pouvez procéder directement à la configuration PostgreSQL.')
    return
  }
  
  console.log('✅ Base SQLite trouvée!')
  
  console.log('📋 2. Instructions pour la migration:')
  console.log('')
  console.log('ÉTAPE 1 - Installer PostgreSQL:')
  console.log('macOS: brew install postgresql')
  console.log('Ubuntu: sudo apt install postgresql postgresql-contrib')
  console.log('Windows: https://www.postgresql.org/download/windows/')
  console.log('')
  console.log('ÉTAPE 2 - Créer la base de données:')
  console.log('sudo -u postgres psql')
  console.log('CREATE DATABASE chantierpro;')
  console.log('CREATE USER chantierpro_user WITH ENCRYPTED PASSWORD \'your_password\';')
  console.log('GRANT ALL PRIVILEGES ON DATABASE chantierpro TO chantierpro_user;')
  console.log('\\q')
  console.log('')
  console.log('ÉTAPE 3 - Configurer l\'URL de base de données:')
  console.log('Dans votre fichier .env, remplacez:')
  console.log('DATABASE_URL="sqlite:./prisma/dev.db"')
  console.log('par:')
  console.log('DATABASE_URL="postgresql://chantierpro_user:your_password@localhost:5432/chantierpro"')
  console.log('')
  console.log('ÉTAPE 4 - Migrer le schéma:')
  console.log('npx prisma migrate dev --name init-postgresql')
  console.log('')
  console.log('ÉTAPE 5 - Générer le client Prisma:')
  console.log('npx prisma generate')
  console.log('')
  console.log('ÉTAPE 6 - (Optionnel) Migrer les données existantes:')
  console.log('Pour conserver vos données, utilisez un outil comme:')
  console.log('- pgloader pour la migration automatique')
  console.log('- Export/Import manuel via Prisma Studio')
  console.log('')
  console.log('🎯 AVANTAGES PostgreSQL:')
  console.log('✅ Meilleure performance sur de gros volumes')
  console.log('✅ Support des transactions complexes')
  console.log('✅ Requêtes parallèles optimisées')
  console.log('✅ Backup et réplication intégrés')
  console.log('✅ Extensions GIS pour géolocalisation')
  console.log('✅ Compatible avec tous les hébergeurs cloud')
  console.log('')
  
  console.log('🔧 Configuration recommandée pour la production:')
  console.log('📝 postgresql.conf:')
  console.log('shared_buffers = 256MB')
  console.log('effective_cache_size = 1GB')
  console.log('work_mem = 4MB')
  console.log('maintenance_work_mem = 64MB')
  console.log('checkpoint_completion_target = 0.9')
  console.log('wal_buffers = 16MB')
  console.log('max_connections = 100')
  console.log('')
  
  console.log('📊 Création d\'un script de backup automatique...')
  createBackupScript()
  
  console.log('✅ Migration préparée! Suivez les étapes ci-dessus.')
}

function createBackupScript() {
  const backupScript = `#!/bin/bash

# Script de backup automatique PostgreSQL - ChantierPro
# Usage: ./backup-db.sh

DB_NAME="chantierpro"
DB_USER="chantierpro_user"
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# Créer le dossier de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

# Créer le backup
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/chantierpro_backup_$DATE.sql

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "chantierpro_backup_*.sql" -type f -mtime +7 -delete

echo "✅ Backup créé: $BACKUP_DIR/chantierpro_backup_$DATE.sql"
`
  
  fs.writeFileSync(path.join(__dirname, '..', 'backup-db.sh'), backupScript)
  
  // Rendre le script exécutable
  const { execSync } = require('child_process')
  try {
    execSync('chmod +x backup-db.sh', { cwd: path.join(__dirname, '..') })
    console.log('✅ Script de backup créé: backup-db.sh')
  } catch (error) {
    console.log('⚠️ Script de backup créé mais non exécutable')
  }
}

migrateToPostgreSQL().catch(console.error)
`