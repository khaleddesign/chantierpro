#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

console.log('👤 Création d\'un utilisateur test pour le CRM');
console.log('='.repeat(50));

async function createTestUser() {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@crm.com' }
    });

    if (existingUser) {
      console.log('✅ Utilisateur test existe déjà:');
      console.log(`   → Email: ${existingUser.email}`);
      console.log(`   → Nom: ${existingUser.name}`);
      console.log(`   → Rôle: ${existingUser.role}`);
      return existingUser;
    }

    // Créer nouveau utilisateur test
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const testUser = await prisma.user.create({
      data: {
        name: 'Test CRM User',
        email: 'test@crm.com',
        password: hashedPassword,
        role: 'ADMIN', // ADMIN pour accéder à tout
        company: 'Test Company',
        phone: '+33123456789',
        address: '123 rue Test',
        ville: 'Test City',
        codePostal: '75000',
        typeClient: 'PARTICULIER'
      }
    });

    console.log('✅ Utilisateur test créé avec succès:');
    console.log(`   → Email: ${testUser.email}`);
    console.log(`   → Mot de passe: test123`);
    console.log(`   → Nom: ${testUser.name}`);
    console.log(`   → Rôle: ${testUser.role}`);
    
    return testUser;
    
  } catch (error) {
    console.log(`❌ Erreur création utilisateur: ${error.message}`);
    return null;
  }
}

async function showLoginInstructions() {
  console.log('\n🔐 INSTRUCTIONS POUR TESTER LE CRM:');
  console.log('1. Ouvrir http://localhost:3000');
  console.log('2. Cliquer sur "Se connecter"');
  console.log('3. Utiliser les identifiants:');
  console.log('   → Email: test@crm.com');
  console.log('   → Mot de passe: test123');
  console.log('4. Une fois connecté, aller sur /dashboard/crm');
  console.log('5. Vérifier que les données s\'affichent correctement');
  
  console.log('\n📊 DONNÉES ATTENDUES DANS LE CRM:');
  console.log('   → 5 clients actifs');
  console.log('   → 6 prospects estimés');
  console.log('   → 5 devis (102,730€ de pipeline)');
  console.log('   → 3 chantiers signés');
  console.log('   → 60% de taux de conversion');
  
  console.log('\n🎯 TESTS À EFFECTUER:');
  console.log('   ✓ Vérifier affichage des statistiques');
  console.log('   ✓ Tester les liens vers Clients/Devis/Chantiers');
  console.log('   ✓ Vérifier les actions rapides (4 boutons)');
  console.log('   ✓ Contrôler le pipeline commercial (4 étapes)');
  console.log('   ✓ Tester la navigation vers autres sections');
}

// Exécution
createTestUser()
  .then(user => {
    if (user) {
      showLoginInstructions();
    }
  })
  .catch(error => {
    console.error('💥 Erreur:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });