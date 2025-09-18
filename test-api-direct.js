const fetch = require('node-fetch');

async function testAPIsWithDirectAuth() {
  console.log('🔍 TEST DES APIS AVEC AUTHENTIFICATION DIRECTE');
  console.log('==============================================');

  // Test 1: API Health (sans auth)
  console.log('\n1️⃣ TEST API HEALTH...');
  try {
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health API:', healthData.status);
  } catch (error) {
    console.log('❌ Health API error:', error.message);
  }

  // Test 2: Test de connexion directe à la base
  console.log('\n2️⃣ TEST CONNEXION BASE DIRECTE...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const userCount = await prisma.user.count();
    console.log('✅ Utilisateurs en base:', userCount);
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@chantierpro.fr' },
      select: { id: true, email: true, role: true }
    });
    
    if (admin) {
      console.log('✅ Admin trouvé:', admin.email, 'Role:', admin.role);
    } else {
      console.log('❌ Admin non trouvé');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Erreur connexion base:', error.message);
  }

  // Test 3: Test création utilisateur directe
  console.log('\n3️⃣ TEST CRÉATION UTILISATEUR DIRECTE...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    // Récupérer l'admin pour l'ID commercial
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@chantierpro.fr' },
      select: { id: true }
    });
    
    const testEmail = `test-${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const newUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: testEmail,
        password: hashedPassword,
        role: 'CLIENT',
        commercialId: admin.id
      }
    });
    
    console.log('✅ Utilisateur créé:', newUser.email, 'ID:', newUser.id);
    
    // Nettoyer
    await prisma.user.delete({ where: { id: newUser.id } });
    console.log('✅ Utilisateur supprimé');
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Erreur création utilisateur:', error.message);
  }

  console.log('\n🎯 TESTS TERMINÉS');
}

testAPIsWithDirectAuth().catch(console.error);
