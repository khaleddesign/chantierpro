import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function logRequest(request: NextRequest, startTime: number) {
  const duration = Date.now() - startTime
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${request.method} ${request.url} - ${duration}ms`)
  }
}

export default withAuth(
  function middleware(req) {
    const startTime = Date.now()
    const requestId = Math.random().toString(36).substring(7)
    
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
    const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

    // Si utilisateur connecté et sur une page d'auth, rediriger vers dashboard
    if (isAuth && isAuthPage) {
      const role = token.role;
      switch (role) {
        case 'CLIENT':
          return NextResponse.redirect(new URL("/dashboard/client", req.url));
        case 'ADMIN':
        case 'COMMERCIAL':
        default:
          return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Si non connecté et sur une page protégée, rediriger vers login
    if (!isAuth && isDashboard) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Vérifier les permissions spécifiques aux rôles
    if (isAuth && isDashboard && token?.role) {
      const role = token.role;
      const pathname = req.nextUrl.pathname;

      // Éviter les boucles infinies - ne pas rediriger si déjà sur la bonne page
      if (role === "CLIENT" && pathname.startsWith("/dashboard/client")) {
        // Client déjà sur la bonne section, laisser passer
        return NextResponse.next();
      }
      
      if ((role === "ADMIN" || role === "COMMERCIAL") && pathname === "/dashboard") {
        // Admin/Commercial déjà sur la bonne section, laisser passer
        return NextResponse.next();
      }

      // Routes admin seulement
      if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Routes commercial/admin seulement  
      if (pathname.startsWith("/dashboard/users") && !["ADMIN", "COMMERCIAL"].includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Redirection pour les clients vers leur espace
      if (role === "CLIENT" && !pathname.startsWith("/dashboard/client")) {
        return NextResponse.redirect(new URL("/dashboard/client", req.url));
      }

      // Rediriger les non-clients qui tentent d'accéder à l'espace client
      if (role !== "CLIENT" && pathname.startsWith("/dashboard/client")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    const response = NextResponse.next();
    
    // Ajouter headers de sécurité
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }
    
    // Ajouter headers de monitoring
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    
    // Log de la requête
    logRequest(req, startTime)
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
        const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
        const isHomePage = req.nextUrl.pathname === "/";

        // Pages d'auth sont accessibles à tous
        if (isAuthPage) return true;

        // Page d'accueil accessible à tous (gère ses propres redirections)
        if (isHomePage) return true;

        // Pages dashboard nécessitent une authentification
        if (isDashboard) return !!token;

        // Toutes les autres pages sont accessibles
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
};