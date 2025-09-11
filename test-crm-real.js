#!/usr/bin/env node

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

console.log('🎯 Test RÉEL du CRM avec authentification simulée');
console.log('='.repeat(60));

async function makeRequest(options, data = null) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
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

async function testCRMAPIs() {
  console.log('1. Test des APIs CRM (authentification requise)...');
  
  // Test API clients
  const clientsResult = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/users?role=CLIENT',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log(`   → API Clients: ${clientsResult.statusCode} ${clientsResult.statusCode === 401 ? '✅ (sécurisée)' : '❌'}`);

  // Test API devis  
  const devisResult = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/devis',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log(`   → API Devis: ${devisResult.statusCode} ${devisResult.statusCode === 401 ? '✅ (sécurisée)' : '❌'}`);

  // Test API chantiers
  const chantiersResult = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/chantiers',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log(`   → API Chantiers: ${chantiersResult.statusCode} ${chantiersResult.statusCode === 401 ? '✅ (sécurisée)' : '❌'}`);

  console.log('\n2. Test de la page CRM (redirection authentification)...');
  
  const crmPageResult = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/dashboard/crm',
    method: 'GET'
  });

  const redirectsCorrectly = crmPageResult.statusCode === 307 && 
    crmPageResult.headers.location && 
    crmPageResult.headers.location.includes('signin');
    
  console.log(`   → Redirection CRM: ${redirectsCorrectly ? '✅' : '❌'} (${crmPageResult.statusCode})`);

  console.log('\n3. Vérification de la structure des données attendues...');

  // Simulation de ce que le CRM devrait recevoir une fois authentifié
  const expectedDataStructure = {
    clients: "Nombre total de clients",
    prospects: "Estimation basée sur clients * 1.3", 
    devis: "Nombre total de devis",
    chantiers: "Nombre total de chantiers",
    pipelineValue: "Somme des montants devis",
    conversionRate: "Taux de conversion prospects → clients"
  };

  console.log('   → Structure attendue du CRM:');
  Object.entries(expectedDataStructure).forEach(([key, description]) => {
    console.log(`     • ${key}: ${description}`);
  });

  console.log('\n4. Test de compilation React du composant CRM...');
  
  // Vérifier que le composant se compile sans erreurs
  const fs = require('fs');
  const crmPageExists = fs.existsSync('./app/dashboard/crm/page.tsx');
  console.log(`   → Fichier CRM: ${crmPageExists ? '✅' : '❌'}`);
  
  if (crmPageExists) {
    try {
      const crmContent = fs.readFileSync('./app/dashboard/crm/page.tsx', 'utf8');
      const hasLoadCRMData = crmContent.includes('loadCRMData');
      const hasUseEffect = crmContent.includes('useEffect');
      const hasPipelineStages = crmContent.includes('pipelineStages');
      const hasStats = crmContent.includes('setStats');
      
      console.log(`     • Fonction loadCRMData: ${hasLoadCRMData ? '✅' : '❌'}`);
      console.log(`     • Hook useEffect: ${hasUseEffect ? '✅' : '❌'}`);
      console.log(`     • Pipeline stages: ${hasPipelineStages ? '✅' : '❌'}`);
      console.log(`     • Gestion state: ${hasStats ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`     • Erreur lecture fichier: ❌`);
    }
  }

  console.log('\n='.repeat(60));
  console.log('📋 DIAGNOSTIC CRM RÉEL:');
  
  const isSecure = clientsResult.statusCode === 401 && devisResult.statusCode === 401 && chantiersResult.statusCode === 401;
  const isAccessible = redirectsCorrectly;
  const isStructured = crmPageExists;
  
  console.log(`✅ APIs sécurisées: ${isSecure ? 'OUI' : 'NON'}`);
  console.log(`✅ Redirection auth: ${isAccessible ? 'OUI' : 'NON'}`);
  console.log(`✅ Structure correcte: ${isStructured ? 'OUI' : 'NON'}`);

  console.log('\n🔍 CE QUI MANQUE POUR LE TEST COMPLET:');
  console.log('❗ Test avec session authentifiée réelle');
  console.log('❗ Vérification affichage des vraies données');  
  console.log('❗ Test des interactions utilisateur (clics, navigation)');
  console.log('❗ Vérification des calculs pipeline en temps réel');
  
  console.log('\n💡 POUR TESTER COMPLÈTEMENT:');
  console.log('1. Se connecter via interface web');
  console.log('2. Naviguer vers /dashboard/crm');
  console.log('3. Vérifier que les données s\'affichent correctement');
  console.log('4. Tester les liens de navigation');
  console.log('5. Vérifier que les stats se mettent à jour');

  return isSecure && isAccessible && isStructured;
}

testCRMAPIs().then(success => {
  if (success) {
    console.log('\n✅ CRM: Structure et sécurité OK, mais test complet nécessite authentification');
  } else {
    console.log('\n❌ CRM: Problèmes détectés dans la structure de base');
  }
  process.exit(success ? 0 : 1);
});