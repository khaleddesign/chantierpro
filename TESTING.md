# Guide de Tests - ChantierPro

Ce document décrit la stratégie de test complète pour l'application ChantierPro, organisée selon la pyramide des tests.

## 🏗️ Architecture des Tests

```
         /\
        /  \    E2E Tests (Playwright)
       /____\   Tests End-to-End complets
      /      \
     /        \  Integration Tests 
    /__________\ Tests d'intégration API/Composants
   /            \
  /              \ Unit Tests (Jest)
 /________________\ Tests unitaires (fonctions, composants isolés)
```

## 📁 Structure des Tests

```
__tests__/
├── lib/                    # Tests unitaires des utilitaires
│   ├── utils.test.ts
│   └── devis-utils.test.ts
├── components/            # Tests de composants
│   ├── ui/
│   │   ├── button.test.tsx
│   │   └── input.test.tsx
│   └── auth/
│       └── LoginForm.test.tsx
└── api/                   # Tests d'API routes
    └── health.test.ts

e2e/                       # Tests End-to-End (Playwright)
├── auth.spec.ts          # Tests d'authentification
├── chantiers.spec.ts     # Tests de gestion des chantiers
└── crm.spec.ts          # Tests du module CRM
```

## 🧪 Types de Tests

### 1. Tests Unitaires (Jest + React Testing Library)

**Objectif** : Valider les plus petites briques de code en isolation.

#### Fonctions Utilitaires (/lib)
- ✅ `lib/utils.ts` - Fonctions d'aide générales
- ✅ `lib/devis-utils.ts` - Calculs spécifiques aux devis
- 🔄 `lib/validations/*.ts` - Schémas de validation Zod

#### Composants UI (/components/ui)
- ✅ `Button` - Rendu, variants, événements
- ✅ `Input` - Saisie, validation, accessibilité
- 🔄 `Card`, `Badge`, `StatusBadge` - Affichage conditionnel

#### Hooks Personnalisés (/hooks)
- 🔄 `useToast` - Gestion des notifications
- 🔄 `useChantiers` - État et mutations des chantiers

### 2. Tests d'Intégration

**Objectif** : Vérifier les interactions entre composants et services.

#### API Routes
- ✅ `/api/health` - Statut de santé de l'application
- 🔄 `/api/auth/login` - Authentification utilisateur
- 🔄 `/api/chantiers` - CRUD des chantiers
- 🔄 `/api/devis` - Gestion des devis

#### Composants Complexes
- 🔄 `LoginForm` - Formulaire complet avec validation
- 🔄 `ChantierForm` - Création de chantiers
- 🔄 `DevisForm` - Gestion des devis

### 3. Tests End-to-End (Playwright)

**Objectif** : Simuler des parcours utilisateurs complets.

#### Scénarios Implémentés
- ✅ **Authentification** - Login/logout, gestion des erreurs
- 🔄 **Gestion des Chantiers** - CRUD complet
- 🔄 **Module CRM** - Pipeline d'opportunités
- 🔄 **Facturation** - Création et envoi de devis

## 🚀 Commandes de Test

### Tests Unitaires
```bash
# Exécuter tous les tests
npm test

# Mode watch pour développement
npm run test:watch

# Générer un rapport de couverture
npm run test:coverage
```

### Tests End-to-End
```bash
# Exécuter les tests E2E
npm run test:e2e

# Interface graphique pour débugger
npm run test:e2e:ui

# Mode headed (avec navigateur visible)
npm run test:e2e:headed

# Mode debug (pause à chaque step)
npm run test:e2e:debug
```

### Tests Complets
```bash
# Exécuter tous les types de tests
npm run test:all
```

## 📊 Couverture de Code

### Objectifs de Couverture
- **Fonctions utilitaires** : 100%
- **Composants UI** : 90%
- **API Routes** : 85%
- **Hooks** : 80%

### Exclusions
- Fichiers de configuration (`.config.js`)
- Types TypeScript (`.d.ts`)
- Build output (`/.next/`)
- Mocks et fixtures (`/__mocks__/`)

## 🎯 Scénarios de Test Prioritaires

### 1. Authentification Complète
```typescript
// E2E Test Example
test('Processus complet d\'authentification', async ({ page }) => {
  // 1. Accès à la page de login
  await page.goto('/auth/signin')
  
  // 2. Saisie des identifiants
  await page.fill('[name="email"]', 'admin@chantierpro.fr')
  await page.fill('[name="password"]', 'password123')
  
  // 3. Soumission du formulaire
  await page.click('button[type="submit"]')
  
  // 4. Vérification de la redirection
  await expect(page).toHaveURL('/dashboard')
  
  // 5. Vérification des données utilisateur
  await expect(page.locator('[data-testid="user-name"]')).toContainText('Admin')
})
```

### 2. Gestion des Chantiers
- Création d'un nouveau chantier
- Assignment d'équipes
- Mise à jour du statut
- Suppression (soft delete)

### 3. Module CRM
- Création d'un prospect
- Pipeline d'opportunités (drag & drop)
- Génération de devis
- Conversion en client

### 4. Facturation
- Création de devis multi-lignes
- Calculs automatiques (HT, TVA, TTC)
- Conversion devis → facture
- Génération PDF

## 🔧 Configuration

### Jest Configuration
```javascript
// jest.config.js
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
  ],
}
```

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 🧹 Mocking Strategy

### API Calls
```typescript
// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    }
  }
}))
```

### Hooks
```typescript
// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    login: jest.fn(),
    logout: jest.fn(),
  })
}))
```

### External Services
```typescript
// Mock Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  })
}))
```

## 📈 Métriques et Monitoring

### Temps d'Exécution Cibles
- **Tests unitaires** : < 30 secondes
- **Tests d'intégration** : < 2 minutes  
- **Tests E2E** : < 10 minutes

### Alertes
- Couverture < 80% → ⚠️ Warning
- Tests flaky (>5% échec) → 🚨 Alert
- Temps d'exécution > cible → 📊 Monitor

## 🤝 Bonnes Pratiques

### 1. Écriture des Tests
```typescript
// ✅ Bon : Descriptif et spécifique
test('should calculate total with 20% VAT for multiple items', () => {
  // Test implementation
})

// ❌ Mauvais : Vague
test('should work', () => {
  // Test implementation
})
```

### 2. Structure AAA (Arrange, Act, Assert)
```typescript
test('should format currency correctly', () => {
  // Arrange
  const amount = 1234.56
  
  // Act
  const result = formaterMontant(amount)
  
  // Assert
  expect(result).toMatch(/1\s*234,56\s*€/)
})
```

### 3. Isolation des Tests
```typescript
describe('Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })
})
```

## 🚦 CI/CD Integration

### Pipeline de Tests
1. **Lint** : Vérification du code
2. **Unit Tests** : Tests unitaires + couverture
3. **Build** : Compilation de l'application  
4. **E2E Tests** : Tests end-to-end
5. **Deploy** : Déploiement si tous les tests passent

### Variables d'Environnement
```bash
# Test Database
DATABASE_URL_TEST="file:./test.db"

# Test User Credentials  
TEST_ADMIN_EMAIL="admin@chantierpro.fr"
TEST_ADMIN_PASSWORD="password123"
```

---

## 📞 Support

Pour toute question sur les tests :
1. Consulter cette documentation
2. Examiner les tests existants comme exemples
3. Créer une issue sur le repo pour les questions spécifiques

**Dernière mise à jour** : 13 septembre 2025