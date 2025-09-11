const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createDemoUsers() {
  try {
    console.log('Création des utilisateurs de démonstration...');

    // Hasher les mots de passe
    const adminPassword = await bcrypt.hash('admin123', 10);
    const commercialPassword = await bcrypt.hash('commercial123', 10);

    // Créer l'utilisateur admin
    await prisma.user.upsert({
      where: { email: 'admin@chantierpro.fr' },
      update: {},
      create: {
        email: 'admin@chantierpro.fr',
        name: 'Admin ChantierPro',
        password: adminPassword,
        role: 'ADMIN',
        company: 'ChantierPro',
        phone: '01 23 45 67 89',
      },
    });

    // Créer l'utilisateur commercial
    await prisma.user.upsert({
      where: { email: 'commercial@chantierpro.fr' },
      update: {},
      create: {
        email: 'commercial@chantierpro.fr',
        name: 'Commercial ChantierPro',
        password: commercialPassword,
        role: 'COMMERCIAL',
        company: 'ChantierPro',
        phone: '01 23 45 67 90',
      },
    });

    // Créer un client de test
    await prisma.user.upsert({
      where: { email: 'client@chantierpro.fr' },
      update: {},
      create: {
        email: 'client@chantierpro.fr',
        name: 'Client Test',
        password: await bcrypt.hash('client123', 10),
        role: 'CLIENT',
        company: 'Client SARL',
        phone: '01 23 45 67 91',
        typeClient: 'PROFESSIONNEL',
      },
    });

    console.log('✅ Utilisateurs créés avec succès !');
    console.log('👤 admin@chantierpro.fr / admin123');
    console.log('👤 commercial@chantierpro.fr / commercial123');
    console.log('👤 client@chantierpro.fr / client123');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();