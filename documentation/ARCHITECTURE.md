# 🏗️ Architecture ChantierPro

## Vue d'ensemble de l'architecture

ChantierPro est une application Next.js 15 full-stack avec une architecture moderne basée sur :
- **App Router** de Next.js 15
- **Architecture en couches** avec séparation des préoccupations
- **Design patterns** React modernes (hooks, context, providers)
- **Type safety** complet avec TypeScript

## 📊 Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  App Router (app/)                                      │
│  ├── Pages & Layouts                                    │
│  ├── API Routes                                         │
│  └── Middleware                                         │
├─────────────────────────────────────────────────────────┤
│  Components Layer                                       │
│  ├── UI Components (Radix UI + Tailwind)               │
│  ├── Business Components                               │
│  └── Layout Components                                  │
├─────────────────────────────────────────────────────────┤
│  State Management                                       │
│  ├── React Hooks                                       │
│  ├── Context Providers                                 │
│  └── Custom Hooks                                      │
├─────────────────────────────────────────────────────────┤
│  Data Access Layer                                     │
│  ├── Prisma ORM                                        │
│  ├── API Helpers                                       │
│  └── Validations (Zod)                                │
├─────────────────────────────────────────────────────────┤
│  Infrastructure                                        │
│  ├── Database (SQLite/PostgreSQL)                      │
│  ├── Authentication (NextAuth.js)                      │
│  └── File Storage                                      │
└─────────────────────────────────────────────────────────┘
```

## 🗂️ Organisation des dossiers

### `/app` - App Router Next.js 15
```
app/
├── (auth)/                 # Route group pour l'auth
│   ├── auth/
│   │   ├── signin/
│   │   └── register/
├── dashboard/              # Interface principale
│   ├── chantiers/
│   ├── devis/
│   ├── messages/
│   └── ...
├── api/                    # API Routes
│   ├── chantiers/
│   ├── devis/
│   ├── users/
│   └── ...
├── globals.css            # Styles globaux
├── layout.tsx             # Layout racine
└── page.tsx              # Page d'accueil
```

### `/components` - Composants React
```
components/
├── ui/                    # Composants UI de base
│   ├── button.tsx
│   ├── card.tsx
│   ├── toast.tsx
│   └── ...
├── layout/               # Composants de layout
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── ...
├── auth/                 # Authentification
├── chantiers/           # Gestion chantiers
├── devis/               # Facturation
├── messages/            # Messagerie
└── providers/           # Context providers
```

### `/hooks` - Custom React Hooks
```
hooks/
├── useAuth.ts           # Authentification
├── useChantiers.ts      # Gestion chantiers
├── useDevis.ts          # Devis/facturation
├── useMessages.ts       # Messagerie
└── useToast.ts         # Notifications
```

### `/lib` - Utilitaires et services
```
lib/
├── prisma.ts           # Client Prisma
├── auth.ts            # Configuration NextAuth
├── validations/       # Schémas de validation Zod
├── utils.ts           # Utilitaires généraux
└── services/          # Services métier
    ├── pdf-generator.ts
    └── ...
```

## 🔄 Flux de données

### 1. Requête utilisateur
```
User Action → Component → Custom Hook → API Route → Database
```

### 2. Réponse et mise à jour
```
Database → API Response → Hook State Update → Component Re-render
```

### 3. Exemple concret - Création d'un chantier
```
1. User clicks "Créer chantier" button
2. ChantierForm component calls useChantiers hook
3. useChantiers.createChantier() sends POST to /api/chantiers
4. API route validates data with Zod schema
5. Prisma creates record in database
6. Response updates local state via hook
7. Component re-renders with new data
8. Toast notification confirms success
```

## 🎯 Patterns architecturaux utilisés

### 1. **Compound Components Pattern**
```typescript
// Exemple: ChantierTabs
<ChantierTabs defaultValue="informations">
  <ChantierTabs.List>
    <ChantierTabs.Trigger value="informations">Info</ChantierTabs.Trigger>
    <ChantierTabs.Trigger value="timeline">Timeline</ChantierTabs.Trigger>
  </ChantierTabs.List>
  <ChantierTabs.Content value="informations">
    <ChantierDetails />
  </ChantierTabs.Content>
</ChantierTabs>
```

### 2. **Custom Hooks Pattern**
```typescript
// hooks/useChantiers.ts
export function useChantiers() {
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchChantiers = useCallback(async () => {
    // Logic d'API
  }, []);
  
  const createChantier = useCallback(async (data) => {
    // Logic de création
  }, []);
  
  return { chantiers, loading, fetchChantiers, createChantier };
}
```

### 3. **Provider Pattern**
```typescript
// components/providers/ToastProvider.tsx
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast]);
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}
```

### 4. **Factory Pattern** pour les APIs
```typescript
// lib/api-helpers.ts
export function createApiHandler<T>(options: ApiOptions<T>) {
  return async (req: NextRequest) => {
    try {
      const result = await options.handler(req);
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
```

## 🗄️ Couche de données

### Schema Prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // ou "postgresql" en production
  url      = env("DATABASE_URL")
}

// Modèles principaux
model User {
  id    String @id @default(cuid())
  email String @unique
  role  Role   @default(CLIENT)
  // Relations
  chantiers Chantier[] @relation("ChantierClient")
}

model Chantier {
  id     String @id @default(cuid())
  nom    String
  statut ChantierStatus
  client User   @relation("ChantierClient", fields: [clientId], references: [id])
}
```

### Validation avec Zod
```typescript
// lib/validations.ts
import { z } from 'zod';

export const ChantierSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  adresse: z.string().min(5, "Adresse requise"),
  clientId: z.string().uuid("ID client invalide"),
  budget: z.number().positive("Le budget doit être positif"),
});

export type ChantierFormData = z.infer<typeof ChantierSchema>;
```

## 🔐 Sécurité et authentification

### NextAuth.js Configuration
```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validation logic
      }
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      // Session customization
    }
  }
};
```

### Middleware de protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.nextUrl.pathname.startsWith('/dashboard')
    ? getToken({ req: request })
    : null;
    
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  return NextResponse.next();
}
```

## 🎨 Couche UI/UX

### Design System
```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
);
```

### Responsive Design
```css
/* globals.css */
.container {
  @apply mx-auto px-4;
  max-width: theme('screens.2xl');
}

@screen sm {
  .container { @apply px-6; }
}

@screen lg {
  .container { @apply px-8; }
}
```

## 📡 API Architecture

### RESTful API Routes
```
GET    /api/chantiers              # Liste paginée
POST   /api/chantiers              # Création
GET    /api/chantiers/[id]         # Détail
PUT    /api/chantiers/[id]         # Mise à jour
DELETE /api/chantiers/[id]         # Suppression

# Routes spécialisées
POST   /api/chantiers/[id]/assign  # Assignment d'équipe
GET    /api/chantiers/[id]/timeline # Timeline du chantier
```

### Error Handling Standard
```typescript
// lib/api-helpers.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  return NextResponse.json(
    { error: "Erreur interne du serveur" },
    { status: 500 }
  );
}
```

## 🚀 Performance et optimisation

### Code Splitting
```typescript
// Dynamic imports pour le lazy loading
const ChantierDetails = dynamic(() => import('./ChantierDetails'), {
  loading: () => <Spinner />,
});

const GanttChart = dynamic(() => import('./GanttChart'), {
  ssr: false, // Composant client-only
});
```

### Caching Strategy
```typescript
// API Routes avec cache
export async function GET(request: NextRequest) {
  const response = await getChantiers();
  
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=86400'
    }
  });
}
```

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/chantier-photo.jpg"
  alt="Photo du chantier"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## 🧪 Testing Architecture

### Unit Tests
```typescript
// __tests__/components/ChantierCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ChantierCard } from '../ChantierCard';

describe('ChantierCard', () => {
  it('renders chantier information correctly', () => {
    const chantier = {
      id: '1',
      nom: 'Test Chantier',
      statut: 'EN_COURS' as const,
    };
    
    render(<ChantierCard chantier={chantier} />);
    
    expect(screen.getByText('Test Chantier')).toBeInTheDocument();
  });
});
```

### API Tests
```typescript
// __tests__/api/chantiers.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/chantiers';

describe('/api/chantiers', () => {
  it('returns chantiers list', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
  });
});
```

## 📊 Monitoring et Logging

### Error Boundaries
```typescript
// components/ui/ErrorBoundary.tsx
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }
}
```

### Logging Strategy
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta);
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(`[ERROR] ${message}`, error, meta);
    // Send to monitoring service in production
  }
};
```

## 🔄 État et gestion des données

### State Management Flow
```
Local State (useState) 
    ↓
Custom Hooks (useChantiers, useDevis...)
    ↓
Context Providers (Global state)
    ↓
API Layer (Server state)
    ↓
Database (Persistent state)
```

Cette architecture garantit :
- **Séparation des préoccupations**
- **Réutilisabilité** des composants
- **Testabilité** de chaque couche
- **Maintenabilité** à long terme
- **Performance** optimisée
- **Type safety** complète