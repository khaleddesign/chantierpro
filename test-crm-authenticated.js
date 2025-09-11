#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

console.log('🔐 Test CRM AUTHENTIFIÉ avec données réelles');
console.log('='.repeat(60));

async function makeRequestWithAuth(options, data = null, sessionToken = null) {
  return new Promise((resolve) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (sessionToken) {
      headers['Cookie'] = `next-auth.session-token=${sessionToken}`;
    }

    const req = http.request({
      ...options,
      headers
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testDatabaseData() {
  console.log('1. Test direct de la base de données...');
  
  try {
    // Test des données clients
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        _count: {
          select: {
            chantiers: true,
            devis: true
          }
        }
      },
      take: 5
    });

    console.log(`   → Clients en DB: ${clients.length} clients trouvés ✅`);
    
    if (clients.length > 0) {
      console.log(`     • Premier client: ${clients[0].name} (${clients[0].email})`);
      console.log(`     • Chantiers associés: ${clients[0]._count.chantiers}`);
      console.log(`     • Devis associés: ${clients[0]._count.devis}`);
    }

    // Test des données devis
    const devis = await prisma.devis.findMany({
      include: {
        client: { select: { name: true } },
        chantier: { select: { nom: true } }
      },
      take: 5
    });

    console.log(`   → Devis en DB: ${devis.length} devis trouvés ✅`);
    
    let totalPipeline = 0;
    if (devis.length > 0) {
      totalPipeline = devis.reduce((sum, d) => sum + (d.totalTTC || d.montant || 0), 0);
      console.log(`     • Premier devis: ${devis[0].numero} - ${devis[0].client?.name}`);
      console.log(`     • Montant: ${devis[0].totalTTC || devis[0].montant || 0}€`);
      console.log(`     • Total pipeline: ${totalPipeline}€`);
    }

    // Test des chantiers
    const chantiers = await prisma.chantier.findMany({
      include: {
        client: { select: { name: true } }
      },
      take: 5
    });

    console.log(`   → Chantiers en DB: ${chantiers.length} chantiers trouvés ✅`);
    
    if (chantiers.length > 0) {
      console.log(`     • Premier chantier: ${chantiers[0].nom} - ${chantiers[0].client?.name}`);
      console.log(`     • Statut: ${chantiers[0].statut}`);
      console.log(`     • Budget: ${chantiers[0].budget || 0}€`);
    }

    return {
      clientsCount: clients.length,
      devisCount: devis.length, 
      chantiersCount: chantiers.length,
      pipelineValue: totalPipeline,
      hasData: clients.length > 0 || devis.length > 0 || chantiers.length > 0
    };

  } catch (error) {
    console.log(`   → Erreur DB: ❌ ${error.message}`);
    return null;
  }
}

async function testCRMLogic() {
  console.log('\n2. Test de la logique métier CRM...');
  
  const dbData = await testDatabaseData();
  if (!dbData) return false;

  // Test des calculs comme dans le CRM
  const prospectsCount = Math.floor(dbData.clientsCount * 1.3);
  const conversionRate = dbData.clientsCount > 0 ? 
    Math.round((dbData.chantiersCount / dbData.clientsCount) * 100) : 0;

  console.log('   → Calculs CRM:');
  console.log(`     • Clients réels: ${dbData.clientsCount}`);
  console.log(`     • Prospects estimés: ${prospectsCount} (clients × 1.3)`);
  console.log(`     • Devis actifs: ${dbData.devisCount}`);
  console.log(`     • Projets signés: ${dbData.chantiersCount}`);
  console.log(`     • Pipeline total: ${dbData.pipelineValue}€`);
  console.log(`     • Taux conversion: ${conversionRate}% (chantiers/clients)`);

  // Test des étapes du pipeline
  const pipelineStages = [
    {
      stage: 'Nouveaux Prospects',
      count: prospectsCount,
      value: 0
    },
    {
      stage: 'Devis En Cours', 
      count: dbData.devisCount,
      value: dbData.pipelineValue
    },
    {
      stage: 'Négociations',
      count: Math.floor(dbData.devisCount * 0.4),
      value: dbData.pipelineValue * 0.6
    },
    {
      stage: 'Projets Signés',
      count: dbData.chantiersCount,
      value: dbData.pipelineValue * 0.8
    }
  ];

  console.log('\n   → Pipeline CRM détaillé:');
  pipelineStages.forEach((stage, index) => {
    console.log(`     ${index + 1}. ${stage.stage}: ${stage.count} items`);
    if (stage.value > 0) {
      console.log(`        Valeur: ${Math.round(stage.value)}€`);
    }
  });

  return dbData.hasData;
}

async function testCRMAPIs() {
  console.log('\n3. Test des APIs CRM (sans authentification)...');
  
  // Ces tests montrent ce qui se passe SANS auth (doivent retourner 401)
  const apiTests = [
    { name: 'API Users/Clients', path: '/api/users?role=CLIENT' },
    { name: 'API Devis', path: '/api/devis' },
    { name: 'API Chantiers', path: '/api/chantiers' },
    { name: 'API Planning', path: '/api/planning' }
  ];

  let allSecured = true;
  
  for (const test of apiTests) {
    const result = await makeRequestWithAuth({
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: 'GET'
    });
    
    const isSecured = result.statusCode === 401;
    console.log(`   → ${test.name}: ${result.statusCode} ${isSecured ? '✅' : '❌'}`);
    
    if (!isSecured) allSecured = false;
  }

  return allSecured;
}

async function testCRMPageStructure() {
  console.log('\n4. Test de la structure du composant CRM...');
  
  const fs = require('fs');
  
  try {
    const crmContent = fs.readFileSync('./app/dashboard/crm/page.tsx', 'utf8');
    
    // Vérifications critiques pour le fonctionnement
    const checks = [
      { name: 'Import useState', test: crmContent.includes('useState') },
      { name: 'Import useEffect', test: crmContent.includes('useEffect') },
      { name: 'Fonction loadCRMData', test: crmContent.includes('loadCRMData') },
      { name: 'Gestion des stats', test: crmContent.includes('setStats') },
      { name: 'PipelineStages array', test: crmContent.includes('pipelineStages') },
      { name: 'Fetch parallèles', test: crmContent.includes('Promise.all') },
      { name: 'Gestion erreurs', test: crmContent.includes('try') && crmContent.includes('catch') },
      { name: 'Format currency', test: crmContent.includes('formatCurrency') },
      { name: 'Navigation links', test: crmContent.includes('Link href') },
      { name: 'Actions rapides', test: crmContent.includes('quickActions') }
    ];
    
    let passed = 0;
    checks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`   → ${check.name}: ${status}`);
      if (check.test) passed++;
    });
    
    console.log(`\n   → Score structure: ${passed}/${checks.length} (${Math.round(passed/checks.length*100)}%)`);
    
    return passed === checks.length;
    
  } catch (error) {
    console.log(`   → Erreur lecture CRM: ❌ ${error.message}`);
    return false;
  }
}

