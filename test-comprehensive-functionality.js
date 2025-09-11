/**
 * Test complet des fonctionnalités ChantierPro
 * Ce script teste toutes les API principales du système
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🔍 AUDIT COMPLET - ChantierPro');
  console.log('====================================\n');

  let testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test helper function
  async function test(name, testFn) {
    try {
      console.log(`Testing: ${name}...`);
      await testFn();
      console.log(`✅ ${name} - PASSED\n`);
      testResults.passed++;
    } catch (error) {
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
      testResults.failed++;
      testResults.errors.push({ name, error: error.message });
    }
  }

  // Test API endpoints
  await test('GET /api/chantiers', async () => {
    const response = await fetch(`${BASE_URL}/api/chantiers`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.chantiers) throw new Error('Missing chantiers field');
  });

  await test('GET /api/users', async () => {
    const response = await fetch(`${BASE_URL}/api/users`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.users) throw new Error('Missing users field');
  });

  await test('GET /api/planning', async () => {
    const response = await fetch(`${BASE_URL}/api/planning`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.plannings) throw new Error('Missing plannings field');
  });

  await test('GET /api/devis', async () => {
    const response = await fetch(`${BASE_URL}/api/devis`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
  });

  await test('GET /api/users?role=CLIENT', async () => {
    const response = await fetch(`${BASE_URL}/api/users?role=CLIENT`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.users) throw new Error('Missing users field');
  });

  await test('GET /api/users?role=COMMERCIAL', async () => {
    const response = await fetch(`${BASE_URL}/api/users?role=COMMERCIAL`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.users) throw new Error('Missing users field');
  });

  await test('GET /api/chantiers?page=1&limit=5', async () => {
    const response = await fetch(`${BASE_URL}/api/chantiers?page=1&limit=5`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.pagination) throw new Error('Missing pagination field');
  });

  await test('GET /api/opportunites', async () => {
    const response = await fetch(`${BASE_URL}/api/opportunites?limit=100`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  });

  // Test pages principales
  await test('GET / (Page d\'accueil)', async () => {
    const response = await fetch(`${BASE_URL}/`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  });

  await test('GET /dashboard (Dashboard principal)', async () => {
    const response = await fetch(`${BASE_URL}/dashboard`);
    if (response.status === 307 || response.status === 200) {
      // OK - redirection vers login ou accès OK
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  });

  await test('GET /dashboard/chantiers (Gestion chantiers)', async () => {
    const response = await fetch(`${BASE_URL}/dashboard/chantiers`);
    if (response.status === 307 || response.status === 200) {
      // OK - redirection vers login ou accès OK
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  });

  await test('GET /dashboard/crm (CRM)', async () => {
    const response = await fetch(`${BASE_URL}/dashboard/crm`);
    if (response.status === 307 || response.status === 200) {
      // OK - redirection vers login ou accès OK
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  });

  await test('GET /dashboard/planning (Planning)', async () => {
    const response = await fetch(`${BASE_URL}/dashboard/planning`);
    if (response.status === 307 || response.status === 200) {
      // OK - redirection vers login ou accès OK
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  });

  await test('GET /dashboard/devis (Devis)', async () => {
    const response = await fetch(`${BASE_URL}/dashboard/devis`);
    if (response.status === 307 || response.status === 200) {
      // OK - redirection vers login ou accès OK
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  });

  await test('GET /dashboard/planning/nouveau (Nouveau planning)', async () => {
    const response = await fetch(`${BASE_URL}/dashboard/planning/nouveau`);
    if (response.status === 307 || response.status === 200) {
      // OK - redirection vers login ou accès OK
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  });

  // Rapport final
  console.log('====================================');
  console.log('📊 RAPPORT FINAL');
  console.log('====================================');
  console.log(`✅ Tests réussis: ${testResults.passed}`);
  console.log(`❌ Tests échoués: ${testResults.failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%\n`);

  if (testResults.errors.length > 0) {
    console.log('🔥 ERREURS DÉTAILLÉES:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.name}: ${error.error}`);
    });
    console.log('');
  }

  if (testResults.failed === 0) {
    console.log('🎉 Toutes les fonctionnalités principales fonctionnent correctement !');
  } else {
    console.log('⚠️  Certaines fonctionnalités nécessitent des corrections.');
  }

  console.log('====================================\n');

  return testResults;
}

// Exécuter les tests
runTests().catch(console.error);