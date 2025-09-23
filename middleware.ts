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

    // Si non connecté et sur une page protégée, rediriger vers login
    if (!isAuth && isDashboard) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Si utilisateur connecté et sur une page d'auth, rediriger vers dashboard approprié
    if (isAuth && isAuthPage) {
      const role = token.role;
      if (role === 'CLIENT') {
        return NextResponse.redirect(new URL("/dashboard/client", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Vérifications des permissions par rôle (sans redirections en boucle)
    if (isAuth && isDashboard && token?.role) {
      const role = token.role;
      const pathname = req.nextUrl.pathname;

      // Routes admin seulement
      if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Routes commercial/admin seulement  
      if (pathname.startsWith("/dashboard/users") && !["ADMIN", "COMMERCIAL"].includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Rediriger les non-clients qui tentent d'accéder à l'espace client
      if (role !== "CLIENT" && pathname.startsWith("/dashboard/client")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Redirection des clients vers leur espace (uniquement depuis /dashboard exact)
      if (role === "CLIENT" && pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard/client", req.url));
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|manifest.json).*)",
  ],
};