import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'Password123!';

  test('should register a new user', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Select Client role in the modal
    await page.click('button:has-text("Client")');
    
    const phone = `06${Math.floor(Math.random() * 90000000 + 10000000)}`;
    await page.locator('#nom-complet').fill('Test User');
    await page.locator('#email').fill(email);
    await page.locator('#téléphone').fill(phone);
    await page.locator('#mot-de-passe').fill(password);
    await page.locator('#confirmer-le-mot-de-passe').fill(password);
    
    const submitBtn = page.locator('button:has-text("Créer mon compte")');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Bonjour')).toBeVisible();
  });

  test('should login with existing user', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.click('button:has-text("Se connecter")');
    
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Bonjour')).toBeVisible();
  });
});
