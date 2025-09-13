const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🌱 Création des utilisateurs de test...');

    // Hash des mots de passe
    const adminHash = await bcrypt.hash('admin123', 10);
    const commercialHash = await bcrypt.hash('commercial123', 10);
    const clientHash = await bcrypt.hash('client123', 10);

    // Créer ou mettre à jour les utilisateurs de test
    const testUsers = [
      {
        email: 'admin@chantierpro.fr',
        name: 'Administrateur ChantierPro',
        password: adminHash,
        role: 'ADMIN',
        company: 'ChantierPro SAS',
        phone: '+33 1 23 45 67 89'
      },
      {
        email: 'commercial@chantierpro.fr', 
        name: 'Commercial ChantierPro',
        password: commercialHash,
        role: 'COMMERCIAL',
        company: 'ChantierPro SAS',
        phone: '+33 1 23 45 67 90'
      },
      {
        email: 'client@chantierpro.fr',
        name: 'Client Test',
        password: clientHash,
        role: 'CLIENT',
        company: 'Entreprise Client',
        phone: '+33 1 23 45 67 91'
      }
    ];

    for (const userData of testUsers) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: userData.password, // Met à jour le mot de passe
          name: userData.name,
          role: userData.role,
          company: userData.company,
          phone: userData.phone
        },
        create: userData
      });
    }

    console.log('✅ Utilisateurs créés avec succès :');
    console.log('   - admin@chantierpro.fr / admin123 (ADMIN)');
    console.log('   - commercial@chantierpro.fr / commercial123 (COMMERCIAL)');
    console.log('   - client@chantierpro.fr / client123 (CLIENT)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs :', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();