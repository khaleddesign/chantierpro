const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function testAuth() {
  console.log('🔍 DIAGNOSTIC AUTHENTIFICATION NEXTAUTH');
  console.log('=====================================');
  
  // Test 1: Variables d'environnement
  console.log('\n1️⃣ VARIABLES D\'ENVIRONNEMENT:');
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Défini' : '❌ Manquant');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Manquant');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Défini' : '❌ Manquant');
  
  // Test 2: Connexion base de données
  console.log('\n2️⃣ CONNEXION BASE DE DONNÉES:');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Connexion PostgreSQL réussie');
  } catch (error) {
    console.log('❌ Erreur connexion:', error.message);
    return;
  }
  
  // Test 3: Vérification utilisateur admin
  console.log('\n3️⃣ VÉRIFICATION UTILISATEUR ADMIN:');
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@chantierpro.fr' }
    });
    
    if (admin) {
      console.log('✅ Utilisateur admin trouvé');
      console.log('   - ID:', admin.id);
      console.log('   - Nom:', admin.name);
      console.log('   - Rôle:', admin.role);
      console.log('   - Mot de passe hashé:', admin.password ? '✅ Présent' : '❌ Manquant');
      
      // Test 4: Vérification mot de passe
      console.log('\n4️⃣ VÉRIFICATION MOT DE PASSE:');
      if (admin.password) {
        const isValid = await bcrypt.compare('admin123', admin.password);
        console.log('✅ Mot de passe "admin123" valide:', isValid);
      }
    } else {
      console.log('❌ Utilisateur admin non trouvé');
    }
  } catch (error) {
    console.log('❌ Erreur requête utilisateur:', error.message);
  }
  
  // Test 5: Test connexion avec credentials
  console.log('\n5️⃣ TEST CONNEXION CREDENTIALS:');
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@chantierpro.fr' }
    });
    
    if (user && user.password) {
      const isPasswordValid = await bcrypt.compare('admin123', user.password);
      if (isPasswordValid) {
        console.log('✅ Authentification réussie');
        console.log('   - Utilisateur:', user.name);
        console.log('   - Rôle:', user.role);
      } else {
        console.log('❌ Mot de passe invalide');
      }
    } else {
      console.log('❌ Utilisateur ou mot de passe manquant');
    }
  } catch (error) {
    console.log('❌ Erreur test authentification:', error.message);
  }
  
  await prisma.$disconnect();
  console.log('\n🎯 DIAGNOSTIC TERMINÉ');
}

testAuth().catch(console.error);
