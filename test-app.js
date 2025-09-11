#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3001';

const tests = [
  // Test pages essentielles
  { name: 'Page de connexion', path: '/auth/signin', expectedStatus: 200 },
  { name: 'Page d\'accueil', path: '/', expectedStatus: 307 }, // Redirige vers login
  { name: 'Page CRM (sans auth)', path: '/dashboard/crm', expectedStatus: 307 }, // Redirige vers login
  { name: 'Page chantiers (sans auth)', path: '/dashboard/chantiers', expectedStatus: 307 },
  { name: 'Page devis (sans auth)', path: '/dashboard/devis', expectedStatus: 307 },
  { name: 'Page messages (sans auth)', path: '/dashboard/messages', expectedStatus: 307 },
  { name: 'Page planning (sans auth)', path: '/dashboard/planning', expectedStatus: 307 },
  { name: 'Page documents (sans auth)', path: '/dashboard/documents', expectedStatus: 307 },
  
  // Test des APIs (sans auth - doivent retourner 401)
  { name: 'API Chantiers', path: '/api/chantiers', expectedStatus: 401 },
  { name: 'API Users', path: '/api/users', expectedStatus: 401 },
  { name: 'API Devis', path: '/api/devis', expectedStatus: 401 },
  { name: 'API Messages', path: '/api/messages', expectedStatus: 401 },
  { name: 'API Planning', path: '/api/planning', expectedStatus: 401 },
  
  // Test des ressources statiques
  { name: 'Favicon', path: '/favicon.ico', expectedStatus: 200 }
];

console.log('🧪 Tests de l\'application ChantierPro CRM Optimisé');
console.log('='.repeat(60));

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const req = http.request(`${BASE_URL}${test.path}`, {method: 'GET'}, (res) => {
      const success = res.statusCode === test.expectedStatus;
      resolve({
        ...test,
        actualStatus: res.statusCode,
        success,
        location: res.headers.location
      });
    });

    req.on('error', (error) => {
      resolve({
        ...test,
        success: false,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        ...test,
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  const results = [];
  
  for (const test of tests) {
    process.stdout.write(`Testing ${test.name.padEnd(30)} ... `);
    const result = await testEndpoint(test);
    
    if (result.success) {
      console.log(`✅ ${result.actualStatus}`);
    } else {
      console.log(`❌ Got ${result.actualStatus}, expected ${result.expectedStatus}${result.error ? ` (${result.error})` : ''}`);
      if (result.location) {
        console.log(`   → Redirects to: ${result.location}`);
      }
    }
    
    results.push(result);
  }
  
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  
  console.log(`📊 Résultats: ${passed} passés, ${failed} échoués sur ${results.length} tests`);
  
  if (failed > 0) {
    console.log('\\n❌ Tests échoués:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: got ${r.actualStatus}, expected ${r.expectedStatus}`);
    });
  } else {
    console.log('\\n🎉 Tous les tests sont passés !');
  }
  
  return failed === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});