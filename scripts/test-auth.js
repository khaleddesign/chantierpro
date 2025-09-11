const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Test de l\'authentification...');

    // Rechercher l'utilisateur commercial
    const user = await prisma.user.findUnique({
      where: { email: 'commercial@chantierpro.fr' }
    });

    if (!user) {
      console.log('❌ Utilisateur commercial@chantierpro.fr non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password
    });

    // Tester le mot de passe
    if (user.password) {
      const isValid = await bcrypt.compare('commercial123', user.password);
      console.log('🔐 Test mot de passe commercial123:', isValid ? '✅ VALIDE' : '❌ INVALIDE');
      
      if (!isValid) {
        // Essayons de réinitialiser le mot de passe
        const newPassword = await bcrypt.hash('commercial123', 10);
        await prisma.user.update({
          where: { email: 'commercial@chantierpro.fr' },
          data: { password: newPassword }
        });
        console.log('🔄 Mot de passe réinitialisé');
      }
    }

    // Lister tous les utilisateurs
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        password: true
      }
    });

    console.log('\n📝 Tous les utilisateurs:');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - ${u.password ? 'Mot de passe OK' : 'Pas de mot de passe'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();