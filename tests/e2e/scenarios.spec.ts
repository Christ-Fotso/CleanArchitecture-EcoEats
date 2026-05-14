import { test, expect } from '@playwright/test';

test.describe('Scénario Complet : De la commande à la livraison', () => {
  const email    = `test-${Date.now()}@example.com`;
  const password = 'Password123!';

  test('Cycle complet : Inscription, Paiement et Commande avec adresse réelle', async ({ page }) => {
    // 1. Inscription
    await page.goto('/auth/register');
    const phone = `06${Math.floor(Math.random() * 90000000 + 10000000)}`;
    await page.click('button:has-text("Client")');
    await page.locator('#nom-complet').fill('Test Scénario');
    await page.locator('#email').fill(email);
    await page.locator('#téléphone').fill(phone);
    await page.locator('#mot-de-passe').fill(password);
    await page.locator('#confirmer-le-mot-de-passe').fill(password);
    await page.click('button:has-text("Créer mon compte")');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Ajout d'une carte (Stripe)
    await page.goto('/dashboard/account/payment-methods');
    await page.click('button:has-text("Ajouter une carte")');
    
    // Wait for Stripe iframe with correct title
    const stripeFrame = page.frameLocator('iframe[title="Secure card payment input frame"]');
    
    // Fill Stripe fields using names (more robust)
    await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
    await stripeFrame.locator('input[name="exp-date"]').fill('1228');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    await stripeFrame.locator('input[name="postal"]').fill('75000');
    
    // Un peu de délai pour Stripe validation
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Enregistrer la carte")');
    
    // Verify card is added
    await expect(page.locator('text=4242')).toBeVisible();

    // 3. Commande avec adresse réelle (Paris Centre)
    await page.goto('/dashboard');
    await page.waitForSelector('p:has-text("La Bella Pizza")');
    await page.click('p:has-text("La Bella Pizza")');
    
    await page.waitForSelector('text=Margherita');
    await page.click('text=Margherita');
    await page.click('button:has-text("En ajouter 1")');
    
    // Ouvrir panier
    await page.click('button:has-text("Voir mon panier")');
    await expect(page.locator('p:has-text("Mon panier")')).toBeVisible();
    await page.click('button:has-text("Passer la commande")');

    // Étape adresse
    await page.locator('#delivery-street').fill('15 Rue de Rivoli');
    await page.locator('#delivery-postal').fill('75004');
    await page.locator('#delivery-city').fill('Paris');
    await page.click('button:has-text("Continuer vers le paiement")');

    // Étape paiement (sélectionner la carte ajoutée)
    await page.click('text=4242');
    await page.click('button:has-text("Confirmer")');

    // Vérification du succès (écran de confirmation + OSRM)
    await page.waitForSelector('text=Commande confirmée');
    await expect(page.locator('text=Livraison estimée')).toBeVisible();
    await page.click('button:has-text("Voir ma commande")');

    // Vérification de la redirection finale
    await expect(page).toHaveURL(/\/dashboard\/orders/);
  });
});
