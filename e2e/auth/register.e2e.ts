import { test, expect } from '../fixtures';
import { testUsers } from '../fixtures/test-data';

/**
 * Testy E2E dla funkcjonalności rejestracji
 */

test.describe('Rejestracja użytkownika', () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test('powinien wyświetlić formularz rejestracji', async ({ page }) => {
    await expect(page).toHaveTitle(/rejestracja/i);
    await expect(page.getByRole('heading', { name: /rejestracja/i })).toBeVisible();
  });

  test('powinien zarejestrować nowego użytkownika', async ({ registerPage, page }) => {
    const { email, password } = testUsers.newUser;
    
    await registerPage.register(email, password, password);
    
    // Oczekuj przekierowania lub komunikatu sukcesu
    await registerPage.waitForNavigation();
    await expect(page).toHaveURL('/');
  });

  test('powinien pokazać błąd gdy hasła nie pasują', async ({ registerPage }) => {
    const { email, password } = testUsers.newUser;
    
    await registerPage.register(email, password, 'DifferentPassword123!');
    
    // Sprawdź komunikat błędu
    await expect(registerPage.errorMessage).toBeVisible();
    await expect(registerPage.errorMessage).toContainText(/hasła.*różn/i);
  });

  test('powinien walidować siłę hasła', async ({ registerPage, page }) => {
    const { email } = testUsers.newUser;
    const weakPassword = '123';
    
    await registerPage.register(email, weakPassword, weakPassword);
    
    // Sprawdź komunikat błędu
    await expect(registerPage.errorMessage).toBeVisible();
  });

  test('powinien pokazać link do logowania', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /zaloguj/i });
    await expect(loginLink).toBeVisible();
    
    await loginLink.click();
    await expect(page).toHaveURL('/auth/login');
  });
});

