const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestWorkers() {
  try {
    console.log('Création des ouvriers de test...');

    const workers = [
      {
        name: 'Jean Dupont',
        email: 'jean.dupont@chantierpro.fr',
        password: 'ouvrier123',
        role: 'OUVRIER',
        phone: '06 12 34 56 78',
        company: 'ChantierPro'
      },
      {
        name: 'Pierre Martin',
        email: 'pierre.martin@chantierpro.fr', 
        password: 'ouvrier123',
        role: 'OUVRIER',
        phone: '06 23 45 67 89',
        company: 'ChantierPro'
      },
      {
        name: 'Marie Dubois',
        email: 'marie.dubois@chantierpro.fr',
        password: 'ouvrier123', 
        role: 'OUVRIER',
        phone: '06 34 56 78 90',
        company: 'ChantierPro'
      },
      {
        name: 'Paul Durand',
        email: 'paul.durand@chantierpro.fr',
        password: 'ouvrier123',
        role: 'OUVRIER', 
        phone: '06 45 67 89 01',
        company: 'ChantierPro'
      }
    ];

    for (const worker of workers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: worker.email }
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(worker.password, 10);
        
        await prisma.user.create({
          data: {
            ...worker,
            password: hashedPassword
          }
        });

        console.log(`✅ Ouvrier créé: ${worker.name} (${worker.email})`);
      } else {
        console.log(`ℹ️ Ouvrier existe déjà: ${worker.name}`);
      }
    }

    console.log('\n🎉 Création des ouvriers de test terminée !');
    console.log('\n📋 Comptes créés :');
    console.log('- jean.dupont@chantierpro.fr / ouvrier123');
    console.log('- pierre.martin@chantierpro.fr / ouvrier123'); 
    console.log('- marie.dubois@chantierpro.fr / ouvrier123');
    console.log('- paul.durand@chantierpro.fr / ouvrier123');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestWorkers();