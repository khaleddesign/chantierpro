import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/auth/signin');
  });

  test('should display login form correctly', async ({ page }) => {
    // Check for login form elements
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByText(/accédez à votre espace chantierpro/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /créer un compte/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /se connecter/i });
    
    // Button should be disabled initially
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit button when both fields are filled', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/mot de passe/i);
    const submitButton = page.getByRole('button', { name: /se connecter/i });
    
    // Initially disabled
    await expect(submitButton).toBeDisabled();
    
    // Fill email only
    await emailInput.fill('test@example.com');
    await expect(submitButton).toBeDisabled();
    
    // Fill password too
    await passwordInput.fill('password123');
    await expect(submitButton).not.toBeDisabled();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/mot de passe/i);
    const toggleButton = page.locator('button[type="button"]').last(); // Eye icon button
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should attempt login with valid admin credentials', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/mot de passe/i);
    const submitButton = page.getByRole('button', { name: /se connecter/i });
    
    // Fill credentials
    await emailInput.fill('admin@chantierpro.fr');
    await passwordInput.fill('password123');
    
    // Submit form
    await submitButton.click();
    
    // Should either redirect to dashboard or show loading state
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should attempt login with valid client credentials', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/mot de passe/i);
    const submitButton = page.getByRole('button', { name: /se connecter/i });
    
    // Fill credentials
    await emailInput.fill('client@chantierpro.fr');
    await passwordInput.fill('password123');
    
    // Submit form
    await submitButton.click();
    
    // Client should be redirected to client dashboard
    await expect(page).toHaveURL(/\/dashboard\/client/, { timeout: 10000 });
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/mot de passe/i);
    const submitButton = page.getByRole('button', { name: /se connecter/i });
    
    // Fill invalid credentials
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    
    // Submit form
    await submitButton.click();
    
    // Should show error message
    await expect(page.getByText(/identifiants invalides/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /créer un compte/i });
    
    await registerLink.click();
    await expect(page).toHaveURL('/auth/register');
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab'); // Email input
    await expect(page.getByLabel(/email/i)).toBeFocused();
    
    await page.keyboard.press('Tab'); // Password input  
    await expect(page.getByLabel(/mot de passe/i)).toBeFocused();
    
    await page.keyboard.press('Tab'); // Toggle password button
    await page.keyboard.press('Tab'); // Submit button
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeFocused();
    
    await page.keyboard.press('Tab'); // Register link
    await expect(page.getByRole('link', { name: /créer un compte/i })).toBeFocused();
  });

  test('should handle form submission with Enter key', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/mot de passe/i);
    
    // Fill credentials
    await emailInput.fill('admin@chantierpro.fr');
    await passwordInput.fill('password123');
    
    // Submit with Enter key
    await passwordInput.press('Enter');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});

test.describe('Dashboard Access Control', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should prevent access to admin routes for non-admin users', async ({ page }) => {
    // First login as client
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('client@chantierpro.fr');
    await page.getByLabel(/mot de passe/i).fill('password123');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    // Wait for client dashboard
    await expect(page).toHaveURL(/\/dashboard\/client/);
    
    // Try to access admin route directly
    await page.goto('/dashboard/admin');
    
    // Should be redirected back to appropriate dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});