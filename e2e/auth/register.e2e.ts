import { test, expect } from '../fixtures';

/**
 * Testy E2E dla funkcjonalności rejestracji
 */

test.describe('Rejestracja użytkownika', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('powinien pokazać link do logowania', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /zaloguj/i });
    await expect(loginLink).toBeVisible();
    
    await loginLink.click();
    await expect(page).toHaveURL('/auth/login');
  });
});

