import { test, expect } from '@playwright/test';

test.describe('Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.locator('#email').fill('client@ecoeats.fr');
    await page.locator('#password').fill('Password123!');
    await page.click('button:has-text("Se connecter")');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should browse a restaurant and add item to cart', async ({ page }) => {
    // Wait for restaurants to load
    await page.waitForSelector('p:has-text("La Bella Pizza")');
    await page.click('p:has-text("La Bella Pizza")');

    // Check menu
    await page.waitForSelector('text=Margherita');
    await expect(page.locator('text=Margherita').first()).toBeVisible();
    
    // Add to cart
    await page.click('text=Margherita');
    await page.click('button:has-text("En ajouter 1")');
    
    // Open cart
    await page.click('button:has-text("Voir mon panier")');
    await expect(page.locator('p:has-text("Mon panier")')).toBeVisible();
    await expect(page.locator('text=Margherita').first()).toBeVisible();
    
    // Go to checkout
    await page.click('button:has-text("Passer la commande")');
    await expect(page.locator('text=Adresse de livraison')).toBeVisible();
  });
});
