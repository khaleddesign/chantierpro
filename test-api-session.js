const fetch = require('node-fetch');

async function testAPIsWithSession() {
  console.log('🔍 TEST DES APIS AVEC SESSION AUTHENTIFIÉE');
  console.log('==========================================');

  // Étape 1: Se connecter pour obtenir les cookies de session
  console.log('\n1️⃣ CONNEXION POUR OBTENIR LA SESSION...');
  
  const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'email=admin@chantierpro.fr&password=admin123&csrfToken=test'
  });

  console.log('Status login:', loginResponse.status);
  console.log('Headers login:', Object.fromEntries(loginResponse.headers.entries()));

  // Récupérer les cookies de session
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Cookies reçus:', cookies);

  if (!cookies) {
    console.log('❌ Aucun cookie de session reçu');
    return;
  }

  // Étape 2: Tester l'API users avec les cookies
  console.log('\n2️⃣ TEST API USERS AVEC SESSION...');
  
  const usersResponse = await fetch('http://localhost:3000/api/users', {
    method: 'GET',
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json',
    }
  });

  console.log('Status users:', usersResponse.status);
  const usersData = await usersResponse.text();
  console.log('Response users:', usersData);

  // Étape 3: Tester l'API devis avec les cookies
  console.log('\n3️⃣ TEST API DEVIS AVEC SESSION...');
  
  const devisResponse = await fetch('http://localhost:3000/api/devis', {
    method: 'GET',
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json',
    }
  });

  console.log('Status devis:', devisResponse.status);
  const devisData = await devisResponse.text();
  console.log('Response devis:', devisData);

  // Étape 4: Tester l'API chantiers avec les cookies
  console.log('\n4️⃣ TEST API CHANTIERS AVEC SESSION...');
  
  const chantiersResponse = await fetch('http://localhost:3000/api/chantiers', {
    method: 'GET',
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json',
    }
  });

  console.log('Status chantiers:', chantiersResponse.status);
  const chantiersData = await chantiersResponse.text();
  console.log('Response chantiers:', chantiersData);

  console.log('\n🎯 TESTS TERMINÉS');
}

testAPIsWithSession().catch(console.error);
