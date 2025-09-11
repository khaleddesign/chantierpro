# 🤝 Guide de Contribution - ChantierPro

Merci de votre intérêt pour contribuer à ChantierPro ! Ce guide vous aidera à comprendre comment participer au développement du projet.

## 🌟 Comment contribuer

Il existe plusieurs façons de contribuer à ChantierPro :

- 🐛 **Signaler des bugs** via les issues GitHub
- 💡 **Proposer des fonctionnalités** nouvelles
- 📝 **Améliorer la documentation**
- 🔧 **Contribuer du code** (corrections, nouvelles features)
- 🧪 **Écrire des tests** pour améliorer la couverture
- 🎨 **Améliorer l'UI/UX** du projet

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18.x ou supérieur
- npm 9.x ou supérieur
- Git

### Configuration de l'environnement

```bash
# 1. Fork le repository sur GitHub

# 2. Cloner votre fork
git clone https://github.com/VOTRE-USERNAME/chantierpro.git
cd chantierpro

# 3. Ajouter le repository original comme remote
git remote add upstream https://github.com/ORIGINAL-OWNER/chantierpro.git

# 4. Installer les dépendances
npm install

# 5. Copier le fichier d'environnement
cp .env.example .env

# 6. Initialiser la base de données
npx prisma db push

# 7. Démarrer le serveur de développement
npm run dev
```

## 📋 Processus de contribution

### 1. 🔍 Avant de commencer

- Consultez les [issues existantes](https://github.com/owner/chantierpro/issues)
- Vérifiez si votre idée n'est pas déjà en cours de développement
- Pour les grosses fonctionnalités, créez d'abord une issue pour discussion

### 2. 🌿 Créer une branche

```bash
# Mettre à jour la branche main
git checkout main
git pull upstream main

# Créer une nouvelle branche pour votre contribution
git checkout -b feature/nom-de-votre-feature
# ou
git checkout -b bugfix/description-du-bug
# ou
git checkout -b docs/amélioration-documentation
```

### 3. 💻 Développement

- Suivez les [conventions de code](#conventions-de-code)
- Écrivez des tests pour vos nouvelles fonctionnalités
- Documentez votre code quand nécessaire
- Testez localement avant de pousser

### 4. 📝 Commits

Utilisez des messages de commit clairs et descriptifs suivant la convention [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
# Exemples de messages de commit
git commit -m "feat: ajout système de notifications push"
git commit -m "fix: correction bug calcul TVA dans devis"
git commit -m "docs: mise à jour guide installation"
git commit -m "test: ajout tests unitaires pour useChantiers"
git commit -m "refactor: optimisation requêtes base de données"
git commit -m "style: correction formatage code avec prettier"
```

**Types de commits :**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Formatage, point-virgules manquants, etc.
- `refactor`: Refactoring du code
- `test`: Ajout de tests
- `chore`: Maintenance (dépendances, config, etc.)

### 5. 🧪 Tests

Assurez-vous que tous les tests passent :

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Vérification TypeScript
npm run type-check

# Linting
npm run lint

# Formatage du code
npm run format
```

### 6. 📤 Soumettre une Pull Request

```bash
# Pousser votre branche
git push origin feature/nom-de-votre-feature

# Créer une Pull Request sur GitHub
```

## 🎯 Conventions de code

### TypeScript

```typescript
// ✅ Bon
interface ChantierFormData {
  nom: string;
  description?: string;
  clientId: string;
}

const createChantier = async (data: ChantierFormData): Promise<Chantier> => {
  // Implementation
};

// ❌ Éviter
const createChantier = async (data: any) => {
  // Implementation avec any
};
```

### React Components

```typescript
// ✅ Composant fonctionnel avec TypeScript
interface ChantierCardProps {
  chantier: Chantier;
  onEdit?: (id: string) => void;
  className?: string;
}

export function ChantierCard({ chantier, onEdit, className }: ChantierCardProps) {
  return (
    <div className={cn("border rounded-lg p-4", className)}>
      <h3 className="font-semibold">{chantier.nom}</h3>
      {onEdit && (
        <Button onClick={() => onEdit(chantier.id)} size="sm">
          Modifier
        </Button>
      )}
    </div>
  );
}
```

### Custom Hooks

```typescript
// ✅ Hook bien structuré
export function useChantiers() {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChantiers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chantiers');
      const data = await response.json();
      setChantiers(data.chantiers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  return { chantiers, loading, error, fetchChantiers };
}
```

### Styling avec Tailwind

```typescript
// ✅ Utilisation cohérente de Tailwind
<div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
  <div className="flex items-center space-x-3">
    <Avatar className="h-10 w-10" />
    <div>
      <p className="text-sm font-medium text-gray-900">{user.name}</p>
      <p className="text-xs text-gray-500">{user.role}</p>
    </div>
  </div>
</div>

// ❌ Éviter les styles inline
<div style={{ display: 'flex', padding: '16px' }}>
```

### API Routes

```typescript
// ✅ Structure API bien organisée
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

const ChantierSchema = z.object({
  nom: z.string().min(3),
  clientId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ChantierSchema.parse(body);

    const chantier = await prisma.chantier.create({
      data: validatedData,
    });

    return NextResponse.json(chantier, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

## 🧪 Tests

### Tests unitaires

```typescript
// __tests__/components/ChantierCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ChantierCard } from '@/components/chantiers/ChantierCard';

const mockChantier = {
  id: '1',
  nom: 'Test Chantier',
  statut: 'EN_COURS' as const,
  // ... autres propriétés
};

describe('ChantierCard', () => {
  it('affiche le nom du chantier', () => {
    render(<ChantierCard chantier={mockChantier} />);
    
    expect(screen.getByText('Test Chantier')).toBeInTheDocument();
  });

  it('appelle onEdit quand le bouton est cliqué', () => {
    const mockOnEdit = jest.fn();
    render(<ChantierCard chantier={mockChantier} onEdit={mockOnEdit} />);
    
    const editButton = screen.getByText('Modifier');
    editButton.click();
    
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });
});
```

### Tests d'hooks

```typescript
// __tests__/hooks/useChantiers.test.ts
import { renderHook, act } from '@testing-library/react';
import { useChantiers } from '@/hooks/useChantiers';

// Mock fetch
global.fetch = jest.fn();

describe('useChantiers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('récupère la liste des chantiers', async () => {
    const mockChantiers = [{ id: '1', nom: 'Test' }];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ chantiers: mockChantiers }),
    });

    const { result } = renderHook(() => useChantiers());

    await act(async () => {
      await result.current.fetchChantiers();
    });

    expect(result.current.chantiers).toEqual(mockChantiers);
    expect(result.current.loading).toBe(false);
  });
});
```

## 📚 Documentation

### JSDoc pour les fonctions complexes

```typescript
/**
 * Calcule le montant TTC d'un devis avec support multi-taux TVA
 * @param lignes - Array des lignes de devis
 * @param tvaConfig - Configuration des taux de TVA par ligne
 * @param autoliquidation - Si true, TVA à 0%
 * @returns Objet avec détails des calculs
 */
export function calculateDevisTotal(
  lignes: LigneDevis[],
  tvaConfig: TVAConfig,
  autoliquidation: boolean = false
): DevisCalculation {
  // Implementation
}
```

### README pour les nouveaux modules

```markdown
# Module Planning

Ce module gère la planification et les calendriers.

## Structure

- `components/planning/` - Composants UI
- `hooks/usePlanning.ts` - Hook de gestion d'état
- `lib/planning-utils.ts` - Utilitaires de calcul

## Utilisation

```typescript
import { usePlanning } from '@/hooks/usePlanning';

function PlanningPage() {
  const { events, createEvent } = usePlanning();
  // ...
}
```

## API

- `GET /api/planning` - Liste des événements
- `POST /api/planning` - Créer un événement
```

## 🐛 Signaler des bugs

Lors du signalement d'un bug, incluez :

- **Description claire** du problème
- **Étapes pour reproduire** le bug
- **Comportement attendu** vs comportement actuel
- **Captures d'écran** si pertinent
- **Environnement** (OS, navigateur, versions)
- **Logs d'erreur** de la console

### Template d'issue bug

```markdown
## 🐛 Description du bug
Description claire et concise du problème.

## 🔄 Étapes pour reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

## ✅ Comportement attendu
Ce qui devrait se passer.

## 📷 Captures d'écran
Si applicable, ajoutez des captures d'écran.

## 🖥️ Environnement
- OS: [ex: Windows 11]
- Navigateur: [ex: Chrome 118]
- Version: [ex: 1.2.3]

## 📝 Contexte additionnel
Autres informations utiles.
```

## 💡 Proposer des fonctionnalités

### Template de feature request

```markdown
## 🚀 Description de la fonctionnalité
Description claire de ce que vous aimeriez voir ajouté.

## 🎯 Problème résolu
Quel problème cette fonctionnalité résout-elle ?

## 💭 Solution proposée
Description claire de ce que vous voulez.

## 🔄 Alternatives considérées
Autres solutions auxquelles vous avez pensé.

## 📋 Critères d'acceptation
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3
```

## 🏷️ Labels et workflow

### Labels utilisés

- `bug` - Problèmes à corriger
- `enhancement` - Nouvelles fonctionnalités
- `documentation` - Améliorations de docs
- `good first issue` - Parfait pour débuter
- `help wanted` - Aide recherchée
- `priority: high` - Priorité haute
- `status: in progress` - En cours de développement

### Workflow des PRs

1. **Draft** - PR en cours de développement
2. **Ready for review** - Prêt pour relecture
3. **Changes requested** - Modifications demandées
4. **Approved** - Approuvé, prêt à merge
5. **Merged** - Intégré au projet

## 🎉 Reconnaissance

Tous les contributeurs sont reconnus dans :

- Section "Contributors" du README
- Page "About" de l'application
- Release notes pour les contributions majeures

## 📞 Besoin d'aide ?

- 💬 **Discussions GitHub** pour les questions générales
- 📧 **Email** pour les questions privées
- 📱 **Discord/Slack** pour le chat en temps réel

---

**Merci de contribuer à ChantierPro !** 🚀

Chaque contribution, petite ou grande, améliore le projet pour toute la communauté BTP.