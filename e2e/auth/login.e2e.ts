import { test, expect } from "../fixtures";
import { testUsers } from "../fixtures/test-data";

/**
 * Testy E2E dla funkcjonalności logowania
 * Wykorzystują Page Object Model dla łatwego utrzymania
 */

test.describe("Logowanie użytkownika", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test("powinien walidować format email", async ({ loginPage, page }) => {
    await loginPage.emailInput.fill("niepoprawny-email");
    await loginPage.passwordInput.fill("Test1234!");
    await loginPage.submitButton.click();

    // HTML5 validation message
    const emailValidation = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(emailValidation).toBeTruthy();
  });
});
