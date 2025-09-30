import { test, expect } from '@playwright/test';

test.describe('Dashboard Principal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('admin@chantierpro.fr');
    await page.getByLabel(/mot de passe/i).fill('admin123');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('dashboard se charge sans erreur', async ({ page }) => {
    // Vérifier qu'il n'y a pas d'erreur JavaScript
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Vérifier absence d'erreurs critiques
    const criticalErrors = errors.filter(e => 
      e.includes('Cannot read properties of undefined') ||
      e.includes('Cannot read property') ||
      e.includes('undefined is not an object') ||
      e.includes('s is not iterable')
    );
    expect(criticalErrors).toHaveLength(0);
    
    // Vérifier que les éléments principaux sont présents
    await expect(page.getByText(/bonjour/i)).toBeVisible();
    await expect(page.getByText(/chantiers actifs/i)).toBeVisible();
  });

  test('navigation vers les modules fonctionne', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Tester la navigation vers les chantiers
    await page.getByRole('link', { name: /chantiers/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/chantiers/);
    
    // Retour au dashboard
    await page.goto('/dashboard');
    
    // Tester la navigation vers les devis
    await page.getByRole('link', { name: /devis/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/devis/);
    
    // Retour au dashboard
    await page.goto('/dashboard');
    
    // Tester la navigation vers les messages
    await page.getByRole('link', { name: /messages/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/messages/);
  });

  test('statistiques s\'affichent correctement', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que les cartes de statistiques sont présentes
    await expect(page.getByText(/chantiers actifs/i)).toBeVisible();
    await expect(page.getByText(/clients crm/i)).toBeVisible();
    await expect(page.getByText(/factures/i)).toBeVisible();
    await expect(page.getByText(/projets actifs/i)).toBeVisible();
    
    // Vérifier que les valeurs numériques s'affichent
    const numericValues = page.locator('text=/\\d+/');
    await expect(numericValues.first()).toBeVisible();
  });

  test('actions rapides fonctionnent', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la section actions rapides est présente
    await expect(page.getByText(/actions rapides/i)).toBeVisible();
    
    // Tester quelques actions rapides
    const crmAction = page.getByRole('link', { name: /crm/i });
    if (await crmAction.isVisible()) {
      await crmAction.click();
      await expect(page).toHaveURL(/\/dashboard\/crm/);
    }
  });

  test('activité récente s\'affiche', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la section activité récente est présente
    await expect(page.getByText(/activité récente/i)).toBeVisible();
    
    // Vérifier qu'il y a des éléments d'activité
    const activityItems = page.locator('[data-testid="activity-item"], .activity-item, .space-y-4 > div');
    const count = await activityItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('alertes importantes s\'affichent', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la section alertes est présente
    await expect(page.getByText(/alertes importantes/i)).toBeVisible();
    
    // Vérifier qu'il y a des alertes
    const alerts = page.locator('[data-testid="alert"], .alert, .border-l-4');
    const count = await alerts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('météo du jour s\'affiche', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la section météo est présente
    await expect(page.getByText(/météo chantiers/i)).toBeVisible();
    
    // Vérifier qu'il y a des informations météo
    await expect(page.getByText(/°C/)).toBeVisible();
  });

  test('redirection pour les clients', async ({ page }) => {
    // Logout
    await page.goto('/auth/signin');
    
    // Login as client
    await page.getByLabel(/email/i).fill('marie.dubois@email.fr');
    await page.getByLabel(/mot de passe/i).fill('client123');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Vérifier la redirection vers le dashboard client
    await expect(page).toHaveURL(/\/dashboard\/client/);
  });

  test('redirection pour les ouvriers', async ({ page }) => {
    // Logout
    await page.goto('/auth/signin');
    
    // Login as ouvrier
    await page.getByLabel(/email/i).fill('michel.roux@chantierpro.fr');
    await page.getByLabel(/mot de passe/i).fill('ouvrier123');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Vérifier la redirection vers le dashboard ouvrier
    await expect(page).toHaveURL(/\/dashboard\/ouvrier/);
  });

  test('gestion des erreurs de chargement', async ({ page }) => {
    // Intercepter les APIs pour simuler des erreurs
    await page.route('/api/chantiers*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Erreur serveur' })
      });
    });
    
    await page.route('/api/devis*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Erreur serveur' })
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page se charge malgré les erreurs
    await expect(page.getByText(/bonjour/i)).toBeVisible();
    
    // Vérifier qu'aucune erreur JavaScript critique n'est survenue
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    const criticalErrors = errors.filter(e => 
      e.includes('Cannot read properties of undefined')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('responsive design fonctionne', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Tester en mode mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Vérifier que les éléments principaux sont toujours visibles
    await expect(page.getByText(/bonjour/i)).toBeVisible();
    
    // Tester en mode tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Vérifier que les éléments principaux sont toujours visibles
    await expect(page.getByText(/bonjour/i)).toBeVisible();
    
    // Retour en mode desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Vérifier que les éléments principaux sont toujours visibles
    await expect(page.getByText(/bonjour/i)).toBeVisible();
  });
});
