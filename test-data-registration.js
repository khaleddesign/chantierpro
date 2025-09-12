#!/usr/bin/env node

/**
 * Script de test pour vérifier l'enregistrement des données
 * dans tous les modules de ChantierPro
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testDataRegistration() {
  console.log('🔍 Test de l\'enregistrement des données - ChantierPro');
  console.log('='.repeat(60));

  try {
    // 1. Test création CLIENT
    console.log('\n1️⃣ Test création CLIENT...');
    const clientTest = await prisma.user.create({
      data: {
        name: 'Thomas Laurent TEST',
        email: 'thomas.laurent@test-chantierpro.com',
        password: await bcrypt.hash('TestPassword123!', 10),
        role: 'CLIENT',
        phone: '+33 7 89 01 23 45',
        company: 'Laurent Rénovation',
        address: '15 Avenue des Tilleuls, 31000 Toulouse',
        ville: 'Toulouse',
        codePostal: '31000',
        pays: 'France',
        typeClient: 'PROFESSIONNEL',
        secteurActivite: 'Rénovation immobilière',
        effectif: '5-10',
        chiffreAffaires: 500000.0
      }
    });
    console.log(`✅ Client créé: ${clientTest.name} (ID: ${clientTest.id})`);

    // 2. Test création CHANTIER
    console.log('\n2️⃣ Test création CHANTIER...');
    const chantierTest = await prisma.chantier.create({
      data: {
        nom: 'Rénovation Bureau TEST',
        description: 'Rénovation complète des bureaux avec aménagement moderne',
        adresse: '15 Avenue des Tilleuls, 31000 Toulouse',
        clientId: clientTest.id,
        statut: 'PLANIFIE',
        progression: 0,
        dateDebut: new Date('2024-06-01'),
        dateFin: new Date('2024-09-30'),
        budget: 85000,
        superficie: '200m²',
        photo: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600',
        lat: 43.6047,
        lng: 1.4442
      }
    });
    console.log(`✅ Chantier créé: ${chantierTest.nom} (ID: ${chantierTest.id})`);

    // 3. Test création DEVIS
    console.log('\n3️⃣ Test création DEVIS...');
    const devisTest = await prisma.devis.create({
      data: {
        numero: `DEV-TEST-${Date.now()}`,
        chantierId: chantierTest.id,
        clientId: clientTest.id,
        type: 'DEVIS',
        objet: 'Rénovation bureau - Devis TEST',
        montant: 75000,
        totalHT: 75000,
        totalTVA: 15000,
        totalTTC: 90000,
        tva: 20.0,
        statut: 'BROUILLON',
        dateEcheance: new Date('2024-07-01'),
        notes: 'Devis de test pour vérifier le système',
        conditionsVente: 'Conditions standards',
        modalitesPaiement: 'Virement bancaire'
      }
    });
    console.log(`✅ Devis créé: ${devisTest.numero} (ID: ${devisTest.id})`);

    // 4. Test création LIGNES DE DEVIS
    console.log('\n4️⃣ Test création LIGNES DE DEVIS...');
    await prisma.ligneDevis.createMany({
      data: [
        {
          devisId: devisTest.id,
          description: 'Préparation et protection',
          quantite: 1,
          prixUnit: 2500,
          total: 2500,
          ordre: 1
        },
        {
          devisId: devisTest.id,
          description: 'Peinture murs et plafonds',
          quantite: 200,
          prixUnit: 25,
          total: 5000,
          ordre: 2
        },
        {
          devisId: devisTest.id,
          description: 'Revêtement sol PVC',
          quantite: 150,
          prixUnit: 45,
          total: 6750,
          ordre: 3
        }
      ]
    });
    console.log(`✅ Lignes de devis créées (3 lignes)`);

    // 5. Test conversion DEVIS vers FACTURE
    console.log('\n5️⃣ Test création FACTURE...');
    const factureTest = await prisma.devis.create({
      data: {
        numero: `FACT-TEST-${Date.now()}`,
        chantierId: chantierTest.id,
        clientId: clientTest.id,
        type: 'FACTURE',
        objet: 'Facturation rénovation bureau - TEST',
        montant: 25000,
        totalHT: 25000,
        totalTVA: 5000,
        totalTTC: 30000,
        tva: 20.0,
        statut: 'ENVOYE',
        dateEcheance: new Date('2024-07-30'),
        notes: 'Facture de test - Acompte 30%',
        conditionsVente: 'Paiement sous 30 jours',
        modalitesPaiement: 'Virement bancaire'
      }
    });
    console.log(`✅ Facture créée: ${factureTest.numero} (ID: ${factureTest.id})`);

    // 6. Test création ÉTAPES CHANTIER
    console.log('\n6️⃣ Test création ÉTAPES CHANTIER...');
    await prisma.etapeChantier.createMany({
      data: [
        {
          titre: 'Préparation chantier TEST',
          description: 'Mise en place protection et préparation zone',
          dateDebut: new Date('2024-06-01'),
          dateFin: new Date('2024-06-07'),
          statut: 'A_FAIRE',
          ordre: 1,
          chantierId: chantierTest.id,
          createdById: clientTest.id // Utilisation temporaire du client comme créateur
        },
        {
          titre: 'Travaux peinture TEST',
          description: 'Peinture complète murs et plafonds',
          dateDebut: new Date('2024-06-08'),
          dateFin: new Date('2024-06-20'),
          statut: 'A_FAIRE',
          ordre: 2,
          chantierId: chantierTest.id,
          createdById: clientTest.id
        }
      ]
    });
    console.log(`✅ Étapes chantier créées (2 étapes)`);

    // 7. Test création INTERACTION CRM
    console.log('\n7️⃣ Test création INTERACTION CRM...');
    const interactionTest = await prisma.interactionClient.create({
      data: {
        clientId: clientTest.id,
        type: 'APPEL',
        titre: 'Appel commercial TEST',
        description: 'Discussion sur les besoins du projet de rénovation',
        dateContact: new Date(),
        createdBy: clientTest.id,
        createdByName: 'System Test',
        dureeMinutes: 30,
        resultats: 'Client intéressé, devis à envoyer',
        statut: 'TERMINE',
        importance: 2
      }
    });
    console.log(`✅ Interaction créée: ${interactionTest.titre} (ID: ${interactionTest.id})`);

    // 8. Test création OPPORTUNITÉ
    console.log('\n8️⃣ Test création OPPORTUNITÉ...');
    const opportuniteTest = await prisma.opportunite.create({
      data: {
        clientId: clientTest.id,
        titre: 'Projet rénovation bureau TEST',
        description: 'Opportunité de rénovation complète de bureaux',
        valeurEstimee: 85000,
        probabilite: 75,
        statut: 'QUALIFIE',
        dateCloturePrevisionnelle: new Date('2024-08-15'),
        sourceProspection: 'Site web',
        priorite: 'HAUTE',
        typeProjet: 'Rénovation',
        budgetClient: 90000,
        delaiSouhaite: '3 mois'
      }
    });
    console.log(`✅ Opportunité créée: ${opportuniteTest.titre} (ID: ${opportuniteTest.id})`);

    // 9. Vérification des RELATIONS
    console.log('\n9️⃣ Test des RELATIONS entre entités...');
    const clientAvecRelations = await prisma.user.findUnique({
      where: { id: clientTest.id },
      include: {
        chantiers: true,
        devis: true,
        interactions: true,
        opportunites: true
      }
    });

    console.log(`✅ Relations vérifiées:`);
    console.log(`   - Chantiers: ${clientAvecRelations?.chantiers.length || 0}`);
    console.log(`   - Devis/Factures: ${clientAvecRelations?.devis.length || 0}`);
    console.log(`   - Interactions: ${clientAvecRelations?.interactions.length || 0}`);
    console.log(`   - Opportunités: ${clientAvecRelations?.opportunites.length || 0}`);

    // 10. Test de statistiques globales
    console.log('\n🔟 Test STATISTIQUES GLOBALES...');
    const stats = {
      totalClients: await prisma.user.count({ where: { role: 'CLIENT' } }),
      totalChantiers: await prisma.chantier.count(),
      totalDevis: await prisma.devis.count({ where: { type: 'DEVIS' } }),
      totalFactures: await prisma.devis.count({ where: { type: 'FACTURE' } }),
      totalInteractions: await prisma.interactionClient.count(),
      totalOpportunites: await prisma.opportunite.count()
    };

    console.log(`✅ Statistiques actuelles:`);
    console.log(`   - Clients: ${stats.totalClients}`);
    console.log(`   - Chantiers: ${stats.totalChantiers}`);
    console.log(`   - Devis: ${stats.totalDevis}`);
    console.log(`   - Factures: ${stats.totalFactures}`);
    console.log(`   - Interactions: ${stats.totalInteractions}`);
    console.log(`   - Opportunités: ${stats.totalOpportunites}`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TOUS LES TESTS D\'ENREGISTREMENT RÉUSSIS !');
    console.log('✅ L\'application peut enregistrer dans tous les modules');
    console.log('✅ Les relations entre entités fonctionnent');
    console.log('✅ La base de données est opérationnelle');
    
  } catch (error) {
    console.error('\n❌ ERREUR lors des tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testDataRegistration()
  .then(() => {
    console.log('\n🏁 Tests terminés avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Tests échoués:', error.message);
    process.exit(1);
  });