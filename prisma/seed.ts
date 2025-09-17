import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Créer un utilisateur admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chantierpro.fr' },
    update: {},
    create: {
      email: 'admin@chantierpro.fr',
      name: 'Admin ChantierPro',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+33 1 23 45 67 89',
      company: 'ChantierPro SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
      typeClient: 'PROFESSIONNEL',
      secteurActivite: 'BTP - Construction générale',
      effectif: '10-50',
      chiffreAffaires: 2500000.0,
      codePostal: '75001',
      ville: 'Paris',
      pays: 'France'
    },
  });

  // Créer un commercial
  const commercial = await prisma.user.upsert({
    where: { email: 'commercial@chantierpro.fr' },
    update: {},
    create: {
      email: 'commercial@chantierpro.fr',
      name: 'Jean Dupont',
      password: await bcrypt.hash('commercial123', 10),
      role: 'COMMERCIAL',
      phone: '+33 1 23 45 67 90',
      company: 'ChantierPro SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
      typeClient: 'PROFESSIONNEL',
      secteurActivite: 'Commercial BTP',
      codePostal: '75001',
      ville: 'Paris',
      pays: 'France'
    },
  });

  // Créer un deuxième commercial
  const commercial2 = await prisma.user.upsert({
    where: { email: 'sophie.bernard@chantierpro.fr' },
    update: {},
    create: {
      email: 'sophie.bernard@chantierpro.fr',
      name: 'Sophie Bernard',
      password: await bcrypt.hash('commercial123', 10),
      role: 'COMMERCIAL',
      phone: '+33 1 23 45 67 92',
      company: 'ChantierPro SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
      typeClient: 'PROFESSIONNEL',
      secteurActivite: 'Commercial BTP',
      codePostal: '75001',
      ville: 'Paris',
      pays: 'France'
    },
  });

  // Créer quelques ouvriers
  const ouvrier1 = await prisma.user.upsert({
    where: { email: 'michel.roux@chantierpro.fr' },
    update: {},
    create: {
      email: 'michel.roux@chantierpro.fr',
      name: 'Michel Roux',
      password: await bcrypt.hash('ouvrier123', 10),
      role: 'OUVRIER',
      phone: '+33 1 23 45 67 93',
      company: 'ChantierPro SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
      typeClient: 'PROFESSIONNEL',
      secteurActivite: 'Maçonnerie',
      codePostal: '75001',
      ville: 'Paris',
      pays: 'France'
    },
  });

  const ouvrier2 = await prisma.user.upsert({
    where: { email: 'alain.moreau@chantierpro.fr' },
    update: {},
    create: {
      email: 'alain.moreau@chantierpro.fr',
      name: 'Alain Moreau',
      password: await bcrypt.hash('ouvrier123', 10),
      role: 'OUVRIER',
      phone: '+33 1 23 45 67 94',
      company: 'ChantierPro SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
      typeClient: 'PROFESSIONNEL',
      secteurActivite: 'Électricité',
      codePostal: '75001',
      ville: 'Paris',
      pays: 'France'
    },
  });

  // Créer quelques clients
  const client1 = await prisma.user.upsert({
    where: { email: 'marie.dubois@email.fr' },
    update: {},
    create: {
      email: 'marie.dubois@email.fr',
      name: 'Marie Dubois',
      password: await bcrypt.hash('client123', 10),
      role: 'CLIENT',
      phone: '+33 1 23 45 67 91',
      company: 'Dubois Immobilier',
      address: '15 Avenue des Pins, 06400 Cannes',
      typeClient: 'PROFESSIONNEL',
      secteurActivite: 'Immobilier',
      codePostal: '06400',
      ville: 'Cannes',
      pays: 'France',
      commercialId: commercial.id
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'pierre.martin@email.fr' },
    update: {},
    create: {
      email: 'pierre.martin@email.fr',
      name: 'Pierre Martin',
      password: await bcrypt.hash('client123', 10),
      role: 'CLIENT',
      phone: '+33 4 56 78 90 12',
      address: 'Lot 12 Les Jardins Verts, 34000 Montpellier',
      typeClient: 'PARTICULIER',
      codePostal: '34000',
      ville: 'Montpellier',
      pays: 'France',
      commercialId: commercial.id
    },
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'jean.durand@email.fr' },
    update: {},
    create: {
      email: 'jean.durand@email.fr',
      name: 'Jean Durand',
      password: await bcrypt.hash('client123', 10),
      role: 'CLIENT',
      phone: '+33 2 34 56 78 90',
      company: 'Durand Construction',
      address: '45 Rue de la Paix, 69000 Lyon',
      typeClient: 'PROFESSIONNEL',
      secteurActivite: 'Construction',
      codePostal: '69000',
      ville: 'Lyon',
      pays: 'France',
      commercialId: commercial2.id
    },
  });

  const client4 = await prisma.user.upsert({
    where: { email: 'sarah.lefebvre@email.fr' },
    update: {},
    create: {
      email: 'sarah.lefebvre@email.fr',
      name: 'Sarah Lefebvre',
      password: await bcrypt.hash('client123', 10),
      role: 'CLIENT',
      phone: '+33 3 45 67 89 01',
      address: '78 Boulevard des Roses, 13000 Marseille',
      typeClient: 'PARTICULIER',
      codePostal: '13000',
      ville: 'Marseille',
      pays: 'France',
      commercialId: commercial2.id
    },
  });

  // Créer quelques chantiers
  const chantier1 = await prisma.chantier.create({
    data: {
      nom: 'Rénovation Villa Moderne',
      description: 'Rénovation complète d\'une villa de 200m² avec extension moderne et piscine',
      adresse: '15 Avenue des Pins, 06400 Cannes',
      clientId: client1.id,
      statut: 'EN_COURS',
      progression: 65,
      dateDebut: new Date('2024-03-15'),
      dateFin: new Date('2024-08-30'),
      budget: 120000,
      superficie: '200m²',
      photo: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
      lat: 43.5528,
      lng: 7.0174
    },
  });

  const chantier2 = await prisma.chantier.create({
    data: {
      nom: 'Construction Maison Écologique',
      description: 'Construction d\'une maison BBC avec matériaux biosourcés et panneaux solaires',
      adresse: 'Lot 12 Les Jardins Verts, 34000 Montpellier',
      clientId: client2.id,
      statut: 'PLANIFIE',
      progression: 0,
      dateDebut: new Date('2024-05-01'),
      dateFin: new Date('2024-12-15'),
      budget: 280000,
      superficie: '150m²',
      photo: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
      lat: 43.6047,
      lng: 3.8767
    },
  });

  const chantier3 = await prisma.chantier.create({
    data: {
      nom: 'Extension Bureaux Entreprise',
      description: 'Extension de 300m² pour bureaux avec parking souterrain',
      adresse: '45 Rue de la Paix, 69000 Lyon',
      clientId: client3.id,
      statut: 'EN_COURS',
      progression: 40,
      dateDebut: new Date('2024-02-01'),
      dateFin: new Date('2024-09-30'),
      budget: 450000,
      superficie: '300m²',
      photo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
      lat: 45.7640,
      lng: 4.8357
    },
  });

  const chantier4 = await prisma.chantier.create({
    data: {
      nom: 'Rénovation Appartement Familial',
      description: 'Rénovation complète d\'un appartement de 120m² avec cuisine ouverte',
      adresse: '78 Boulevard des Roses, 13000 Marseille',
      clientId: client4.id,
      statut: 'TERMINE',
      progression: 100,
      dateDebut: new Date('2023-10-01'),
      dateFin: new Date('2024-01-15'),
      budget: 85000,
      superficie: '120m²',
      photo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
      lat: 43.2965,
      lng: 5.3698
    },
  });

  // Créer quelques devis
  const devis1 = await prisma.devis.create({
    data: {
      numero: 'DEV-2024-001',
      chantierId: chantier1.id,
      clientId: client1.id,
      type: 'DEVIS',
      objet: 'Rénovation villa - Phase 1',
      montant: 65000,
      totalHT: 65000,
      totalTVA: 13000,
      totalTTC: 78000,
      tva: 20.0,
      statut: 'ENVOYE',
      dateEcheance: new Date('2024-04-15'),
      notes: 'Devis pour la première phase de rénovation incluant la démolition et la reconstruction',
      conditionsVente: 'Paiement 30% à la commande, 40% à la livraison, 30% à 30 jours',
      modalitesPaiement: 'Virement bancaire ou chèque'
    },
  });

  const devis2 = await prisma.devis.create({
    data: {
      numero: 'DEV-2024-002',
      chantierId: chantier2.id,
      clientId: client2.id,
      type: 'DEVIS',
      objet: 'Construction maison écologique',
      montant: 280000,
      totalHT: 280000,
      totalTVA: 56000,
      totalTTC: 336000,
      tva: 20.0,
      statut: 'ACCEPTE',
      dateEcheance: new Date('2024-06-01'),
      notes: 'Devis pour construction complète avec matériaux biosourcés',
      conditionsVente: 'Paiement échelonné selon avancement',
      modalitesPaiement: 'Virement bancaire'
    },
  });

  const devis3 = await prisma.devis.create({
    data: {
      numero: 'DEV-2024-003',
      chantierId: chantier3.id,
      clientId: client3.id,
      type: 'FACTURE',
      objet: 'Extension bureaux - Tranche 1',
      montant: 150000,
      totalHT: 150000,
      totalTVA: 30000,
      totalTTC: 180000,
      tva: 20.0,
      statut: 'PAYE',
      dateEcheance: new Date('2024-03-15'),
      notes: 'Première tranche de l\'extension bureaux',
      conditionsVente: 'Paiement à 30 jours',
      modalitesPaiement: 'Virement bancaire'
    },
  });

  // Créer quelques lignes de devis
  await prisma.ligneDevis.createMany({
    data: [
      {
        devisId: devis1.id,
        description: 'Démolition cloisons existantes',
        quantite: 25,
        prixUnit: 45,
        total: 1125,
        ordre: 1
      },
      {
        devisId: devis1.id,
        description: 'Reconstruction murs porteurs',
        quantite: 15,
        prixUnit: 120,
        total: 1800,
        ordre: 2
      },
      {
        devisId: devis1.id,
        description: 'Pose carrelage premium',
        quantite: 50,
        prixUnit: 85,
        total: 4250,
        ordre: 3
      }
    ]
  });

  // Créer quelques étapes pour les chantiers
  await prisma.etapeChantier.createMany({
    data: [
      {
        titre: 'Préparation du chantier',
        description: 'Installation des protections et préparation de la zone de travail',
        dateDebut: new Date('2024-03-15'),
        dateFin: new Date('2024-03-20'),
        statut: 'TERMINE',
        ordre: 1,
        chantierId: chantier1.id,
        createdById: admin.id
      },
      {
        titre: 'Démolition',
        description: 'Démolition des cloisons existantes selon les plans',
        dateDebut: new Date('2024-03-21'),
        dateFin: new Date('2024-04-05'),
        statut: 'EN_COURS',
        ordre: 2,
        chantierId: chantier1.id,
        createdById: admin.id
      },
      {
        titre: 'Reconstruction',
        description: 'Construction des nouveaux murs et cloisons',
        dateDebut: new Date('2024-04-06'),
        dateFin: new Date('2024-05-15'),
        statut: 'A_FAIRE',
        ordre: 3,
        chantierId: chantier1.id,
        createdById: admin.id
      }
    ]
  });

  // Ajouter quelques prix à la bibliothèque
  await prisma.bibliothequePrix.createMany({
    data: [
      {
        code: 'MAC-001',
        designation: 'Maçonnerie - Mur béton banché 20cm',
        unite: 'm²',
        prixHT: 120.0,
        corpsEtat: 'Gros œuvre',
        region: 'Île-de-France'
      },
      {
        code: 'CAR-001', 
        designation: 'Carrelage grès cérame 60x60',
        unite: 'm²',
        prixHT: 85.0,
        corpsEtat: 'Revêtements sols',
        region: 'France'
      },
      {
        code: 'PLO-001',
        designation: 'Plomberie - Installation WC suspendu',
        unite: 'u',
        prixHT: 350.0,
        corpsEtat: 'Plomberie',
        region: 'France'
      }
    ]
  });

  console.log('✅ Database seeded successfully');
  console.log('\n🔐 COMPTES DE TEST CRÉÉS :');
  console.log(`👤 ADMIN: admin@chantierpro.fr / admin123`);
  console.log(`👨‍💼 COMMERCIAL 1: commercial@chantierpro.fr / commercial123`);
  console.log(`👩‍💼 COMMERCIAL 2: sophie.bernard@chantierpro.fr / commercial123`);
  console.log(`👷‍♂️ OUVRIER 1: michel.roux@chantierpro.fr / ouvrier123`);
  console.log(`👷‍♂️ OUVRIER 2: alain.moreau@chantierpro.fr / ouvrier123`);
  console.log(`👥 CLIENT 1: marie.dubois@email.fr / client123`);
  console.log(`👥 CLIENT 2: pierre.martin@email.fr / client123`);
  console.log(`👥 CLIENT 3: jean.durand@email.fr / client123`);
  console.log(`👥 CLIENT 4: sarah.lefebvre@email.fr / client123`);
  console.log(`\n🏗️ DONNÉES CRÉÉES :`);
  console.log(`- ${4} chantiers avec différents statuts`);
  console.log(`- ${3} devis/factures`);
  console.log(`- ${3} lignes de devis`);
  console.log(`- ${3} étapes de chantier`);
  console.log(`- ${3} prix dans la bibliothèque`);
  console.log(`\n🎯 PRÊT POUR LES TESTS !`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });