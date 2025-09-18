const { getServerSession } = require('next-auth/next');
const { authOptions } = require('./lib/auth');

async function testNextAuthSession() {
  console.log('🔍 TEST SESSION NEXTAUTH');
  console.log('========================');

  try {
    // Simuler une requête avec session
    const mockRequest = {
      headers: {
        get: (name) => {
          if (name === 'cookie') {
            // Simuler des cookies NextAuth
            return 'next-auth.session-token=test-token';
          }
          return null;
        }
      }
    };

    console.log('1️⃣ Test getServerSession...');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session) {
      console.log('❌ Aucune session trouvée');
      console.log('🔍 Vérification de la configuration NextAuth...');
      
      // Vérifier les variables d'environnement
      console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Défini' : '❌ Manquant');
      console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL ? '✅ Défini' : '❌ Manquant');
      console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Défini' : '❌ Manquant');
    } else {
      console.log('✅ Session trouvée:', session.user?.email);
    }

  } catch (error) {
    console.log('❌ Erreur test session:', error.message);
  }
}

testNextAuthSession().catch(console.error);
