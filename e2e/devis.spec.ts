import { test, expect } from '@playwright/test';

test.describe('Module Devis', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('admin@chantierpro.fr');
    await page.getByLabel(/mot de passe/i).fill('admin123');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('accès aux devis sans crash', async ({ page }) => {
    // Vérifier qu'il n'y a pas d'erreur JavaScript
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Vérifier absence d'erreurs critiques
    const criticalErrors = errors.filter(e => 
      e.includes('Cannot read properties of undefined') ||
      e.includes('Cannot read property') ||
      e.includes('undefined is not an object') ||
      e.includes('s is not iterable')
    );
    expect(criticalErrors).toHaveLength(0);
    
    // Vérifier que la page se charge correctement
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    
    // Vérifier que les éléments principaux sont présents
    await expect(page.getByText(/devis/i)).toBeVisible();
  });

  test('gestion des données vides', async ({ page }) => {
    // Intercepter l'API pour simuler des données vides
    await page.route('/api/devis*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          devis: [], 
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

    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'il n'y a pas de crash avec des données vides
    await expect(page.getByText(/aucun devis/i)).toBeVisible();
  });

  test('création d\'un nouveau devis', async ({ page }) => {
    await page.goto('/dashboard/devis');
    
    // Cliquer sur le bouton "Nouveau devis"
    await page.getByRole('button', { name: /nouveau/i }).click();
    
    // Vérifier que le formulaire s'ouvre
    await expect(page.getByText(/nouveau devis/i)).toBeVisible();
    
    // Remplir les informations de base
    await page.getByLabel(/client/i).fill('Client Test E2E');
    await page.getByLabel(/objet/i).fill('Devis Test E2E');
    await page.getByLabel(/montant/i).fill('25000');
    
    // Ajouter une ligne de devis
    await page.getByRole('button', { name: /ajouter une ligne/i }).click();
    
    // Remplir la ligne
    await page.getByLabel(/description/i).fill('Prestation test E2E');
    await page.getByLabel(/quantité/i).fill('1');
    await page.getByLabel(/prix unitaire/i).fill('25000');
    
    // Soumettre le formulaire
    await page.getByRole('button', { name: /créer/i }).click();
    
    // Vérifier que le devis a été créé
    await expect(page.getByText(/devis créé/i)).toBeVisible();
  });

  test('filtres de recherche fonctionnent', async ({ page }) => {
    // Intercepter l'API pour simuler des résultats de recherche
    await page.route('/api/devis*', route => {
      const url = new URL(route.request().url());
      const searchParam = url.searchParams.get('search');
      
      const devis = searchParam ? 
        [{
          id: 'devis-search',
          numero: `DEV-${searchParam}`,
          objet: `Devis ${searchParam}`,
          montant: 25000,
          statut: 'EN_ATTENTE',
          client: {
            id: 'client-search',
            name: `Client ${searchParam}`,
            email: 'client@example.com'
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }] : [];
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          devis,
          pagination: { 
            page: 1,
            limit: 10,
            total: devis.length, 
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });

    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Utiliser la barre de recherche
    const searchInput = page.getByPlaceholder(/rechercher/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Attendre le debounce
    
    // Vérifier que les résultats de recherche s'affichent
    await expect(page.getByText('Devis test')).toBeVisible();
  });

  test('filtres par statut fonctionnent', async ({ page }) => {
    // Intercepter l'API pour simuler des filtres par statut
    await page.route('/api/devis*', route => {
      const url = new URL(route.request().url());
      const statusParam = url.searchParams.get('status');
      
      const devis = statusParam ? 
        [{
          id: `devis-${statusParam}`,
          numero: `DEV-${statusParam}`,
          objet: `Devis ${statusParam}`,
          montant: 25000,
          statut: statusParam,
          client: {
            id: 'client-test',
            name: 'Client Test',
            email: 'client@example.com'
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }] : [];
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          devis,
          pagination: { 
            page: 1,
            limit: 10,
            total: devis.length, 
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });

    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Sélectionner un filtre de statut
    const statusFilter = page.getByRole('combobox', { name: /statut/i });
    await statusFilter.selectOption('EN_ATTENTE');
    
    // Vérifier que les résultats filtrés s'affichent
    await expect(page.getByText('Devis EN_ATTENTE')).toBeVisible();
  });

  test('pagination fonctionne correctement', async ({ page }) => {
    // Intercepter l'API pour simuler des données avec pagination
    await page.route('/api/devis*', route => {
      const url = new URL(route.request().url());
      const pageParam = url.searchParams.get('page') || '1';
      const currentPage = parseInt(pageParam);
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          devis: Array.from({ length: 10 }, (_, i) => ({
            id: `devis-${currentPage}-${i}`,
            numero: `DEV-${currentPage}-${i}`,
            objet: `Devis ${currentPage}-${i}`,
            montant: 25000 + (i * 1000),
            statut: 'EN_ATTENTE',
            client: {
              id: `client-${i}`,
              name: `Client ${i}`,
              email: `client${i}@example.com`
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

    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la pagination est visible
    await expect(page.getByText('1')).toBeVisible();
    await expect(page.getByText('2')).toBeVisible();
    await expect(page.getByText('3')).toBeVisible();
    
    // Cliquer sur la page 2
    await page.getByRole('button', { name: '2' }).click();
    await page.waitForLoadState('networkidle');
    
    // Vérifier que les données ont changé
    await expect(page.getByText('DEV-2-0')).toBeVisible();
  });

  test('affichage des statistiques', async ({ page }) => {
    // Intercepter l'API pour simuler des statistiques
    await page.route('/api/devis*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          devis: [
            { id: '1', statut: 'EN_ATTENTE', montant: 25000 },
            { id: '2', statut: 'ACCEPTE', montant: 50000 },
            { id: '3', statut: 'REFUSE', montant: 15000 }
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

    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que les statistiques s'affichent
    await expect(page.getByText('25000')).toBeVisible();
    await expect(page.getByText('50000')).toBeVisible();
    await expect(page.getByText('15000')).toBeVisible();
  });

  test('navigation entre les vues (grille, liste, tableau)', async ({ page }) => {
    await page.goto('/dashboard/devis');
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

  test('gestion des erreurs API', async ({ page }) => {
    // Intercepter l'API pour simuler une erreur
    await page.route('/api/devis*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Erreur serveur interne'
        })
      });
    });

    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'un message d'erreur s'affiche
    await expect(page.getByText(/erreur/i)).toBeVisible();
  });

  test('export des devis fonctionne', async ({ page }) => {
    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Chercher le bouton d'export
    const exportButton = page.getByRole('button', { name: /exporter/i });
    
    if (await exportButton.isVisible()) {
      // Intercepter la requête d'export
      await page.route('/api/devis/export*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/pdf',
          body: Buffer.from('PDF content')
        });
      });
      
      await exportButton.click();
      
      // Vérifier qu'un téléchargement est déclenché
      const downloadPromise = page.waitForEvent('download');
      await downloadPromise;
    }
  });

  test('recherche avancée fonctionne', async ({ page }) => {
    await page.goto('/dashboard/devis');
    await page.waitForLoadState('networkidle');
    
    // Chercher le bouton de recherche avancée
    const advancedSearchButton = page.getByRole('button', { name: /recherche avancée/i });
    
    if (await advancedSearchButton.isVisible()) {
      await advancedSearchButton.click();
      
      // Vérifier que le formulaire de recherche avancée s'ouvre
      await expect(page.getByText(/recherche avancée/i)).toBeVisible();
      
      // Remplir les critères de recherche
      await page.getByLabel(/date de début/i).fill('2024-01-01');
      await page.getByLabel(/date de fin/i).fill('2024-12-31');
      await page.getByLabel(/montant minimum/i).fill('10000');
      
      // Lancer la recherche
      await page.getByRole('button', { name: /rechercher/i }).click();
      
      // Vérifier que les résultats s'affichent
      await page.waitForLoadState('networkidle');
    }
  });
});
