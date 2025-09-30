// Force Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const startTime = Date.now();
  const results: any = {
    timestamp: new Date().toISOString(),
    success: false,
    tests: {}
  };

  try {
    // Test 1 : Variables d'environnement
    console.log('🔧 Test 1/5 : Variables d\'environnement');
    results.tests.environment = {
      status: 'success',
      data: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length || 0,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    };

    // Test 2 : Cookies
    console.log('🍪 Test 2/5 : Cookies NextAuth');
    try {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      results.tests.cookies = {
        status: 'success',
        data: {
          count: allCookies.length,
          cookieNames: allCookies.map(c => c.name),
          hasSessionToken: allCookies.some(c => c.name.includes('next-auth.session-token')),
          hasSecureSessionToken: allCookies.some(c => c.name.includes('__Secure-next-auth.session-token')),
          sessionTokenLength: allCookies.find(c => c.name.includes('session-token'))?.value?.length || 0
        }
      };
    } catch (cookieError) {
      results.tests.cookies = {
        status: 'error',
        error: String(cookieError)
      };
    }

    // Test 3 : Session NextAuth
    console.log('🔐 Test 3/5 : Session NextAuth');
    try {
      const session = await getServerSession(authOptions);
      results.tests.session = {
        status: session ? 'success' : 'warning',
        data: {
          exists: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          role: session?.user?.role,
          sessionKeys: session ? Object.keys(session) : [],
          userKeys: session?.user ? Object.keys(session.user) : []
        },
        warning: !session ? 'Aucune session détectée - utilisateur non connecté ou session expirée' : undefined
      };
    } catch (sessionError) {
      results.tests.session = {
        status: 'error',
        error: String(sessionError),
        stack: sessionError instanceof Error ? sessionError.stack : undefined
      };
    }

    // Test 4 : Connexion Prisma/Supabase
    console.log('🗄️  Test 4/5 : Connexion base de données Prisma/Supabase');
    try {
      const dbStartTime = Date.now();

      // Test de connexion simple
      await prisma.$connect();
      const connectionTime = Date.now() - dbStartTime;

      // Comptage des entités
      const [userCount, chantierCount, devisCount] = await Promise.all([
        prisma.user.count(),
        prisma.chantier.count(),
        prisma.devis.count()
      ]);

      const queryTime = Date.now() - dbStartTime;

      results.tests.database = {
        status: 'success',
        data: {
          connected: true,
          connectionTime: `${connectionTime}ms`,
          queryTime: `${queryTime}ms`,
          counts: {
            users: userCount,
            chantiers: chantierCount,
            devis: devisCount
          }
        }
      };
    } catch (dbError) {
      results.tests.database = {
        status: 'error',
        error: String(dbError),
        errorCode: (dbError as any).code,
        errorMessage: (dbError as any).message,
        stack: dbError instanceof Error ? dbError.stack : undefined
      };
    }

    // Test 5 : Requête chantiers avec session
    console.log('📋 Test 5/5 : Requête chantiers (simulant l\'API)');
    try {
      const session = await getServerSession(authOptions);

      if (session?.user?.id) {
        const whereClause: any = { deletedAt: null };

        // Filtrage par rôle (comme dans l'API chantiers)
        if (session.user.role === "CLIENT") {
          whereClause.clientId = session.user.id;
        } else if (session.user.role === "COMMERCIAL") {
          whereClause.client = {
            commercialId: session.user.id
          };
        }

        const chantiers = await prisma.chantier.findMany({
          where: whereClause,
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                commercialId: true
              }
            }
          }
        });

        results.tests.chantiersQuery = {
          status: 'success',
          data: {
            userId: session.user.id,
            userRole: session.user.role,
            whereClause: JSON.stringify(whereClause),
            foundCount: chantiers.length,
            firstChantier: chantiers[0] ? {
              id: chantiers[0].id,
              nom: chantiers[0].nom,
              clientId: chantiers[0].clientId,
              clientCommercialId: chantiers[0].client?.commercialId
            } : null
          }
        };
      } else {
        results.tests.chantiersQuery = {
          status: 'skipped',
          reason: 'Aucune session utilisateur - test nécessite une authentification'
        };
      }
    } catch (queryError) {
      results.tests.chantiersQuery = {
        status: 'error',
        error: String(queryError),
        stack: queryError instanceof Error ? queryError.stack : undefined
      };
    }

    // Résumé
    const failedTests = Object.values(results.tests).filter((t: any) => t.status === 'error').length;
    const successTests = Object.values(results.tests).filter((t: any) => t.status === 'success').length;
    const warningTests = Object.values(results.tests).filter((t: any) => t.status === 'warning').length;

    results.success = failedTests === 0;
    results.summary = {
      total: Object.keys(results.tests).length,
      success: successTests,
      warnings: warningTests,
      errors: failedTests,
      duration: `${Date.now() - startTime}ms`
    };

    console.log('✅ Tests terminés:', results.summary);

    return NextResponse.json(results, {
      status: results.success ? 200 : 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Test-Duration': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    console.error('❌ Erreur critique dans test-db:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      tests: results.tests
    }, { status: 500 });
  }
}