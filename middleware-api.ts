import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Routes publiques autorisées (pas d'authentification requise)
    const publicRoutes = [
      '/api/auth',
      '/api/health',
      '/api/mobile/auth/login'
    ];
    
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }
    
    // Toutes les autres routes API nécessitent une authentification
    if (!token) {
      return NextResponse.json(
        { error: "Authentification requise" }, 
        { status: 401 }
      );
    }
    
    // Ajouter des headers de sécurité
    const response = NextResponse.next();
    response.headers.set('X-API-Version', '1.0');
    response.headers.set('X-Request-Time', new Date().toISOString());
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Routes publiques toujours autorisées
        const publicRoutes = [
          '/api/auth',
          '/api/health',
          '/api/mobile/auth/login'
        ];
        
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }
        
        // Toutes les autres routes nécessitent un token valide
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: '/api/:path*'
};
