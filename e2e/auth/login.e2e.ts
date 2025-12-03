import { test, expect } from '../fixtures';
import { testUsers } from '../fixtures/test-data';

/**
 * Testy E2E dla funkcjonalności logowania
 * Wykorzystują Page Object Model dla łatwego utrzymania
 */

test.describe('Logowanie użytkownika', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('powinien wyświetlić formularz logowania', async ({ page }) => {
    await expect(page).toHaveTitle(/logowanie/i);
    await expect(page.getByRole('heading', { name: /logowanie/i })).toBeVisible();
  });

  test('powinien zalogować użytkownika z poprawnymi danymi', async ({ loginPage, page }) => {
    await loginPage.login(testUsers.valid.email, testUsers.valid.password);
    
    // Oczekuj przekierowania na stronę główną
    await loginPage.waitForNavigation();
    await expect(page).toHaveURL('/');
  });

  test('powinien pokazać błąd przy niepoprawnych danych', async ({ loginPage }) => {
    await loginPage.login(testUsers.invalid.email, testUsers.invalid.password);
    
    // Sprawdź komunikat błędu
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/nieprawidłowe/i);
  });

  test('powinien walidować format email', async ({ loginPage, page }) => {
    await loginPage.emailInput.fill('niepoprawny-email');
    await loginPage.passwordInput.fill('Test1234!');
    await loginPage.submitButton.click();
    
    // HTML5 validation message
    const emailValidation = await loginPage.emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(emailValidation).toBeTruthy();
  });

  test('powinien wymagać hasła', async ({ loginPage, page }) => {
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.submitButton.click();
    
    // HTML5 validation message
    const passwordValidation = await loginPage.passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(passwordValidation).toBeTruthy();
  });
});