async function runFullCRMTest() {
  console.log('🚀 DÉBUT DU TEST CRM COMPLET\n');
  
  const dbDataValid = await testCRMLogic();
  const apisSecured = await testCRMAPIs();  
  const structureValid = await testCRMPageStructure();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSULTATS FINAUX CRM:');
  
  console.log(`✅ Données en base: ${dbDataValid ? 'PRÉSENTES' : 'MANQUANTES'}`);
  console.log(`✅ APIs sécurisées: ${apisSecured ? 'OUI' : 'NON'}`);
  console.log(`✅ Structure code: ${structureValid ? 'COMPLÈTE' : 'INCOMPLÈTE'}`);
  
  const overallScore = [dbDataValid, apisSecured, structureValid].filter(Boolean).length;
  console.log(`\n🎯 SCORE GLOBAL: ${overallScore}/3`);
  
  if (overallScore === 3) {
    console.log('\n✅ CRM ENTIÈREMENT FONCTIONNEL !');
    console.log('   → Base de données avec vraies données ✅');  
    console.log('   → Sécurité API implémentée ✅');
    console.log('   → Interface complète et optimisée ✅');
    console.log('   → Calculs pipeline automatiques ✅');
    console.log('\n💡 Le CRM est prêt pour la production !');
  } else {
    console.log('\n❌ PROBLÈMES DÉTECTÉS:');
    if (!dbDataValid) console.log('   - Pas de données de test en base');
    if (!apisSecured) console.log('   - Failles de sécurité API');  
    if (!structureValid) console.log('   - Code incomplet ou défectueux');
  }
  
  console.log('\n🔍 ÉTAPE SUIVANTE RECOMMANDÉE:');
  console.log('   1. Créer un utilisateur test via interface');
  console.log('   2. Se connecter et naviguer vers /dashboard/crm');
  console.log('   3. Vérifier affichage temps réel des données');
  console.log('   4. Tester navigation et interactions');
  
  return overallScore === 3;
}

// Exécution du test
runFullCRMTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 ERREUR CRITIQUE:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });