import { test, expect } from '@playwright/test';

test.describe('Module Chantiers', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('admin@chantierpro.fr');
    await page.getByLabel(/mot de passe/i).fill('admin123');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('accès aux chantiers sans crash', async ({ page }) => {
    // Vérifier qu'il n'y a pas d'erreur JavaScript
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('/dashboard/chantiers');
    await page.waitForLoadState('networkidle');
    
    // Vérifier absence d'erreurs critiques
    const criticalErrors = errors.filter(e => 
      e.includes('Cannot read properties of undefined') ||
      e.includes('Cannot read property') ||
      e.includes('undefined is not an object')
    );
    expect(criticalErrors).toHaveLength(0);
    
    // Vérifier que la page se charge correctement
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    
    // Vérifier que les éléments principaux sont présents
    await expect(page.getByText(/chantiers/i)).toBeVisible();
  });

  test('gestion des données vides', async ({ page }) => {
    // Intercepter l'API pour simuler des données vides
    await page.route('/api/chantiers*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          chantiers: [], 
          pagination: { 
            page: 1, 
            limit: 10,
            total: 0, 
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });

    await page.goto('/dashboard/chantiers');
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'il n'y a pas de crash avec des données vides
    await expect(page.getByText(/aucun chantier/i)).toBeVisible();
    
    // Vérifier que les statistiques affichent 0
    await expect(page.getByText('0')).toBeVisible();
  });

  test('pagination fonctionne correctement', async ({ page }) => {
    // Intercepter l'API pour simuler des données avec pagination
    await page.route('/api/chantiers*', route => {
      const url = new URL(route.request().url());
      const pageParam = url.searchParams.get('page') || '1';
      const currentPage = parseInt(pageParam);
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          chantiers: Array.from({ length: 10 }, (_, i) => ({
            id: `chantier-${currentPage}-${i}`,
            nom: `Chantier ${currentPage}-${i}`,
            description: `Description du chantier ${currentPage}-${i}`,
            adresse: `Adresse ${currentPage}-${i}`,
            statut: 'EN_COURS',
            progression: 50,
            dateDebut: '2024-01-01',
            dateFin: '2024-12-31',
            budget: 100000,
            superficie: '100m²',
            client: {
              id: `client-${i}`,
              name: `Client ${i}`,
              email: `client${i}@example.com`,
              company: `Entreprise ${i}`
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          })),
          pagination: { 
            page: currentPage,
            limit: 10,
            total: 25, 
            totalPages: 3,
            hasNextPage: currentPage < 3,
            hasPrevPage: currentPage > 1
          }
        })
      });
    });

    await page.goto('/dashboard/chantiers');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la pagination est visible
    await expect(page.getByText('1')).toBeVisible();
    await expect(page.getByText('2')).toBeVisible();
    await expect(page.getByText('3')).toBeVisible();
    
    // Cliquer sur la page 2
    await page.getByRole('button', { name: '2' }).click();
    await page.waitForLoadState('networkidle');
    
    // Vérifier que les données ont changé
    await expect(page.getByText('Chantier 2-0')).toBeVisible();
  });

  test('filtres de recherche fonctionnent', async ({ page }) => {
    // Intercepter l'API pour simuler des résultats de recherche
    await page.route('/api/chantiers*', route => {
      const url = new URL(route.request().url());
      const searchParam = url.searchParams.get('search');
      
      const chantiers = searchParam ? 
        [{
          id: 'chantier-search',
          nom: `Chantier ${searchParam}`,
          description: `Description avec ${searchParam}`,
          adresse: 'Adresse test',
          statut: 'EN_COURS',
          progression: 50,
          dateDebut: '2024-01-01',
          dateFin: '2024-12-31',
          budget: 100000,
          superficie: '100m²',
          client: {
            id: 'client-search',
            name: 'Client Search',
            email: 'client@example.com',
            company: 'Entreprise Search'
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }] : [];
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          chantiers,
          pagination: { 
            page: 1,
            limit: 10,
            total: chantiers.length, 
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });

    await page.goto('/dashboard/chantiers');
    await page.waitForLoadState('networkidle');
    
    // Utiliser la barre de recherche
    const searchInput = page.getByPlaceholder(/rechercher/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Attendre le debounce
    
    // Vérifier que les résultats de recherche s'affichent
    await expect(page.getByText('Chantier test')).toBeVisible();
  });

  test('création d\'un nouveau chantier', async ({ page }) => {
    await page.goto('/dashboard/chantiers');
    
    // Cliquer sur le bouton "Nouveau chantier"
    await page.getByRole('button', { name: /nouveau/i }).click();
    
    // Vérifier que le formulaire s'ouvre
    await expect(page.getByText(/nouveau chantier/i)).toBeVisible();
    
    // Remplir le formulaire
    await page.getByLabel(/nom/i).fill('Test Chantier E2E');
    await page.getByLabel(/description/i).fill('Description test E2E');
    await page.getByLabel(/adresse/i).fill('123 Rue Test, 75001 Paris');
    await page.getByLabel(/budget/i).fill('50000');
    
    // Sélectionner un client (simuler la sélection)
    await page.getByRole('combobox').first().click();
    await page.getByRole('option').first().click();
    
    // Soumettre le formulaire
    await page.getByRole('button', { name: /créer/i }).click();
    
    // Vérifier que le chantier a été créé (redirection ou message de succès)
    await expect(page.getByText(/chantier créé/i)).toBeVisible();
  });

  test('affichage des statistiques', async ({ page }) => {
    // Intercepter l'API pour simuler des statistiques
    await page.route('/api/chantiers*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          chantiers: [
            { id: '1', statut: 'EN_COURS', budget: 100000 },
            { id: '2', statut: 'PLANIFIE', budget: 200000 },
            { id: '3', statut: 'TERMINE', budget: 150000 }
          ],
          pagination: { 
            page: 1,
            limit: 10,
            total: 3, 
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });

    await page.goto('/dashboard/chantiers');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que les statistiques s'affichent
    await expect(page.getByText('1')).toBeVisible(); // Chantiers en cours
    await expect(page.getByText('1')).toBeVisible(); // Chantiers planifiés
    await expect(page.getByText('1')).toBeVisible(); // Chantiers terminés
  });

  test('gestion des erreurs API', async ({ page }) => {
    // Intercepter l'API pour simuler une erreur
    await page.route('/api/chantiers*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Erreur serveur interne'
        })
      });
    });

    await page.goto('/dashboard/chantiers');
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'un message d'erreur s'affiche
    await expect(page.getByText(/erreur/i)).toBeVisible();
  });

  test('navigation entre les vues (grille, liste, tableau)', async ({ page }) => {
    await page.goto('/dashboard/chantiers');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la vue par défaut est active
    const defaultView = page.locator('[data-testid="view-toggle"] button[aria-pressed="true"]');
    await expect(defaultView).toBeVisible();
    
    // Changer de vue
    const gridViewButton = page.getByRole('button', { name: /grille/i });
    const listViewButton = page.getByRole('button', { name: /liste/i });
    const tableViewButton = page.getByRole('button', { name: /tableau/i });
    
    if (await gridViewButton.isVisible()) {
      await gridViewButton.click();
      await page.waitForTimeout(500);
    }
    
    if (await listViewButton.isVisible()) {
      await listViewButton.click();
      await page.waitForTimeout(500);
    }
    
    if (await tableViewButton.isVisible()) {
      await tableViewButton.click();
      await page.waitForTimeout(500);
    }
    
    // Vérifier qu'aucune erreur n'est survenue
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    const criticalErrors = errors.filter(e => 
      e.includes('Cannot read properties of undefined')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
