const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔄 Création des utilisateurs de test...');

    // Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Administrateur Système',
        email: 'admin@chantierpro.com',
        password: adminPassword,
        role: 'ADMIN',
        phone: '01 23 45 67 89',
        company: 'ChantierPro SARL'
      }
    });

    // Commercial
    const commercialPassword = await bcrypt.hash('commercial123', 10);
    const commercial = await prisma.user.create({
      data: {
        name: 'Jean Dupont',
        email: 'jean.dupont@chantierpro.com',
        password: commercialPassword,
        role: 'COMMERCIAL',
        phone: '01 23 45 67 88',
        company: 'ChantierPro SARL'
      }
    });

    // Ouvrier
    const ouvrierPassword = await bcrypt.hash('ouvrier123', 10);
    const ouvrier = await prisma.user.create({
      data: {
        name: 'Pierre Martin',
        email: 'pierre.martin@chantierpro.com',
        password: ouvrierPassword,
        role: 'OUVRIER',
        phone: '01 23 45 67 87',
        company: 'ChantierPro SARL'
      }
    });

    // Clients
    const client1Password = await bcrypt.hash('client123', 10);
    const client1 = await prisma.user.create({
      data: {
        name: 'Marie Dubois',
        email: 'marie.dubois@gmail.com',
        password: client1Password,
        role: 'CLIENT',
        typeClient: 'PARTICULIER',
        phone: '06 12 34 56 78',
        address: '15 rue de la Paix',
        ville: 'Paris',
        codePostal: '75001',
        pays: 'France',
        commercialId: commercial.id
      }
    });

    const client2 = await prisma.user.create({
      data: {
        name: 'Société ACME',
        email: 'contact@acme.fr',
        password: client1Password,
        role: 'CLIENT',
        typeClient: 'PROFESSIONNEL',
        phone: '01 45 67 89 12',
        company: 'ACME Construction',
        address: '123 avenue des Affaires',
        ville: 'Lyon',
        codePostal: '69000',
        pays: 'France',
        chiffreAffaires: 500000,
        commercialId: commercial.id
      }
    });

    // Chantiers
    const chantier1 = await prisma.chantier.create({
      data: {
        nom: 'Rénovation Villa Dubois',
        description: 'Rénovation complète d\'une villa familiale avec extension',
        adresse: '15 rue de la Paix, 75001 Paris',
        clientId: client1.id,
        dateDebut: new Date('2025-01-15'),
        dateFin: new Date('2025-06-30'),
        budget: 85000,
        superficie: '150m²',
        statut: 'PLANIFIE',
        progression: 0
      }
    });

    const chantier2 = await prisma.chantier.create({
      data: {
        nom: 'Bureaux ACME - Aménagement',
        description: 'Aménagement de bureaux modernes avec open space',
        adresse: '123 avenue des Affaires, 69000 Lyon',
        clientId: client2.id,
        dateDebut: new Date('2025-02-01'),
        dateFin: new Date('2025-05-15'),
        budget: 120000,
        superficie: '300m²',
        statut: 'EN_COURS',
        progression: 25
      }
    });

    // Assignation des ouvriers aux chantiers
    await prisma.chantier.update({
      where: { id: chantier1.id },
      data: {
        assignees: {
          connect: [{ id: ouvrier.id }]
        }
      }
    });

    await prisma.chantier.update({
      where: { id: chantier2.id },
      data: {
        assignees: {
          connect: [{ id: ouvrier.id }]
        }
      }
    });

    // Planning
    await prisma.planning.create({
      data: {
        titre: 'Réunion de lancement - Villa Dubois',
        description: 'Premier rendez-vous avec le client pour définir les détails',
        type: 'REUNION',
        dateDebut: new Date('2025-01-10T10:00:00'),
        dateFin: new Date('2025-01-10T12:00:00'),
        chantierId: chantier1.id,
        organisateurId: commercial.id,
        lieu: 'Sur site - 15 rue de la Paix',
        participants: {
          connect: [{ id: client1.id }, { id: ouvrier.id }]
        }
      }
    });

    console.log('✅ Utilisateurs et données de test créés avec succès !');
    console.log('📋 Comptes créés :');
    console.log(`  Admin: admin@chantierpro.com / admin123`);
    console.log(`  Commercial: jean.dupont@chantierpro.com / commercial123`);
    console.log(`  Ouvrier: pierre.martin@chantierpro.com / ouvrier123`);
    console.log(`  Client 1: marie.dubois@gmail.com / client123`);
    console.log(`  Client 2: contact@acme.fr / client123`);

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();